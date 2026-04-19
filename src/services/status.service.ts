import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getCache, setCache } from '@utils/cache/cache.service';
import mongoose from 'mongoose';

import env from '@config/env.config';
import { getRedisClient } from '@config/redis.config';
import BlogModel from '@models/BlogPost.model';
import CertificateModel from '@models/Certificate.model';
import LabModel from '@models/Lab.model';
import ProjectModel from '@models/Project.model';
import { fetchGithubFollowers, fetchGithubRepoMetricsFromUrl } from '@services/githubMetrics.service';
import { fetchInstagramFollowers } from '@services/instagramMetrics.service';
import { getNotificationsNamespace } from '@sockets/index';

export type ServiceHealthStatus = 'online' | 'degraded' | 'offline';

export interface ServiceStatus {
  name: string;
  status: ServiceHealthStatus;
  detail: string;
}

export interface StatusSummary {
  projects: number;
  blog: number;
  certificates: number;
  labs: number;
  services: ServiceStatus[];
  generatedAt: number;
}

export interface PortfolioProjectMetrics {
  stars: number | null;
  forks: number | null;
  views: number;
}

export interface PortfolioStatusSummary {
  generatedAt: number;
  ttlSeconds: number;
  counts: {
    projects: number;
    posts: number;
    certificates: number;
    totalViews: number;
  };
  social: {
    githubFollowers: number | null;
    instagramFollowers: number | null;
    linkedin: string;
  };
  projectsMetricsBySlug: Record<string, PortfolioProjectMetrics>;
}

interface FetchPortfolioStatusOptions {
  forceRefresh?: boolean;
}

const CACHE_TTL = 30 * 1000; // 30 seconds
const PORTFOLIO_CACHE_KEY = 'status:portfolio:v1';
const PORTFOLIO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const LINKEDIN_PROFILE_URL = 'https://www.linkedin.com/in/luizfelippedev';

let cachedSummary: StatusSummary | null = null;
let portfolioSyncInterval: NodeJS.Timeout | null = null;

const mapMongoState = (readyState: number): ServiceStatus => {
  if (readyState === 1) {
    return { name: 'MongoDB', status: 'online', detail: 'Connected' };
  }
  if (readyState === 2) {
    return { name: 'MongoDB', status: 'degraded', detail: 'Connecting' };
  }
  return { name: 'MongoDB', status: 'offline', detail: 'Disconnected' };
};

const getRedisServiceStatus = async (): Promise<ServiceStatus> => {
  try {
    const redis = getRedisClient();
    const startedAt = Date.now();
    await redis.ping();
    const latency = Date.now() - startedAt;
    return {
      name: 'Redis',
      status: 'online',
      detail: `Ping ${latency}ms`
    };
  } catch {
    return {
      name: 'Redis',
      status: 'offline',
      detail: 'Unavailable'
    };
  }
};

const getSocketServiceStatus = (): ServiceStatus => {
  try {
    getNotificationsNamespace();
    return {
      name: 'WebSocket',
      status: 'online',
      detail: 'admin-alerts active'
    };
  } catch {
    return {
      name: 'WebSocket',
      status: 'degraded',
      detail: 'Namespace not ready'
    };
  }
};

const getStorageServiceStatus = async (): Promise<ServiceStatus> => {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  try {
    await fs.access(uploadsDir);
    return {
      name: 'Storage',
      status: 'online',
      detail: 'Uploads mounted'
    };
  } catch {
    return {
      name: 'Storage',
      status: 'degraded',
      detail: 'Uploads dir pending'
    };
  }
};

const sumAggResult = (rows: Array<{ total?: number }>): number => {
  const value = rows[0]?.total;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return 0;
};

const resolvePortfolioTtlSeconds = () => {
  const ttlCandidates = [env.GITHUB_METRICS_TTL_SECONDS, env.INSTAGRAM_METRICS_TTL_SECONDS, 60];
  return Math.max(...ttlCandidates);
};

const buildPortfolioMetricsBySlug = async () => {
  const projects = await ProjectModel.find(
    {},
    {
      slug: 1,
      repositoryUrl: 1,
      metrics: 1
    }
  ).lean();

  const entries = await Promise.all(
    projects.map(async (project) => {
      const slug = typeof project.slug === 'string' ? project.slug : '';
      if (!slug) {
        return null;
      }

      const githubMetrics = await fetchGithubRepoMetricsFromUrl(project.repositoryUrl);
      const localStars = typeof project.metrics?.stars === 'number' ? project.metrics.stars : null;
      const localForks = typeof project.metrics?.forks === 'number' ? project.metrics.forks : null;
      const views = typeof project.metrics?.views === 'number' ? project.metrics.views : 0;

      return [
        slug,
        {
          stars: githubMetrics?.stars ?? localStars,
          forks: githubMetrics?.forks ?? localForks,
          views
        }
      ] as const;
    })
  );

  const result: Record<string, PortfolioProjectMetrics> = {};

  for (const entry of entries) {
    if (!entry) {
      continue;
    }

    const [slug, metrics] = entry;
    result[slug] = metrics;
  }

  return result;
};

export const fetchStatusSummary = async (): Promise<StatusSummary> => {
  if (cachedSummary && Date.now() - cachedSummary.generatedAt < CACHE_TTL) {
    return cachedSummary;
  }

  const [projects, blog, certificates, labs, redis, storage] = await Promise.all([
    ProjectModel.countDocuments({}),
    BlogModel.countDocuments({}),
    CertificateModel.countDocuments({}),
    LabModel.countDocuments({ active: true }),
    getRedisServiceStatus(),
    getStorageServiceStatus()
  ]);

  const services: ServiceStatus[] = [
    { name: 'API', status: 'online', detail: `Uptime ${Math.floor(process.uptime() / 60)}m` },
    mapMongoState(mongoose.connection.readyState),
    redis,
    getSocketServiceStatus(),
    storage
  ];

  cachedSummary = {
    projects,
    blog,
    certificates,
    labs,
    services,
    generatedAt: Date.now()
  };

  return cachedSummary;
};

export const fetchPortfolioStatus = async (
  options: FetchPortfolioStatusOptions = {}
): Promise<PortfolioStatusSummary> => {
  if (!options.forceRefresh) {
    const cached = await getCache<PortfolioStatusSummary>(PORTFOLIO_CACHE_KEY);
    if (cached) {
      return cached;
    }
  }

  const [
    projectsCount,
    postsCount,
    certificatesCount,
    projectViewsAgg,
    postViewsAgg,
    certificateViewsAgg,
    projectsMetricsBySlug,
    githubFollowers,
    instagramFollowers
  ] = await Promise.all([
    ProjectModel.countDocuments({}),
    BlogModel.countDocuments({ published: true }),
    CertificateModel.countDocuments({}),
    ProjectModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$metrics.views', 0] } } } }
    ]),
    BlogModel.aggregate<{ total: number }>([
      { $match: { published: true } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$views', 0] } } } }
    ]),
    CertificateModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$metrics.views', 0] } } } }
    ]),
    buildPortfolioMetricsBySlug(),
    fetchGithubFollowers(),
    fetchInstagramFollowers()
  ]);

  const totalViews = sumAggResult(projectViewsAgg) + sumAggResult(postViewsAgg) + sumAggResult(certificateViewsAgg);

  const payload: PortfolioStatusSummary = {
    generatedAt: Date.now(),
    ttlSeconds: resolvePortfolioTtlSeconds(),
    counts: {
      projects: projectsCount,
      posts: postsCount,
      certificates: certificatesCount,
      totalViews
    },
    social: {
      githubFollowers,
      instagramFollowers,
      linkedin: LINKEDIN_PROFILE_URL
    },
    projectsMetricsBySlug
  };

  await setCache(PORTFOLIO_CACHE_KEY, payload, payload.ttlSeconds);
  return payload;
};

const broadcastPortfolioMetricsUpdate = (summary: PortfolioStatusSummary) => {
  try {
    const namespace = getNotificationsNamespace();

    namespace.to('public-metrics').emit('metrics:update', {
      generatedAt: summary.generatedAt,
      ttlSeconds: summary.ttlSeconds,
      counts: summary.counts,
      social: summary.social,
      projects: Object.entries(summary.projectsMetricsBySlug).map(([slug, metrics]) => ({
        slug,
        metrics
      }))
    });
  } catch {
    // sockets not ready; ignore
  }
};

export const syncPortfolioStatus = async (): Promise<PortfolioStatusSummary> => {
  const summary = await fetchPortfolioStatus({ forceRefresh: true });
  broadcastPortfolioMetricsUpdate(summary);
  return summary;
};

export const startPortfolioMetricsSync = (intervalMs = PORTFOLIO_SYNC_INTERVAL_MS) => {
  if (portfolioSyncInterval) {
    return;
  }

  const run = () => {
    void syncPortfolioStatus().catch(() => {
      // keep interval running even if external APIs fail
    });
  };

  run();
  portfolioSyncInterval = setInterval(run, intervalMs);
  portfolioSyncInterval.unref();
};

export const stopPortfolioMetricsSync = () => {
  if (!portfolioSyncInterval) {
    return;
  }

  clearInterval(portfolioSyncInterval);
  portfolioSyncInterval = null;
};

import { getCache, setCache } from '@utils/cache/cache.service';
import axios from 'axios';

import env from '@config/env.config';

const GITHUB_API_BASE_URL = 'https://api.github.com';

type NullableNumber = number | null;

interface GithubFollowersCacheEntry {
  followers: NullableNumber;
}

interface GithubRepoCacheEntry {
  stars: NullableNumber;
  forks: NullableNumber;
}

interface GithubRepoRef {
  owner: string;
  repo: string;
}

const normalizeRepo = (repo: string) => repo.replace(/\.git$/i, '');

export const parseGithubRepositoryRef = (repositoryUrl: string): GithubRepoRef | null => {
  const raw = repositoryUrl.trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/\/+$/, '');
  const httpsMatch = normalized.match(/^https?:\/\/(?:www\.)?github\.com\/([^\s/]+)\/([^\s/?#]+)$/i);
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: normalizeRepo(httpsMatch[2])
    };
  }

  const sshMatch = normalized.match(/^git@github\.com:([^\s/]+)\/([^\s]+)$/i);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: normalizeRepo(sshMatch[2])
    };
  }

  const shortMatch = normalized.match(/^(?:www\.)?github\.com\/([^\s/]+)\/([^\s/?#]+)$/i);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: normalizeRepo(shortMatch[2])
    };
  }

  return null;
};

const getGithubHeaders = () => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'portfolio-backend',
  ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {})
});

const getFollowersCacheKey = (username: string) => `metrics:github:followers:${username}`;
const getRepoCacheKey = ({ owner, repo }: GithubRepoRef) =>
  `metrics:github:repo:${owner.toLowerCase()}/${repo.toLowerCase()}`;

export const fetchGithubFollowers = async (username = env.GITHUB_USERNAME): Promise<NullableNumber> => {
  if (!username) {
    return null;
  }

  const cacheKey = getFollowersCacheKey(username);
  const cached = await getCache<GithubFollowersCacheEntry>(cacheKey);
  if (cached) {
    return cached.followers;
  }

  try {
    const response = await axios.get<{ followers?: number }>(`${GITHUB_API_BASE_URL}/users/${username}`, {
      headers: getGithubHeaders(),
      timeout: 7_000
    });

    const followers =
      typeof response.data?.followers === 'number' && Number.isFinite(response.data.followers)
        ? response.data.followers
        : null;

    await setCache(cacheKey, { followers }, env.GITHUB_METRICS_TTL_SECONDS);
    return followers;
  } catch {
    await setCache(cacheKey, { followers: null }, env.GITHUB_METRICS_TTL_SECONDS);
    return null;
  }
};

export const fetchGithubRepoMetrics = async ({ owner, repo }: GithubRepoRef): Promise<GithubRepoCacheEntry> => {
  const cacheKey = getRepoCacheKey({ owner, repo });
  const cached = await getCache<GithubRepoCacheEntry>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get<{ stargazers_count?: number; forks_count?: number }>(
      `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`,
      {
        headers: getGithubHeaders(),
        timeout: 7_000
      }
    );

    const stars =
      typeof response.data?.stargazers_count === 'number' && Number.isFinite(response.data.stargazers_count)
        ? response.data.stargazers_count
        : null;

    const forks =
      typeof response.data?.forks_count === 'number' && Number.isFinite(response.data.forks_count)
        ? response.data.forks_count
        : null;

    const payload: GithubRepoCacheEntry = { stars, forks };
    await setCache(cacheKey, payload, env.GITHUB_METRICS_TTL_SECONDS);
    return payload;
  } catch {
    const fallback: GithubRepoCacheEntry = { stars: null, forks: null };
    await setCache(cacheKey, fallback, env.GITHUB_METRICS_TTL_SECONDS);
    return fallback;
  }
};

export const fetchGithubRepoMetricsFromUrl = async (
  repositoryUrl?: string | null
): Promise<GithubRepoCacheEntry | null> => {
  if (!repositoryUrl) {
    return null;
  }

  const ref = parseGithubRepositoryRef(repositoryUrl);
  if (!ref) {
    return null;
  }

  return fetchGithubRepoMetrics(ref);
};

export type { GithubRepoCacheEntry, GithubRepoRef };

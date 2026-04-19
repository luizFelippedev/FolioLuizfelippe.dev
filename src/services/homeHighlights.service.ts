import type { Types } from 'mongoose';

import BlogPostModel from '@models/BlogPost.model';
import CertificateModel from '@models/Certificate.model';
import ProjectModel from '@models/Project.model';
import type { RequestAudienceContext, PublicAccessDescriptor } from '@services/audienceAccess.service';
import {
  buildAccessDescriptor,
  normalizeVisibleToSegments
} from '@services/audienceAccess.service';
import { fetchGithubRepoMetricsFromUrl } from '@services/githubMetrics.service';

export type HomeHighlightContentType = 'project' | 'blog' | 'certificate';

export interface HomeHighlightItem {
  contentType: HomeHighlightContentType;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  mediaUrl?: string;
  tags?: string[];
  metrics?: {
    stars?: number | null;
    forks?: number | null;
    views?: number;
  };
  pinnedAt?: Date;
  updatedAt: Date;
  link: string;
  visibleToSegments: Array<'company' | 'recruiter' | 'visitor'>;
  access: PublicAccessDescriptor;
}

export interface ListHomeHighlightsOptions {
  page: number;
  limit: number;
}

export interface HomeHighlightsResult {
  page: number;
  limit: number;
  hasMore: boolean;
  data: HomeHighlightItem[];
}

type IdLike = string | Types.ObjectId;

const toId = (value: IdLike | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if ('toString' in value && typeof value.toString === 'function') return value.toString();
  return '';
};

const asDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const toDateValue = (value: Date | undefined): number => (value ? value.getTime() : 0);

const toSortEpoch = (item: HomeHighlightItem): number => {
  return toDateValue(item.pinnedAt ?? item.updatedAt);
};

const pickTags = (tags: unknown): string[] | undefined => {
  if (!Array.isArray(tags)) return undefined;
  const normalized = tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  return normalized.length > 0 ? normalized : undefined;
};

const isPresent = <T>(value: T | null | undefined): value is T => value !== null && value !== undefined;

const normalizeProjectHighlights = async (
  context: Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>
): Promise<HomeHighlightItem[]> => {
  const projects = await ProjectModel.find(
    { featured: true },
    {
      _id: 1,
      slug: 1,
      title: 1,
      description: 1,
      heroImage: 1,
      gallery: 1,
      repositoryUrl: 1,
      technologies: 1,
      metrics: 1,
      visibleToSegments: 1,
      pinnedAt: 1,
      updatedAt: 1
    }
  ).lean();

  const normalized = await Promise.all(
    projects.map(async (project) => {
      const id = toId(project._id);
      if (!id) return null;

      const slug = typeof project.slug === 'string' && project.slug ? project.slug : id;
      const githubMetrics = await fetchGithubRepoMetricsFromUrl(project.repositoryUrl);
      const localViews = typeof project.metrics?.views === 'number' ? project.metrics.views : 0;
      const localStars = typeof project.metrics?.stars === 'number' ? project.metrics.stars : null;
      const localForks = typeof project.metrics?.forks === 'number' ? project.metrics.forks : null;
      const mediaUrl =
        typeof project.heroImage?.url === 'string'
          ? project.heroImage.url
          : typeof project.gallery?.[0]?.url === 'string'
            ? project.gallery[0].url
            : undefined;
      const access = buildAccessDescriptor({
        visibleToSegments: project.visibleToSegments,
        viewerSegment: context.viewerSegment,
        isAdminBypass: context.isAdminBypass
      });

      return {
        contentType: 'project' as const,
        id,
        slug,
        title: typeof project.title === 'string' ? project.title : slug,
        subtitle: typeof project.description === 'string' ? project.description : '',
        mediaUrl,
        tags: access.locked ? undefined : pickTags(project.technologies),
        metrics: {
          stars: githubMetrics?.stars ?? localStars,
          forks: githubMetrics?.forks ?? localForks,
          views: localViews
        },
        pinnedAt: asDate(project.pinnedAt),
        updatedAt: asDate(project.updatedAt) ?? new Date(0),
        link: '/projects',
        visibleToSegments: normalizeVisibleToSegments(project.visibleToSegments),
        access
      };
    })
  );

  return normalized.filter(isPresent);
};

const normalizeBlogHighlights = async (
  context: Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>
): Promise<HomeHighlightItem[]> => {
  const posts = await BlogPostModel.find(
    { featured: true, published: true },
    {
      _id: 1,
      slug: 1,
      title: 1,
      excerpt: 1,
      coverImage: 1,
      gallery: 1,
      tags: 1,
      views: 1,
      visibleToSegments: 1,
      pinnedAt: 1,
      updatedAt: 1
    }
  ).lean();

  return posts
    .map((post) => {
      const id = toId(post._id);
      if (!id) return null;

      const slug = typeof post.slug === 'string' && post.slug ? post.slug : id;
      const mediaUrl =
        typeof post.coverImage?.url === 'string'
          ? post.coverImage.url
          : typeof post.gallery?.[0]?.url === 'string'
            ? post.gallery[0].url
            : undefined;
      const access = buildAccessDescriptor({
        visibleToSegments: post.visibleToSegments,
        viewerSegment: context.viewerSegment,
        isAdminBypass: context.isAdminBypass
      });

      return {
        contentType: 'blog' as const,
        id,
        slug,
        title: typeof post.title === 'string' ? post.title : slug,
        subtitle: typeof post.excerpt === 'string' ? post.excerpt : '',
        mediaUrl,
        tags: pickTags(post.tags),
        metrics: {
          views: typeof post.views === 'number' ? post.views : 0
        },
        pinnedAt: asDate(post.pinnedAt),
        updatedAt: asDate(post.updatedAt) ?? new Date(0),
        link: '/blog',
        visibleToSegments: normalizeVisibleToSegments(post.visibleToSegments),
        access
      };
    })
    .filter(isPresent);
};

const normalizeCertificateHighlights = async (
  context: Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>
): Promise<HomeHighlightItem[]> => {
  const certificates = await CertificateModel.find(
    { featured: true },
    {
      _id: 1,
      slug: 1,
      title: 1,
      issuer: 1,
      previewImage: 1,
      attachments: 1,
      skills: 1,
      metrics: 1,
      visibleToSegments: 1,
      pinnedAt: 1,
      updatedAt: 1
    }
  ).lean();

  return certificates
    .map((certificate) => {
      const id = toId(certificate._id);
      if (!id) return null;

      const slug = typeof certificate.slug === 'string' && certificate.slug ? certificate.slug : id;
      const mediaUrl =
        typeof certificate.previewImage?.url === 'string'
          ? certificate.previewImage.url
          : typeof certificate.attachments?.[0]?.url === 'string'
            ? certificate.attachments[0].url
            : undefined;
      const access = buildAccessDescriptor({
        visibleToSegments: certificate.visibleToSegments,
        viewerSegment: context.viewerSegment,
        isAdminBypass: context.isAdminBypass
      });

      return {
        contentType: 'certificate' as const,
        id,
        slug,
        title: typeof certificate.title === 'string' ? certificate.title : slug,
        subtitle: typeof certificate.issuer === 'string' ? certificate.issuer : '',
        mediaUrl,
        tags: access.locked ? undefined : pickTags(certificate.skills),
        metrics: {
          views: typeof certificate.metrics?.views === 'number' ? certificate.metrics.views : 0
        },
        pinnedAt: asDate(certificate.pinnedAt),
        updatedAt: asDate(certificate.updatedAt) ?? new Date(0),
        link: '/certificates',
        visibleToSegments: normalizeVisibleToSegments(certificate.visibleToSegments),
        access
      };
    })
    .filter(isPresent);
};

export const listHomeHighlights = async ({
  page,
  limit,
  viewerSegment,
  isAdminBypass
}: ListHomeHighlightsOptions & Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>): Promise<HomeHighlightsResult> => {
  const [projects, posts, certificates] = await Promise.all([
    normalizeProjectHighlights({ viewerSegment, isAdminBypass }),
    normalizeBlogHighlights({ viewerSegment, isAdminBypass }),
    normalizeCertificateHighlights({ viewerSegment, isAdminBypass })
  ]);

  const all = [...projects, ...posts, ...certificates].sort((a, b) => toSortEpoch(b) - toSortEpoch(a));
  const skip = Math.max(0, (page - 1) * limit);
  const data = all.slice(skip, skip + limit);

  return {
    page,
    limit,
    hasMore: skip + limit < all.length,
    data
  };
};

import type { Request } from 'express';

import UserModel from '@models/User.model';
import type {
  IBlogPost,
  BlogLevel
} from '@models/BlogPost.model';
import type {
  ICertificate,
  CertificateLevel,
  CertificateCategory
} from '@models/Certificate.model';
import type { IProject, ProjectLevel } from '@models/Project.model';
import type { VisitorSegment } from '@models/VisitorSession.model';
import { resolveVisitorAccessContext } from '@services/visitor.service';
import { verifyAccessToken } from '@utils/helpers/token.helper';

export const DEFAULT_VISIBLE_SEGMENTS: VisitorSegment[] = ['company', 'recruiter', 'visitor'];

export type PublicAccessState = 'allowed' | 'locked' | 'unidentified';

export interface PublicAccessDescriptor {
  locked: boolean;
  visibleToSegments: VisitorSegment[];
  viewerSegment?: VisitorSegment;
  state: PublicAccessState;
}

export interface RequestAudienceContext {
  viewerSegment?: VisitorSegment;
  session: Awaited<ReturnType<typeof resolveVisitorAccessContext>>['session'];
  account: Awaited<ReturnType<typeof resolveVisitorAccessContext>>['account'];
  isAdminBypass: boolean;
}

type ProjectLike = Partial<IProject> & Record<string, unknown>;
type CertificateLike = Partial<ICertificate> & Record<string, unknown>;
type BlogLike = Partial<IBlogPost> & Record<string, unknown>;

const isVisitorSegment = (value: unknown): value is VisitorSegment =>
  value === 'company' || value === 'recruiter' || value === 'visitor';

export const normalizeVisibleToSegments = (value: unknown): VisitorSegment[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_VISIBLE_SEGMENTS];
  }

  const normalized = value.filter(isVisitorSegment);
  return normalized.length > 0 ? Array.from(new Set(normalized)) : [...DEFAULT_VISIBLE_SEGMENTS];
};

export const buildAccessDescriptor = ({
  visibleToSegments,
  viewerSegment,
  isAdminBypass = false
}: {
  visibleToSegments: unknown;
  viewerSegment?: VisitorSegment;
  isAdminBypass?: boolean;
}): PublicAccessDescriptor => {
  const normalizedSegments = normalizeVisibleToSegments(visibleToSegments);

  if (isAdminBypass) {
    return {
      locked: false,
      visibleToSegments: normalizedSegments,
      viewerSegment,
      state: 'allowed'
    };
  }

  if (!viewerSegment) {
    return {
      locked: false,
      visibleToSegments: normalizedSegments,
      viewerSegment,
      state: 'unidentified'
    };
  }

  const allowed = normalizedSegments.includes(viewerSegment);

  return {
    locked: !allowed,
    visibleToSegments: normalizedSegments,
    viewerSegment,
    state: allowed ? 'allowed' : 'locked'
  };
};

const tryResolveAdminBypass = async (req: Request) => {
  const token = req.cookies?.accessToken;
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).lean();

    return Boolean(
      user &&
        user.email.toLowerCase() === payload.email.toLowerCase() &&
        user.role === 'admin' &&
        user.isActive
    );
  } catch {
    return false;
  }
};

export const resolveRequestAudienceContext = async (req: Request): Promise<RequestAudienceContext> => {
  const isAdminBypass = await tryResolveAdminBypass(req);

  if (isAdminBypass) {
    return {
      viewerSegment: undefined,
      session: null,
      account: null,
      isAdminBypass: true
    };
  }

  const context = await resolveVisitorAccessContext(req.cookies?.portfolioVisitorSession ?? null);
  return {
    ...context,
    isAdminBypass: false
  };
};

const resolveProjectTeaserDescription = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  return value.trim().slice(0, 220);
};

export const serializeProjectForAudience = (
  project: ProjectLike,
  context: Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>
) => {
  const access = buildAccessDescriptor({
    visibleToSegments: project.visibleToSegments,
    viewerSegment: context.viewerSegment,
    isAdminBypass: context.isAdminBypass
  });

  const base = {
    id: String(project._id ?? project.id ?? ''),
    title: typeof project.title === 'string' ? project.title : '',
    slug: typeof project.slug === 'string' ? project.slug : '',
    description: resolveProjectTeaserDescription(project.description),
    category: typeof project.category === 'string' ? project.category : '',
    level: (typeof project.level === 'string' ? project.level : 'intermediate') as ProjectLevel,
    heroImage:
      project.heroImage && typeof project.heroImage === 'object'
        ? (project.heroImage as IProject['heroImage'])
        : undefined,
    metrics:
      project.metrics && typeof project.metrics === 'object'
        ? (project.metrics as IProject['metrics'])
        : undefined,
    featured: Boolean(project.featured),
    pinnedAt: project.pinnedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    visibleToSegments: access.visibleToSegments,
    access
  };

  if (access.locked) {
    return base;
  }

  return {
    ...base,
    technologies: Array.isArray(project.technologies)
      ? project.technologies.filter((item): item is string => typeof item === 'string')
      : [],
    gallery: Array.isArray(project.gallery) ? project.gallery : [],
    liveUrl: typeof project.liveUrl === 'string' ? project.liveUrl : undefined,
    repositoryUrl: typeof project.repositoryUrl === 'string' ? project.repositoryUrl : undefined
  };
};

export const serializeCertificateForAudience = (
  certificate: CertificateLike,
  context: Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>
) => {
  const access = buildAccessDescriptor({
    visibleToSegments: certificate.visibleToSegments,
    viewerSegment: context.viewerSegment,
    isAdminBypass: context.isAdminBypass
  });

  const base = {
    id: String(certificate._id ?? certificate.id ?? ''),
    title: typeof certificate.title === 'string' ? certificate.title : '',
    slug: typeof certificate.slug === 'string' ? certificate.slug : '',
    issuer: typeof certificate.issuer === 'string' ? certificate.issuer : '',
    issueDate: certificate.issueDate,
    expiryDate: certificate.expiryDate,
    category: (typeof certificate.category === 'string' ? certificate.category : 'other') as CertificateCategory,
    level: (typeof certificate.level === 'string' ? certificate.level : 'intermediate') as CertificateLevel,
    previewImage:
      certificate.previewImage && typeof certificate.previewImage === 'object'
        ? (certificate.previewImage as ICertificate['previewImage'])
        : undefined,
    metrics:
      certificate.metrics && typeof certificate.metrics === 'object'
        ? (certificate.metrics as ICertificate['metrics'])
        : undefined,
    featured: Boolean(certificate.featured),
    pinnedAt: certificate.pinnedAt,
    createdAt: certificate.createdAt,
    updatedAt: certificate.updatedAt,
    visibleToSegments: access.visibleToSegments,
    access
  };

  if (access.locked) {
    return base;
  }

  return {
    ...base,
    skills: Array.isArray(certificate.skills)
      ? certificate.skills.filter((item): item is string => typeof item === 'string')
      : [],
    credentialId: typeof certificate.credentialId === 'string' ? certificate.credentialId : undefined,
    credentialUrl: typeof certificate.credentialUrl === 'string' ? certificate.credentialUrl : undefined,
    attachments: Array.isArray(certificate.attachments) ? certificate.attachments : [],
    highlights: Array.isArray(certificate.highlights)
      ? certificate.highlights.filter((item): item is string => typeof item === 'string')
      : []
  };
};

export const serializeBlogPostForAudience = (
  post: BlogLike,
  context: Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>
) => {
  const access = buildAccessDescriptor({
    visibleToSegments: post.visibleToSegments,
    viewerSegment: context.viewerSegment,
    isAdminBypass: context.isAdminBypass
  });

  const base = {
    id: String(post._id ?? post.id ?? ''),
    title: typeof post.title === 'string' ? post.title : '',
    slug: typeof post.slug === 'string' ? post.slug : '',
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : '',
    coverImage:
      post.coverImage && typeof post.coverImage === 'object'
        ? (post.coverImage as IBlogPost['coverImage'])
        : undefined,
    categories: Array.isArray(post.categories)
      ? post.categories.filter((item): item is string => typeof item === 'string')
      : [],
    tags: Array.isArray(post.tags) ? post.tags.filter((item): item is string => typeof item === 'string') : [],
    level: (typeof post.level === 'string' ? post.level : 'intermediate') as BlogLevel,
    readTime: typeof post.readTime === 'number' ? post.readTime : 5,
    published: Boolean(post.published),
    publishedAt: post.publishedAt,
    featured: Boolean(post.featured),
    pinnedAt: post.pinnedAt,
    views: typeof post.views === 'number' ? post.views : 0,
    likes: typeof post.likes === 'number' ? post.likes : 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    visibleToSegments: access.visibleToSegments,
    access
  };

  if (access.locked) {
    return base;
  }

  return {
    ...base,
    content: typeof post.content === 'string' ? post.content : '',
    gallery: Array.isArray(post.gallery) ? post.gallery : [],
    comments: Array.isArray(post.comments) ? post.comments : [],
    seo: post.seo && typeof post.seo === 'object' ? post.seo : undefined
  };
};

import { invalidateCachePrefix } from '@utils/cache/cache.service';
import { AppError } from '@utils/helpers/error.helper';
import { broadcastViewUpdate } from '@utils/helpers/notifications';
import { parsePagination } from '@utils/helpers/pagination.helper';
import { successResponse } from '@utils/helpers/response.helper';
import { getClientIp } from '@utils/network/clientIp';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { recordActivity } from '@services/activityLog.service';
import {
  resolveRequestAudienceContext,
  serializeProjectForAudience
} from '@services/audienceAccess.service';
import {
  createProject,
  deleteProject,
  enrichProjectWithLiveMetrics,
  enrichProjectsWithLiveMetrics,
  getFeaturedProjects,
  getProjectById,
  getProjectBySlug,
  getProjects,
  incrementProjectView,
  updateProject
} from '@services/projects.service';
import { trackUniqueView } from '@services/viewTracking.service';
import type { CreateProjectInput, UpdateProjectInput } from '@validators/project.validator';

const normalizeProjectMedia = (payload: Partial<CreateProjectInput> | Partial<UpdateProjectInput>) => {
  const gallery = Array.isArray(payload.gallery) ? payload.gallery : undefined;
  const heroUrl = payload.heroImage?.url;

  if (heroUrl && gallery) {
    const hasHero = gallery.some((item) => item.url === heroUrl);
    if (!hasHero) {
      payload.gallery = [{ url: heroUrl }, ...gallery];
    }
  }

  if (!payload.heroImage && gallery && gallery.length > 0) {
    payload.heroImage = gallery[0];
  }

  if (!gallery && heroUrl) {
    payload.gallery = [{ url: heroUrl }];
  }
};

export const listProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 12,
      allowedSortFields: ['createdAt', 'order', 'title']
    });

    const filters: Record<string, unknown> = {};
    if (typeof req.query.featured === 'string') {
      filters.featured = req.query.featured === 'true';
    }
    if (typeof req.query.category === 'string') {
      filters.category = req.query.category;
    }
    if (typeof req.query.level === 'string') {
      filters.level = req.query.level;
    }
    if (typeof req.query.technology === 'string') {
      filters.technologies = req.query.technology;
    }

    const projects = await getProjects({
      skip: pagination.skip,
      limit: pagination.limit,
      sort: pagination.sort,
      filters
    });
    const audienceContext = await resolveRequestAudienceContext(req);
    const enrichedProjects = await enrichProjectsWithLiveMetrics(
      projects as unknown as Array<Record<string, unknown>>
    );
    return successResponse(res, {
      page: pagination.page,
      limit: pagination.limit,
      data: enrichedProjects.map((project) => serializeProjectForAudience(project, audienceContext))
    });
  } catch (error) {
    return next(error);
  }
};

export const listFeaturedProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 8,
      allowedSortFields: ['createdAt', 'order']
    });

    const projects = await getFeaturedProjects({
      skip: pagination.skip,
      limit: pagination.limit,
      sort: pagination.sort
    });
    const audienceContext = await resolveRequestAudienceContext(req);
    const enrichedProjects = await enrichProjectsWithLiveMetrics(
      projects as unknown as Array<Record<string, unknown>>
    );
    return successResponse(res, {
      page: pagination.page,
      limit: pagination.limit,
      data: enrichedProjects.map((project) => serializeProjectForAudience(project, audienceContext))
    });
  } catch (error) {
    return next(error);
  }
};

export const getProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', StatusCodes.NOT_FOUND));
    }

    const audienceContext = await resolveRequestAudienceContext(req);
    const enrichedProject = await enrichProjectWithLiveMetrics(project);
    return successResponse(res, serializeProjectForAudience(enrichedProject ?? {}, audienceContext));
  } catch (error) {
    return next(error);
  }
};

export const createProjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    normalizeProjectMedia(req.body);
    const project = await createProject(req.body);
    await Promise.all([
      invalidateCachePrefix('projects:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'project:create',
        actor: req.user,
        target: { id: project._id.toString(), type: 'Project' },
        metadata: { slug: project.slug }
      })
    ]);
    return successResponse(res, project, 'Project created', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const updateProjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    normalizeProjectMedia(req.body);
    const project = await updateProject(req.params.id, req.body);

    if (!project) {
      return next(new AppError('Project not found', StatusCodes.NOT_FOUND));
    }

    await Promise.all([
      invalidateCachePrefix('projects:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'project:update',
        actor: req.user,
        target: { id: req.params.id, type: 'Project' },
        metadata: { slug: project.slug }
      })
    ]);

    return successResponse(res, project, 'Project updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteProjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await deleteProject(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', StatusCodes.NOT_FOUND));
    }

    await Promise.all([
      invalidateCachePrefix('projects:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'project:delete',
        actor: req.user,
        target: { id: req.params.id, type: 'Project' },
        metadata: { slug: project.slug }
      })
    ]);

    return successResponse(res, project, 'Project deleted');
  } catch (error) {
    return next(error);
  }
};

export const registerProjectView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const ipAddress = getClientIp(req);

    const viewResult = await trackUniqueView({
      contentType: 'project',
      contentKey: slug,
      ipAddress
    });

    const project = viewResult.counted
      ? await incrementProjectView(slug)
      : await getProjectBySlug(slug);

    if (!project) {
      return next(new AppError('Project not found', StatusCodes.NOT_FOUND));
    }

    const totalViews = project.metrics?.views ?? 0;

    if (viewResult.counted) {
      broadcastViewUpdate({
        contentType: 'project',
        contentKey: slug,
        views: totalViews
      });
    }

    return successResponse(res, {
      views: totalViews,
      counted: viewResult.counted
    });
  } catch (error) {
    return next(error);
  }
};

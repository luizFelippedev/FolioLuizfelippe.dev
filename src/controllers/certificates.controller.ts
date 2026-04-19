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
  serializeCertificateForAudience
} from '@services/audienceAccess.service';
import {
  createCertificate,
  deleteCertificate,
  getCertificateById,
  getCertificateBySlug,
  incrementCertificateView,
  listCertificates,
  updateCertificate
} from '@services/certificates.service';
import { trackUniqueView } from '@services/viewTracking.service';

export const getCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 12,
      allowedSortFields: ['issueDate', 'title']
    });

    const { level, featured } = req.query as { level?: string; featured?: string };
    const filters: Record<string, unknown> = {};
    if (level) {
      filters.level = level;
    }
    if (featured !== undefined) {
      filters.featured = featured === 'true';
    }

    const certificates = await listCertificates({
      skip: pagination.skip,
      limit: pagination.limit,
      sort: pagination.sort,
      filters
    });
    const audienceContext = await resolveRequestAudienceContext(req);

    return successResponse(res, {
      page: pagination.page,
      limit: pagination.limit,
      data: certificates.map((certificate) => serializeCertificateForAudience(certificate.toObject(), audienceContext))
    });
  } catch (error) {
    return next(error);
  }
};

export const getCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificate = await getCertificateById(req.params.id);

    if (!certificate) {
      return next(new AppError('Certificate not found', StatusCodes.NOT_FOUND));
    }

    const audienceContext = await resolveRequestAudienceContext(req);
    return successResponse(res, serializeCertificateForAudience(certificate.toObject(), audienceContext));
  } catch (error) {
    return next(error);
  }
};

export const createCertificateHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificate = await createCertificate(req.body);
    await Promise.all([
      invalidateCachePrefix('certificates:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'certificate:create',
        actor: req.user,
        target: { id: certificate._id.toString(), type: 'Certificate' },
        metadata: { slug: certificate.slug }
      })
    ]);
    return successResponse(res, certificate, 'Certificate created', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const updateCertificateHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificate = await updateCertificate(req.params.id, req.body);

    if (!certificate) {
      return next(new AppError('Certificate not found', StatusCodes.NOT_FOUND));
    }

    await Promise.all([
      invalidateCachePrefix('certificates:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'certificate:update',
        actor: req.user,
        target: { id: req.params.id, type: 'Certificate' },
        metadata: { slug: certificate.slug }
      })
    ]);

    return successResponse(res, certificate, 'Certificate updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteCertificateHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificate = await deleteCertificate(req.params.id);

    if (!certificate) {
      return next(new AppError('Certificate not found', StatusCodes.NOT_FOUND));
    }

    await Promise.all([
      invalidateCachePrefix('certificates:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'certificate:delete',
        actor: req.user,
        target: { id: req.params.id, type: 'Certificate' },
        metadata: { slug: certificate.slug }
      })
    ]);

    return successResponse(res, certificate, 'Certificate deleted');
  } catch (error) {
    return next(error);
  }
};

export const registerCertificateView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const ipAddress = getClientIp(req);
    const viewResult = await trackUniqueView({
      contentType: 'certificate',
      contentKey: slug,
      ipAddress
    });

    const certificate = viewResult.counted
      ? await incrementCertificateView(slug)
      : await getCertificateBySlug(slug);

    if (!certificate) {
      return next(new AppError('Certificate not found', StatusCodes.NOT_FOUND));
    }

    const totalViews = certificate.metrics?.views ?? 0;

    if (viewResult.counted) {
      broadcastViewUpdate({
        contentType: 'certificate',
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

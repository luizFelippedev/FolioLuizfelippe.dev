import { invalidateCachePrefix } from '@utils/cache/cache.service';
import { AppError } from '@utils/helpers/error.helper';
import { parsePagination } from '@utils/helpers/pagination.helper';
import { successResponse } from '@utils/helpers/response.helper';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { recordActivity } from '@services/activityLog.service';
import { createCertificate, deleteCertificate, getCertificateById, listCertificates, updateCertificate } from '@services/certificates.service';

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

    return successResponse(res, {
      page: pagination.page,
      limit: pagination.limit,
      data: certificates
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

    return successResponse(res, certificate);
  } catch (error) {
    return next(error);
  }
};

export const createCertificateHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificate = await createCertificate(req.body);
    await Promise.all([
      invalidateCachePrefix('certificates:'),
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

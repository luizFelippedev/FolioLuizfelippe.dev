import { Router } from 'express';

import {
  createCertificateHandler,
  deleteCertificateHandler,
  getCertificate,
  getCertificates,
  registerCertificateView,
  updateCertificateHandler
} from '@controllers/certificates.controller';
import trackAnalyticsEvent from '@middleware/analytics.middleware';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import cacheResponse from '@middleware/cache.middleware';
import validate from '@middleware/validation.middleware';
import { getAudienceCacheKeySuffix } from '@utils/visitor/visitorSession.helper';
import {
  certificateIdSchema,
  createCertificateSchema,
  listCertificatesQuerySchema,
  updateCertificateSchema
} from '@validators/certificate.validator';

const router = Router();

router.get(
  '/',
  validate(listCertificatesQuerySchema),
  cacheResponse((req) => {
    const keyParts = [
      'certificates',
      getAudienceCacheKeySuffix(req),
      String(req.query.level ?? 'all'),
      String(req.query.page ?? '1'),
      String(req.query.limit ?? ''),
      String(req.query.sortBy ?? ''),
      String(req.query.sortOrder ?? '')
    ];
    return keyParts.join(':');
  }, 180),
  getCertificates
);
router.post(
  '/:slug/views',
  trackAnalyticsEvent('certificate_view', {
    resolvePayload: (req) => ({ slug: req.params.slug })
  }),
  registerCertificateView
);
router.get(
  '/:id',
  validate(certificateIdSchema),
  cacheResponse((req) => `certificates:${req.params.id}:${getAudienceCacheKeySuffix(req)}`, 300),
  getCertificate
);
router.post('/', authenticate, authorizeAction('certificates:manage'), validate(createCertificateSchema), createCertificateHandler);
router.put(
  '/:id',
  authenticate,
  authorizeAction('certificates:manage'),
  validate(updateCertificateSchema),
  updateCertificateHandler
);
router.delete(
  '/:id',
  authenticate,
  authorizeAction('certificates:manage'),
  validate(certificateIdSchema),
  deleteCertificateHandler
);

export default router;

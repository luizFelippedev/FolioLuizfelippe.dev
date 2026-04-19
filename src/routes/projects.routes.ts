import { Router } from 'express';

import {
  createProjectHandler,
  deleteProjectHandler,
  getProject,
  listFeaturedProjects,
  listProjects,
  registerProjectView,
  updateProjectHandler
} from '@controllers/projects.controller';
import trackAnalyticsEvent from '@middleware/analytics.middleware';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import cacheResponse from '@middleware/cache.middleware';
import validate from '@middleware/validation.middleware';
import { getAudienceCacheKeySuffix } from '@utils/visitor/visitorSession.helper';
import {
  createProjectSchema,
  listFeaturedProjectsQuerySchema,
  listProjectsQuerySchema,
  projectIdSchema,
  updateProjectSchema
} from '@validators/project.validator';

const router = Router();

router.get(
  '/',
  validate(listProjectsQuerySchema),
  cacheResponse((req) => {
    const keyParts = [
      'projects:all',
      getAudienceCacheKeySuffix(req),
      String(req.query.page ?? '1'),
      String(req.query.limit ?? ''),
      String(req.query.sortBy ?? ''),
      String(req.query.sortOrder ?? ''),
      String(req.query.featured ?? ''),
      String(req.query.category ?? ''),
      String(req.query.technology ?? '')
    ];
    return keyParts.join(':');
  }, 120),
  listProjects
);
router.get(
  '/featured',
  validate(listFeaturedProjectsQuerySchema),
  cacheResponse((req) => {
    const keyParts = [
      'projects:featured',
      getAudienceCacheKeySuffix(req),
      String(req.query.page ?? '1'),
      String(req.query.limit ?? ''),
      String(req.query.sortBy ?? ''),
      String(req.query.sortOrder ?? '')
    ];
    return keyParts.join(':');
  }, 120),
  listFeaturedProjects
);
router.get(
  '/:id',
  validate(projectIdSchema),
  cacheResponse((req) => `projects:${req.params.id}:${getAudienceCacheKeySuffix(req)}`, 300),
  getProject
);
router.post(
  '/:slug/views',
  trackAnalyticsEvent('project_view', {
    resolvePayload: (req) => ({ slug: req.params.slug })
  }),
  registerProjectView
);
router.post('/', authenticate, authorizeAction('projects:manage'), validate(createProjectSchema), createProjectHandler);
router.put(
  '/:id',
  authenticate,
  authorizeAction('projects:manage'),
  validate(updateProjectSchema),
  updateProjectHandler
);
router.delete(
  '/:id',
  authenticate,
  authorizeAction('projects:manage'),
  validate(projectIdSchema),
  deleteProjectHandler
);

export default router;

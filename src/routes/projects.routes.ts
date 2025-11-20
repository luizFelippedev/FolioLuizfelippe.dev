import { Router } from 'express';

import {
  createProjectHandler,
  deleteProjectHandler,
  getProject,
  listFeaturedProjects,
  listProjects,
  updateProjectHandler
} from '@controllers/projects.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import cacheResponse from '@middleware/cache.middleware';
import validate from '@middleware/validation.middleware';
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
  cacheResponse((req) => `projects:${req.params.id}`, 300),
  getProject
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

import { Router } from 'express';

import adminRoutes from '@routes/admin.routes';
import analyticsRoutes from '@routes/analytics.routes';
import authRoutes from '@routes/auth.routes';
import blogRoutes from '@routes/blog.routes';
import certificateRoutes from '@routes/certificates.routes';
import contactRoutes from '@routes/contact.routes';
import docsRoutes from '@routes/docs.routes';
import labsRoutes from '@routes/labs.routes';
import newsletterRoutes from '@routes/newsletter.routes';
import projectRoutes from '@routes/projects.routes';
import searchRoutes from '@routes/search.routes';
import statusRoutes from '@routes/status.routes';
import testimonialRoutes from '@routes/testimonials.routes';
import uploadRoutes from '@routes/upload.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/certificates', certificateRoutes);
router.use('/blog', blogRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/contact', contactRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/search', searchRoutes);
router.use('/upload', uploadRoutes);
router.use('/uploads', uploadRoutes);
router.use('/labs', labsRoutes);
router.use('/status', statusRoutes);
router.use('/admin', adminRoutes);
router.use('/docs', docsRoutes);

export default router;

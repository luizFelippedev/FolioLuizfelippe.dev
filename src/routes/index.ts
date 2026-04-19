import { Router } from 'express';

import adminRoutes from '@routes/admin.routes';
import analyticsRoutes from '@routes/analytics.routes';
import authRoutes from '@routes/auth.routes';
import blogRoutes from '@routes/blog.routes';
import certificateRoutes from '@routes/certificates.routes';
import chatRoutes from '@routes/chat.routes';
import contactRoutes from '@routes/contact.routes';
import contentRoutes from '@routes/content.routes';
import docsRoutes from '@routes/docs.routes';
import highlightsRoutes from '@routes/highlights.routes';
import labsRoutes from '@routes/labs.routes';
import newsletterRoutes from '@routes/newsletter.routes';
import projectRoutes from '@routes/projects.routes';
import searchRoutes from '@routes/search.routes';
import statusRoutes from '@routes/status.routes';
import testimonialRoutes from '@routes/testimonials.routes';
import uploadRoutes from '@routes/upload.routes';
import visitorRoutes from '@routes/visitor.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'portfolio-backend',
      message: 'API root is available. Use the resource routes under /api/*.',
      routes: [
        '/api/auth',
        '/api/projects',
        '/api/certificates',
        '/api/blog',
        '/api/chat',
        '/api/status',
        '/api/visitor',
        '/api/admin'
      ]
    }
  });
});

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
router.use('/chat', chatRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/contact', contactRoutes);
router.use('/content', contentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/search', searchRoutes);
router.use('/upload', uploadRoutes);
router.use('/uploads', uploadRoutes);
router.use('/labs', labsRoutes);
router.use('/status', statusRoutes);
router.use('/highlights', highlightsRoutes);
router.use('/visitor', visitorRoutes);
router.use('/admin', adminRoutes);
router.use('/docs', docsRoutes);

export default router;

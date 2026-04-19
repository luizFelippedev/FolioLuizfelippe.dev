import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';

import BlogPostModel from '../../models/BlogPost.model';
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase
} from '../utils/db';

let app: Express;

beforeAll(async () => {
  await connectTestDatabase();
  const { default: expressApp } = await import('../../app');
  app = expressApp;
});

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await disconnectTestDatabase();
});

describe('Blog routes', () => {
  it('filters blog posts by tag', async () => {
    await BlogPostModel.create({
      title: 'Intro to Holographic UX',
      slug: 'holographic-ux',
      excerpt: 'Designing beyond flat screens.',
      content: '## Holographic UX\nThe future is spatial.',
      categories: ['design'],
      tags: ['ux'],
      readTime: 5,
      published: true,
      publishedAt: new Date('2024-02-02')
    });

    await BlogPostModel.create({
      title: 'Edge AI Pipelines',
      slug: 'edge-ai-pipelines',
      excerpt: 'Deploy machine learning models to edge devices.',
      content: '## Edge AI\nOptimize inference at the edge.',
      categories: ['ai'],
      tags: ['ai'],
      readTime: 6,
      published: true,
      publishedAt: new Date('2024-03-10')
    });

    const response = await request(app).get('/api/blog').query({ tag: 'ux' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.data).toHaveLength(1);
    expect(response.body.data.data[0].title).toBe('Intro to Holographic UX');
  });

  it('counts post view once per IP and ignores repeated view from same IP', async () => {
    await BlogPostModel.create({
      title: 'Realtime Metrics for Portfolio',
      slug: 'realtime-metrics-portfolio',
      excerpt: 'Track unique post views with anti-duplication.',
      content: '## Realtime Metrics\nUnique by IP.',
      categories: ['engineering'],
      tags: ['metrics'],
      readTime: 4,
      published: true,
      publishedAt: new Date('2024-04-01')
    });

    const first = await request(app)
      .post('/api/blog/realtime-metrics-portfolio/views')
      .set('x-forwarded-for', '187.22.10.1');

    const second = await request(app)
      .post('/api/blog/realtime-metrics-portfolio/views')
      .set('x-forwarded-for', '187.22.10.1');

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);
    expect(first.body.data.counted).toBe(true);
    expect(first.body.data.views).toBe(1);

    expect(second.status).toBe(200);
    expect(second.body.success).toBe(true);
    expect(second.body.data.counted).toBe(false);
    expect(second.body.data.views).toBe(1);
  });
});

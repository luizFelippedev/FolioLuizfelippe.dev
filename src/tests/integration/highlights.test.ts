import type { Express } from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import BlogPostModel from '../../models/BlogPost.model';
import CertificateModel from '../../models/Certificate.model';
import ProjectModel from '../../models/Project.model';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../utils/db';

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

describe('Home highlights route', () => {
  it('returns mixed featured items sorted by pin recency with pagination', async () => {
    await Promise.all([
      ProjectModel.create({
        title: 'Realtime Command Center',
        slug: 'realtime-command-center',
        description: 'Featured project for mixed highlights.',
        category: 'software',
        technologies: ['React', 'Node.js'],
        featured: true,
        pinnedAt: new Date('2025-03-05T10:00:00.000Z')
      }),
      BlogPostModel.create({
        title: 'Pinned engineering log',
        slug: 'pinned-engineering-log',
        excerpt: 'Published and featured article.',
        content: '## Realtime\nPublished content.',
        categories: ['engineering'],
        tags: ['realtime'],
        readTime: 6,
        published: true,
        featured: true,
        publishedAt: new Date('2025-02-20T10:00:00.000Z'),
        pinnedAt: new Date('2025-03-01T10:00:00.000Z')
      }),
      BlogPostModel.create({
        title: 'Draft should never show',
        slug: 'draft-never-show',
        excerpt: 'Featured but not published.',
        content: '## Draft\nShould be excluded.',
        categories: ['engineering'],
        tags: ['draft'],
        readTime: 4,
        published: false,
        featured: true,
        pinnedAt: new Date('2025-03-06T10:00:00.000Z')
      }),
      CertificateModel.create({
        title: 'Cloud Architect Advanced',
        slug: 'cloud-architect-advanced',
        issuer: 'Cloud Academy',
        issueDate: new Date('2024-10-10T00:00:00.000Z'),
        category: 'cloud',
        level: 'advanced',
        skills: ['AWS'],
        featured: true,
        pinnedAt: new Date('2025-02-10T10:00:00.000Z')
      })
    ]);

    const page1 = await request(app).get('/api/highlights/home').query({ page: 1, limit: 2 });

    expect(page1.status).toBe(200);
    expect(page1.body.success).toBe(true);
    expect(page1.body.data.page).toBe(1);
    expect(page1.body.data.limit).toBe(2);
    expect(page1.body.data.hasMore).toBe(true);
    expect(page1.body.data.data).toHaveLength(2);
    expect(page1.body.data.data[0].contentType).toBe('project');
    expect(page1.body.data.data[1].contentType).toBe('blog');
    expect(page1.body.data.data.some((item: { slug: string }) => item.slug === 'draft-never-show')).toBe(false);

    const page2 = await request(app).get('/api/highlights/home').query({ page: 2, limit: 2 });

    expect(page2.status).toBe(200);
    expect(page2.body.success).toBe(true);
    expect(page2.body.data.page).toBe(2);
    expect(page2.body.data.hasMore).toBe(false);
    expect(page2.body.data.data).toHaveLength(1);
    expect(page2.body.data.data[0].contentType).toBe('certificate');
  });
});


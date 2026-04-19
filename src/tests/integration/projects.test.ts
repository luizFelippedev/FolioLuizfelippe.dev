import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';

import ProjectModel from '../../models/Project.model';
import { createProject, updateProject } from '../../services/projects.service';
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

describe('Projects routes', () => {
  it('returns paginated projects', async () => {
    await ProjectModel.create({
      title: 'Test Project',
      slug: 'test-project',
      description: 'A highly advanced test project.',
      category: 'lab',
      technologies: ['Node.js'],
      featured: true
    });

    const response = await request(app).get('/api/projects').query({ page: 1, limit: 5 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.data).toHaveLength(1);
    expect(response.body.data.page).toBe(1);
  });

  it('counts project view once per IP and ignores repeated view from same IP', async () => {
    await ProjectModel.create({
      title: 'Realtime Portfolio Dashboard',
      slug: 'realtime-portfolio-dashboard',
      description: 'Track unique visitors in real-time.',
      category: 'analytics',
      technologies: ['Node.js', 'React'],
      featured: false
    });

    const first = await request(app)
      .post('/api/projects/realtime-portfolio-dashboard/views')
      .set('x-forwarded-for', '189.99.10.20');

    const second = await request(app)
      .post('/api/projects/realtime-portfolio-dashboard/views')
      .set('x-forwarded-for', '189.99.10.20');

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);
    expect(first.body.data.counted).toBe(true);
    expect(first.body.data.views).toBe(1);

    expect(second.status).toBe(200);
    expect(second.body.success).toBe(true);
    expect(second.body.data.counted).toBe(false);
    expect(second.body.data.views).toBe(1);
  });

  it('applies pinnedAt metadata when toggling featured flag', async () => {
    const created = await createProject({
      title: 'Pin Metadata Test',
      slug: 'pin-metadata-test',
      description: 'Project used to validate automatic pin metadata behavior.',
      category: 'quality',
      level: 'intermediate',
      technologies: ['TypeScript'],
      gallery: [],
      featured: true
    });

    expect(created.featured).toBe(true);
    expect(created.pinnedAt).toBeInstanceOf(Date);

    const updated = await updateProject(created._id.toString(), { featured: false });

    expect(updated).not.toBeNull();
    expect(updated?.featured).toBe(false);
    expect(updated?.pinnedAt).toBeUndefined();
  });
});

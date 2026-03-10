import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';

import ProjectModel from '../../models/Project.model';
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
});

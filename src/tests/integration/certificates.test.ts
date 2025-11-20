import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

import CertificateModel from '../../models/Certificate.model';
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

describe('Certificates routes', () => {
  it('lists certificates with pagination', async () => {
    await CertificateModel.create({
      title: 'Nebula Architecture',
      slug: 'nebula-architecture',
      issuer: 'Galactic Academy',
      issueDate: new Date('2024-01-01'),
      category: 'backend',
      level: 'advanced',
      skills: ['Distributed Systems']
    });

    const response = await request(app).get('/api/certificates').query({ page: 1, limit: 5 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.data).toHaveLength(1);
    expect(response.body.data.data[0]).toMatchObject({ title: 'Nebula Architecture' });
  });
});

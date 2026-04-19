import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';

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

  it('counts certificate view once per IP and ignores repeated view from same IP', async () => {
    await CertificateModel.create({
      title: 'Telemetry Observability Specialist',
      slug: 'telemetry-observability-specialist',
      issuer: 'Realtime Academy',
      issueDate: new Date('2024-06-20'),
      category: 'devops',
      level: 'advanced',
      skills: ['Observability']
    });

    const first = await request(app)
      .post('/api/certificates/telemetry-observability-specialist/views')
      .set('x-forwarded-for', '177.20.11.7');

    const second = await request(app)
      .post('/api/certificates/telemetry-observability-specialist/views')
      .set('x-forwarded-for', '177.20.11.7');

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

import type { Express } from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ensureAdmin } from '../../scripts/ensureAdmin';
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

beforeEach(async () => {
  await ensureAdmin();
});

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await disconnectTestDatabase();
});

describe('Auth routes', () => {
  it('blocks public registration', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'StrongPass123!'
    };

    const response = await request(app).post('/api/auth/register').send(payload);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('logs in only with the configured admin account', async () => {
    const payload = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    };

    const response = await request(app).post('/api/auth/login').send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.role).toBe('admin');
    expect(response.headers['set-cookie']).toBeDefined();
  });
});

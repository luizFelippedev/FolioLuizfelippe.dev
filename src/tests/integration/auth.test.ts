import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';

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

describe('Auth routes', () => {
  it('registers a new user and returns tokens', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'StrongPass123!'
    };

    const response = await request(app).post('/api/auth/register').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      email: payload.email,
      name: payload.name
    });
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate registrations', async () => {
    const payload = {
      name: 'Test User',
      email: 'duplicate@example.com',
      password: 'StrongPass123!'
    };

    await request(app).post('/api/auth/register').send(payload);
    const duplicate = await request(app).post('/api/auth/register').send(payload);

    expect(duplicate.status).toBe(409);
  });
});

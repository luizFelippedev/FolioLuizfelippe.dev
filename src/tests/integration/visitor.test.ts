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

describe('Visitor intel routes', () => {
  it('creates an anonymous visitor session and tracks events with a session cookie', async () => {
    const visitorAgent = request.agent(app);

    const initialSnapshot = await visitorAgent.get('/api/visitor/session');

    expect(initialSnapshot.status).toBe(200);
    expect(initialSnapshot.body.success).toBe(true);
    expect(initialSnapshot.body.data.gateRequired).toBe(true);
    expect(initialSnapshot.body.data.session).toBeNull();

    const createdSession = await visitorAgent.post('/api/visitor/session').send({
      segment: 'company',
      entryPath: '/projects',
      locale: 'pt-BR',
      referrer: 'https://www.linkedin.com/feed',
      identity: {
        name: 'Ana Souza',
        companyName: 'Nova Labs',
        purpose: 'Avaliar projetos para parceria'
      },
      utm: {
        source: 'linkedin',
        medium: 'social'
      }
    });

    expect(createdSession.status).toBe(201);
    expect(createdSession.body.success).toBe(true);
    expect(createdSession.body.data.gateRequired).toBe(false);
    expect(createdSession.body.data.session.selfDeclaredSegment).toBe('company');
    expect(createdSession.body.data.session.identity.name).toBe('Ana Souza');
    expect(createdSession.body.data.session.identity.companyName).toBe('Nova Labs');
    expect(createdSession.headers['set-cookie']).toBeDefined();

    const trackedEvent = await visitorAgent.post('/api/visitor/events').send({
      type: 'page_view',
      path: '/projects'
    });

    expect(trackedEvent.status).toBe(202);
    expect(trackedEvent.body.success).toBe(true);
    expect(trackedEvent.body.data.session.pageCount).toBe(1);
    expect(trackedEvent.body.data.session.eventCounts.pageView).toBe(1);
  });

  it('exposes visitor intel summary and sessions only to authenticated admin sessions', async () => {
    const visitorAgent = request.agent(app);
    await visitorAgent.post('/api/visitor/session').send({
      segment: 'recruiter',
      entryPath: '/blog',
      locale: 'en-US',
      identity: {
        name: 'Chris Taylor',
        companyName: 'Hiring Hub',
        purpose: 'Screening for a backend role'
      }
    });
    await visitorAgent.post('/api/visitor/events').send({
      type: 'blog_view',
      path: '/blog',
      contentType: 'blog',
      contentKey: 'portfolio-notes'
    });

    const adminAgent = request.agent(app);
    const loginResponse = await adminAgent.post('/api/auth/login').send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });

    expect(loginResponse.status).toBe(200);

    const summaryResponse = await adminAgent.get('/api/admin/visitor-intel/summary');
    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.success).toBe(true);
    expect(summaryResponse.body.data.totals.sessions).toBe(1);

    const sessionsResponse = await adminAgent
      .get('/api/admin/visitor-intel/sessions')
      .query({ segment: 'recruiter', page: 1, limit: 10 });

    expect(sessionsResponse.status).toBe(200);
    expect(sessionsResponse.body.success).toBe(true);
    expect(sessionsResponse.body.data.data).toHaveLength(1);
    expect(sessionsResponse.body.data.data[0].selfDeclaredSegment).toBe('recruiter');
    expect(sessionsResponse.body.data.data[0].identity.name).toBe('Chris Taylor');
    expect(sessionsResponse.body.data.data[0].identity.companyName).toBe('Hiring Hub');
  });
});

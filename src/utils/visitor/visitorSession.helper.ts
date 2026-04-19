import crypto from 'node:crypto';

import type { CookieOptions, Request } from 'express';

import env, { isProduction } from '@config/env.config';

export const VISITOR_SESSION_COOKIE = 'portfolioVisitorSession';

export interface VisitorUtmInput {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

const trimValue = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 160) : undefined;
};

export const normalizeVisitorPath = (value?: string | null) => {
  const normalized = trimValue(value) ?? '/';

  if (!normalized.startsWith('/')) {
    return `/${normalized}`;
  }

  return normalized.slice(0, 160);
};

export const normalizeVisitorLocale = (value?: string | null) => {
  const normalized = trimValue(value);
  return normalized ? normalized.slice(0, 16).toLowerCase() : undefined;
};

export const normalizeVisitorUtm = (value?: VisitorUtmInput | null) => {
  if (!value) {
    return undefined;
  }

  const normalized = {
    source: trimValue(value.source),
    medium: trimValue(value.medium),
    campaign: trimValue(value.campaign),
    term: trimValue(value.term),
    content: trimValue(value.content)
  };

  if (Object.values(normalized).every((entry) => !entry)) {
    return undefined;
  }

  return normalized;
};

export const extractReferrerDomain = (value?: string | null) => {
  const normalized = trimValue(value);
  if (!normalized) {
    return undefined;
  }

  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return undefined;
  }
};

export const summarizeUserAgent = (value?: string | null) => {
  const normalized = trimValue(value);
  return normalized ? normalized.slice(0, 220) : undefined;
};

export const getVisitorSessionIdFromRequest = (req: Request) => {
  const rawValue = req.cookies?.[VISITOR_SESSION_COOKIE];
  return typeof rawValue === 'string' && rawValue.trim() ? rawValue.trim() : null;
};

export const getAudienceCacheKeySuffix = (req: Request) => {
  const adminToken =
    typeof req.cookies?.accessToken === 'string' && req.cookies.accessToken.trim()
      ? req.cookies.accessToken.trim()
      : null;
  const visitorSessionId = getVisitorSessionIdFromRequest(req);

  if (adminToken) {
    return `admin:${adminToken}`;
  }

  if (visitorSessionId) {
    return `visitor:${visitorSessionId}`;
  }

  return 'anonymous';
};

export const buildVisitorSessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  domain: undefined
});

export const createVisitorSessionId = () => crypto.randomUUID();

export const hashVisitorIp = (ipAddress?: string | null) => {
  const normalized = ipAddress?.trim();
  if (!normalized) {
    return undefined;
  }

  const salt = process.env.VIEW_HASH_SALT ?? env.JWT_ACCESS_SECRET ?? 'portfolio-visitor-salt';

  return crypto
    .createHash('sha256')
    .update(`${salt}:${normalized}`)
    .digest('hex');
};

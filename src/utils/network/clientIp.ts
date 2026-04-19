import type { Request } from 'express';

const normalizeIp = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  let ip = value.trim();
  if (!ip) {
    return null;
  }

  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return ip || null;
};

export const getClientIp = (req: Request): string | null => {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') {
    return normalizeIp(forwarded);
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return normalizeIp(forwarded[0]);
  }

  return normalizeIp(req.ip ?? req.socket.remoteAddress ?? null);
};

export default getClientIp;

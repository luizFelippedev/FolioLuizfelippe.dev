import { sign, verify, type SignOptions } from 'jsonwebtoken';

import env from '@config/env.config';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

const createToken = (payload: TokenPayload, secret: string, expiresIn: string): string =>
  sign(payload, secret, { expiresIn: expiresIn as SignOptions['expiresIn'] });

export const createAccessToken = (payload: TokenPayload): string =>
  createToken(payload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);

export const createRefreshToken = (payload: TokenPayload): string =>
  createToken(payload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

export const verifyAccessToken = (token: string): TokenPayload =>
  verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

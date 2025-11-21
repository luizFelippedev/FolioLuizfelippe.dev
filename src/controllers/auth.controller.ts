import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import env from '@config/env.config';
import {
  generatePasswordReset,
  getProfile,
  loginUser,
  resetPassword,
  refreshSession,
  registerUser,
  revokeSession
} from '@services/auth.service';
import { sendPasswordResetEmail } from '@services/email.service';
import { AppError } from '@utils/helpers/error.helper';
import { successResponse } from '@utils/helpers/response.helper';
import logger from '@utils/logger/logger';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, tokens } = await registerUser(req.body);

    attachAuthCookies(res, tokens);

    return successResponse(res, user, 'Account created', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, tokens } = await loginUser(req.body);

    attachAuthCookies(res, tokens);

    return successResponse(res, user, 'Welcome back');
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.body.refreshToken ?? req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', StatusCodes.UNAUTHORIZED));
    }

    const tokens = await refreshSession(refreshToken);
    attachAuthCookies(res, tokens);

    return successResponse(res, tokens, 'Session renewed');
  } catch (error) {
    return next(error);
  }
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getProfile(req.user?.id ?? '');

    if (!user) {
      return next(new AppError('Profile not found', StatusCodes.NOT_FOUND));
    }

    return successResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await revokeSession();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return successResponse(res, { success: true }, 'Signed out successfully');
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await generatePasswordReset(req.body);

    const resetLink = env.PASSWORD_RESET_URL
      ? `${env.PASSWORD_RESET_URL}?token=${token}`
      : `${env.CLIENT_URL.replace(/\/$/, '')}/auth/reset-password?token=${token}`;

    void sendPasswordResetEmail(user.email, {
      name: user.name,
      resetLink
    }).catch((error) => {
      logger.warn('Failed to send password reset email', { error });
    });

    return successResponse(res, { delivered: true }, 'Password reset email sent');
  } catch (error) {
    return next(error);
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, tokens } = await resetPassword(req.body);

    attachAuthCookies(res, tokens);

    return successResponse(res, user, 'Password updated');
  } catch (error) {
    return next(error);
  }
};

const attachAuthCookies = (
  res: Response,
  tokens: {
    accessToken: string;
    refreshToken: string;
  }
) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'none' as const, // permitir envio cross-site (Vercel -> Render)
    secure: true, // necessário para sameSite:none
    domain: undefined
  };

  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

import { canPerformAction, type AppAction, getAllowedRoles } from '@utils/auth/policies';
import { AppError } from '@utils/helpers/error.helper';
import { verifyAccessToken } from '@utils/helpers/token.helper';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import env from '@config/env.config';
import UserModel, { type UserRole } from '@models/User.model';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.accessToken;

    if (!token) {
      throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
    }

    const payload = verifyAccessToken(token);

    const user = await UserModel.findById(payload.sub).lean();
    if (!user) {
      throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    const adminEmail = env.ADMIN_EMAIL?.toLowerCase();
    const isAdminSession =
      Boolean(adminEmail) &&
      user.email.toLowerCase() === adminEmail &&
      user.role === 'admin' &&
      user.isActive;

    if (!isAdminSession) {
      throw new AppError('Authentication failed', StatusCodes.UNAUTHORIZED);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return next(new AppError('Authentication failed', StatusCodes.UNAUTHORIZED));
  }
};

export const requireRole = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role as UserRole)) {
    return next(new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN));
  }

  return next();
};

export const authorizeAction = (action: AppAction) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  }

  const role = req.user.role as UserRole;
  if (!canPerformAction(role, action)) {
    const allowed = getAllowedRoles(action).join(', ');
    return next(
      new AppError(
        `You do not have permission to perform this action (allowed roles: ${allowed || 'none'})`,
        StatusCodes.FORBIDDEN
      )
    );
  }

  return next();
};

export default authenticate;

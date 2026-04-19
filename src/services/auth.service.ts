import crypto from 'node:crypto';

import { AppError } from '@utils/helpers/error.helper';
import type {
  TokenPayload} from '@utils/helpers/token.helper';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from '@utils/helpers/token.helper';

import env from '@config/env.config';
import UserModel, { type UserDocument } from '@models/User.model';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput
} from '@validators/auth.validator';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserDocument;
  tokens: AuthTokens;
}

const buildTokenPayload = (user: UserDocument): TokenPayload => ({
  sub: user._id.toString(),
  email: user.email,
  role: user.role
});

const getAdminEmail = () => {
  if (!env.ADMIN_EMAIL) {
    throw new AppError('Admin account is not configured', 500);
  }

  return env.ADMIN_EMAIL.toLowerCase();
};

const getAcceptedAdminEmails = () => {
  const primaryEmail = getAdminEmail();
  const aliases =
    env.ADMIN_EMAIL_ALIASES?.split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean) ?? [];

  return new Set<string>([primaryEmail, ...aliases]);
};

const isAuthorizedAdminUser = (user: Pick<UserDocument, 'email' | 'role' | 'isActive'>) => {
  const adminEmail = env.ADMIN_EMAIL?.toLowerCase();
  return Boolean(adminEmail) && user.email.toLowerCase() === adminEmail && user.role === 'admin' && user.isActive;
};

export const registerUser = async (payload: RegisterInput): Promise<AuthResponse> => {
  void payload;
  throw new AppError('Public registration is disabled. Access is restricted to the configured admin account.', 403);
};

export const loginUser = async (payload: LoginInput): Promise<AuthResponse> => {
  const email = payload.email.trim().toLowerCase();
  const adminEmail = getAdminEmail();
  const acceptedAdminEmails = getAcceptedAdminEmails();

  if (!acceptedAdminEmails.has(email)) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = await UserModel.findOne({ email: adminEmail });

  if (!user || !isAuthorizedAdminUser(user)) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await user.comparePassword(payload.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const tokens: AuthTokens = {
    accessToken: createAccessToken(buildTokenPayload(user)),
    refreshToken: createRefreshToken(buildTokenPayload(user))
  };

  return { user, tokens };
};

export const refreshSession = async (refreshToken: string): Promise<AuthTokens> => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await UserModel.findById(payload.sub);

  if (!user || !isAuthorizedAdminUser(user)) {
    throw new AppError('Authentication failed', 401);
  }

  const tokenPayload = buildTokenPayload(user);

  return {
    accessToken: createAccessToken(tokenPayload),
    refreshToken: createRefreshToken(tokenPayload)
  };
};

export const getProfile = async (userId: string): Promise<UserDocument | null> => {
  return UserModel.findById(userId);
};

export const revokeSession = async () => {
  return true;
};

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const generatePasswordReset = async ({ email }: ForgotPasswordInput) => {
  const adminEmail = getAdminEmail();
  const acceptedAdminEmails = getAcceptedAdminEmails();
  if (!acceptedAdminEmails.has(email.trim().toLowerCase())) {
    throw new AppError('Account not found', 404);
  }

  const user = await UserModel.findOne({ email: adminEmail });

  if (!user || !isAuthorizedAdminUser(user)) {
    throw new AppError('Account not found', 404);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  return { user, token: resetToken };
};

export const resetPassword = async (payload: ResetPasswordInput): Promise<AuthResponse> => {
  const hashedToken = hashToken(payload.token);

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  if (!isAuthorizedAdminUser(user)) {
    throw new AppError('Authentication failed', 401);
  }

  user.password = payload.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  const tokens: AuthTokens = {
    accessToken: createAccessToken(buildTokenPayload(user)),
    refreshToken: createRefreshToken(buildTokenPayload(user))
  };

  return { user, tokens };
};

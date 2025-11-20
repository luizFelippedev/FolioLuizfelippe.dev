import crypto from 'node:crypto';

import UserModel, { type UserDocument } from '@models/User.model';
import {
  TokenPayload,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from '@utils/helpers/token.helper';
import { AppError } from '@utils/helpers/error.helper';

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

export const registerUser = async (payload: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await UserModel.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await UserModel.create(payload);
  const tokens: AuthTokens = {
    accessToken: createAccessToken(buildTokenPayload(user)),
    refreshToken: createRefreshToken(buildTokenPayload(user))
  };

  return { user, tokens };
};

export const loginUser = async (payload: LoginInput): Promise<AuthResponse> => {
  const user = await UserModel.findOne({ email: payload.email });

  if (!user) {
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

  if (!user) {
    throw new AppError('User not found', 404);
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
  const user = await UserModel.findOne({ email });

  if (!user) {
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

import { Router } from 'express';

import {
  forgotPassword,
  login,
  logout,
  profile,
  refresh,
  register,
  resetPasswordHandler
} from '@controllers/auth.controller';
import { authenticate } from '@middleware/auth.middleware';
import validate from '@middleware/validation.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema
} from '@validators/auth.validator';

const router = Router();

router.post('/register', register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, profile);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);

export default router;

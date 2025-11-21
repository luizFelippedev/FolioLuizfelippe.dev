import env from '@config/env.config';
import UserModel from '@models/User.model';
import logger from '@utils/logger/logger';

export const ensureAdmin = async () => {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  const existing = await UserModel.findOne({ email });

  if (existing) {
    existing.password = password;
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
    logger.info(`Admin atualizado: ${email}`);
    return;
  }

  await UserModel.create({
    name: 'Admin',
    email,
    password,
    role: 'admin',
    isActive: true
  });

  logger.info(`Admin criado: ${email}`);
};


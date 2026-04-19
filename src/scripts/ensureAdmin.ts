import logger from '@utils/logger/logger';

import env from '@config/env.config';
import UserModel from '@models/User.model';

export const ensureAdmin = async () => {
  const email = env.ADMIN_EMAIL?.toLowerCase();
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing');
    return;
  }

  const existing = await UserModel.findOne({ email });

  if (existing) {
    existing.password = password;
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
    logger.info(`Admin atualizado: ${email}`);
  } else {
    await UserModel.create({
      name: 'Admin',
      email,
      password,
      role: 'admin',
      isActive: true
    });

    logger.info(`Admin criado: ${email}`);
  }

  const cleanup = await UserModel.updateMany(
    { email: { $ne: email } },
    { $set: { role: 'guest', isActive: false } }
  );

  if (cleanup.modifiedCount > 0) {
    logger.warn(`Acesso administrativo revogado de ${cleanup.modifiedCount} usuário(s) não-admin.`);
  }
};

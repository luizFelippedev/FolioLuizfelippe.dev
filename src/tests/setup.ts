process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-32chars-test-access';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-32chars-refresh';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
process.env.NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL ?? 'admin@example.com';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'mongodb://localhost:27017/test';

import type { CorsOptions } from 'cors';

import env from '@config/env.config';

export const corsConfig: CorsOptions = {
  origin: [env.CLIENT_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export default corsConfig;

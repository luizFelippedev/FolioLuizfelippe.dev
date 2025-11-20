import env from '@config/env.config';

export const awsConfig = {
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? ''
  },
  s3Bucket: env.AWS_S3_BUCKET ?? ''
};

export default awsConfig;

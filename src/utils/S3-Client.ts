import { S3Client } from '@aws-sdk/client-s3';
import * as dotenv from "dotenv";
dotenv.config();

export const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESSKEY as string,
    secretAccessKey: process.env.S3_SECRETKEY as string,
  },
  endpoint: process.env.S3_URL,
  forcePathStyle: true,
  region: 'ap-southeast-1',
});

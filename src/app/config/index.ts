import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL!,
  domain: process.env.DOMAIN,
  base_url: process.env.BASE_URL,

  smtp_host: process.env.SMTP_HOST,
  smtp_port: process.env.SMTP_PORT,
  smtp_user: process.env.SMTP_USER,
  smtp_password: process.env.SMTP_PASSWORD,

  admin_jwt_access_secret: process.env.ADMIN_JWT_ACCESS_SECRET,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  expires_in: process.env.EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  refresh_expires_in: process.env.REFRESH_EXPIRES_IN,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  NODE_ENV: process.env.NODE_ENV,

  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET_NAME,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webHookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    publishKey: process.env.STRIPE_PUBLISH_KEY!
  },
  scanning_url: process.env.SCANNING_URL!,
  embedding_url: process.env.EMBEDDING_URL!,
  local: process.env.LOCAL!,
};

import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import config from "../config";

export const s3Client = new S3Client({
  region: `${config.aws.region}`,
  credentials: {
    accessKeyId: `${config.aws.accessKeyId}`,
    secretAccessKey: `${config.aws.secretAccessKey}`,
  },
});

export const testS3 = async () => {
  try {
    const response = await s3Client.send(new ListBucketsCommand({}));
    console.log(`S3 authenticated successfully`, response.Buckets);
  } catch (err) {
    console.error("S3 authentication failed", err);
  }
};

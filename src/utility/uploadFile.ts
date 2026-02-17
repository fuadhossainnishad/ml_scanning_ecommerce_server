import path from "path";
import config from "../app/config";
import mime from "mime-types";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../app/config/s3Bucket.config";

export const fileUploadToS3 = async (
  buffer: Buffer,
  originalName: string,
  folder: string
): Promise<string> => {
  const ext = path.extname(originalName);
  const mimeType = mime.lookup(ext) || "application/octet-stream";
  const key = `${folder}/${Date.now()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
};

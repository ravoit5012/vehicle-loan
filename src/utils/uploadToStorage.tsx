import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./r2";

export async function uploadToStorage(
  fileBuffer: Buffer,
  relativePath: string,
  mimeType?: string
): Promise<string> {

  const key = relativePath.replace(/^\/+/, "");

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType || "application/octet-stream",
      ContentDisposition: "inline",
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

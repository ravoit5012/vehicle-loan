// import * as fs from 'fs'
// import * as path from 'path'

// export async function uploadToStorage(
//   fileBuffer: Buffer,
//   relativePath: string
// ): Promise<string> {
//   const uploadRoot = process.env.UPLOAD_DIR || 'uploads'

//   // Full file path
//   const fullPath = path.join(uploadRoot, relativePath)

//   // Ensure directory exists
//   const dir = path.dirname(fullPath)
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true })
//   }

//   // Write file
//   await fs.promises.writeFile(fullPath, fileBuffer)

//   const fileUrl = `/files${relativePath.replace(/\\/g, '/')}`

//   return `${fileUrl}`
// }


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

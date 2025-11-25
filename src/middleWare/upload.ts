import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3.js";

export const upload = multer({
  storage: multer.memoryStorage(), // 파일을 메모리에 올림 (S3 전송)
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});


export async function uploadToS3(file: Express.Multer.File, folder: string) {
  const key = `${folder}/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
} from "@/lib/streaks/constants";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
    publicBaseUrl: process.env.R2_PUBLIC_URL?.replace(/\/$/, ""),
  };
}

export function isAvatarUploadConfigured(): boolean {
  return getR2Client() !== null && !!process.env.R2_PUBLIC_URL;
}

export async function uploadStreakAvatar(
  userId: string,
  file: File,
): Promise<string> {
  const r2 = getR2Client();
  if (!r2?.publicBaseUrl) {
    throw new Error("Avatar upload is not configured.");
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    throw new Error("Avatar must be JPEG, PNG, or WebP.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Avatar must be 2 MB or smaller.");
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const key = `avatars/${userId}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return `${r2.publicBaseUrl}/${key}`;
}

export async function uploadProofPhoto(
  userId: string,
  streakId: string,
  file: File,
): Promise<string> {
  const r2 = getR2Client();
  if (!r2?.publicBaseUrl) {
    throw new Error("Photo upload is not configured.");
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    throw new Error("Photo must be JPEG, PNG, or WebP.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Photo must be 2 MB or smaller.");
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const key = `proofs/${userId}/${streakId}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return `${r2.publicBaseUrl}/${key}`;
}

export function isProofUploadConfigured(): boolean {
  return isAvatarUploadConfigured();
}

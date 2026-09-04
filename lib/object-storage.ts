import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const GENERATIONS_BUCKET = "generations";

let s3Client: S3Client | null = null;

export function isObjectStorageConfigured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY &&
      process.env.S3_SECRET_KEY,
  );
}

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const region = process.env.S3_REGION ?? "us-east-1";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Object storage não configurado (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY).",
    );
  }

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  return s3Client;
}

export async function uploadObject(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: GENERATIONS_BUCKET,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function downloadObject(path: string): Promise<{
  data: Blob;
  contentType: string;
} | null> {
  const client = getS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: GENERATIONS_BUCKET,
        Key: path,
      }),
    );

    if (!response.Body) return null;

    const bytes = await response.Body.transformToByteArray();
    const contentType = response.ContentType ?? "application/octet-stream";
    const data = new Blob([Buffer.from(bytes)], { type: contentType });

    return { data, contentType };
  } catch {
    return null;
  }
}

export async function getObjectStream(path: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
} | null> {
  const client = getS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: GENERATIONS_BUCKET,
        Key: path,
      }),
    );

    if (!response.Body) return null;

    const contentType = response.ContentType ?? "application/octet-stream";
    const webStream = response.Body.transformToWebStream();

    return { stream: webStream, contentType };
  } catch {
    return null;
  }
}

export async function createPresignedObjectUrl(
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const client = getS3Client();

  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: GENERATIONS_BUCKET,
        Key: path,
      }),
      { expiresIn },
    );
  } catch {
    return null;
  }
}

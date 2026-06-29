import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

function joinUrl(base, path) {
  if (!base) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

function sanitizePathSegment(input) {
  return String(input || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const fileName = body?.fileName;
    const contentType = body?.contentType;
    const fileSize = body?.fileSize;
    const folder = body?.folder || 'uploads';

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: 'Only image uploads are allowed' },
        { status: 400 }
      );
    }

    const maxBytes = 10 * 1024 * 1024;
    if (typeof fileSize === 'number' && fileSize > maxBytes) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY;
    const secretAccessKey = process.env.R2_SECRET_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_URL;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
      return NextResponse.json(
        { error: 'R2 env vars are not configured' },
        { status: 500 }
      );
    }

    const safeFolder = sanitizePathSegment(folder);
    const ext = String(fileName).includes('.') ? String(fileName).split('.').pop() : '';
    const safeExt = String(ext || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const ts = Date.now();

    const key = safeExt
      ? `${safeFolder}/${ts}-${randomSuffix()}.${safeExt}`
      : `${safeFolder}/${ts}-${randomSuffix()}`;

    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
    const fileUrl = joinUrl(publicBaseUrl, key);

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}

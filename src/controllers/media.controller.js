import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const allowedTypes = {
  invoice: new Set(['application/pdf', 'image/jpeg', 'image/png']),
  pallet_photo: new Set(['image/jpeg', 'image/png', 'image/webp']),
};
const requestSchema = z.object({
  load_id: z.string().uuid(),
  file_name: z.string().min(1).max(120).regex(/^[\w.-]+$/),
  content_type: z.string().min(1),
});

const createUploadUrl = (assetType) => async (req, res) => {
  if (!process.env.S3_BUCKET || !process.env.AWS_REGION) {
    throw new ApiError(503, 'Media storage is not configured');
  }
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success || !allowedTypes[assetType].has(parsed.data?.content_type)) {
    throw new ApiError(400, `Invalid ${assetType} upload request`, parsed.success ? [] : parsed.error.issues);
  }

  const { load_id: loadId, file_name: fileName, content_type: contentType } = parsed.data;
  const key = `loads/${loadId}/${assetType}/${crypto.randomUUID()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  res.status(200).json({ upload_url: uploadUrl, object_key: key, expires_in: 900 });
};

export const createInvoiceUploadUrl = createUploadUrl('invoice');
export const createPalletPhotoUploadUrl = createUploadUrl('pallet_photo');

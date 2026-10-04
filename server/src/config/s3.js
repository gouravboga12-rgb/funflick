import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
dotenv.config();

const region = process.env.AWS_REGION || 'ap-south-2';
const bucketName = process.env.S3_MEDIA_BUCKET || 'funflick-media-storage-live';

// On EC2, the AWS SDK automatically queries the attached IAM Role for credentials!
export const s3Client = new S3Client({
  region: region,
});

/**
 * Generate a presigned PUT URL for uploading media directly to S3 from frontend
 * @param {string} fileName Original file name
 * @param {string} fileType MIME type (e.g. 'video/mp4', 'image/jpeg')
 * @param {string} folder Destination folder (e.g. 'videos', 'avatars', 'thumbnails')
 */
export async function generatePresignedUploadUrl(fileName, fileType, folder = 'videos') {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${Date.now()}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  // URL valid for 15 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

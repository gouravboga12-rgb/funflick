import { generatePresignedUploadUrl } from '../config/s3.js';

export async function getUploadUrl(req, res) {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    const validFolders = ['videos', 'thumbnails', 'avatars', 'images'];
    const targetFolder = validFolders.includes(folder) ? folder : 'videos';

    const presignedData = await generatePresignedUploadUrl(fileName, fileType, targetFolder);

    return res.json({
      success: true,
      ...presignedData,
    });
  } catch (err) {
    console.error('Presigned URL error:', err);
    return res.status(500).json({ error: 'Failed to generate S3 upload URL' });
  }
}

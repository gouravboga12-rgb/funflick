import { generatePresignedUploadUrl } from '../config/s3.js';

export async function getUploadUrl(req, res) {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    const validFolders = ['videos', 'thumbnails', 'avatars', 'images', 'chat'];
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

/**
 * Proxy download media to ensure browser downloads the real uploaded file directly
 * with proper Content-Disposition: attachment header.
 */
export async function downloadMedia(req, res) {
  try {
    const { url, filename } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'url parameter is required' });
    }

    // Security check: Only allow downloading from the configured AWS S3 media bucket or safe http origins
    const bucket = process.env.S3_MEDIA_BUCKET || 'funflick-media-storage-live';
    const isAllowed = url.includes(bucket) || url.startsWith('http');
    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized media source' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch media from storage' });
    }

    const cleanFilename = (filename || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('Content-Type', contentType);

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Download media proxy error:', err);
    return res.status(500).json({ error: 'Download failed' });
  }
}

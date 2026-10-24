import { generatePresignedUploadUrl } from '../config/s3.js';

export async function getUploadUrl(req, res) {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    const validFolders = ['videos', 'thumbnails', 'avatars', 'images', 'chat', 'ads', 'stories'];
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
 *
 * SECURITY: Only files from the configured S3 bucket are allowed.
 * The previous `url.startsWith('http')` check was an SSRF vulnerability
 * that could expose AWS EC2 IAM credentials via the instance metadata endpoint.
 */
export async function downloadMedia(req, res) {
  try {
    const { url, filename } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'url parameter is required' });
    }

    // SECURITY: Strict allowlist — only our S3 bucket domain is permitted.
    // Never use `url.startsWith('http')` — that would allow SSRF attacks.
    const bucket = process.env.S3_MEDIA_BUCKET || 'funflick-media-storage-live';
    const region = process.env.AWS_REGION || 'ap-south-2';
    const allowedOrigin = `https://${bucket}.s3.${region}.amazonaws.com/`;

    if (!url.startsWith(allowedOrigin)) {
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

    // PERFORMANCE: Stream the response — never load entire video into Node.js RAM.
    // Previously used response.arrayBuffer() which would OOM-crash on large videos.
    const { Readable } = await import('stream');
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    console.error('Download media proxy error:', err);
    return res.status(500).json({ error: 'Download failed' });
  }
}


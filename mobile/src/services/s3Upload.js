import { apiRequest } from './api';

/**
 * Upload local file URI to AWS S3 using presigned PUT URL
 * @param {string} localUri File URI from expo-image-picker
 * @param {string} fileName Original or generated file name
 * @param {string} mimeType 'video/mp4' | 'image/jpeg' | etc.
 * @param {string} folder 'videos' | 'images' | 'thumbnails' | 'avatars'
 * @param {Function} onProgress Progress callback (0-100)
 * @returns {Promise<string>} Public permanent S3 URL
 */
export async function uploadMediaToS3(localUri, fileName, mimeType, folder = 'videos', onProgress = () => {}) {
  // 1. Request presigned upload URL from EC2 backend
  const data = await apiRequest('/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      fileName: fileName || `upload_${Date.now()}.${folder === 'videos' ? 'mp4' : 'jpg'}`,
      fileType: mimeType || (folder === 'videos' ? 'video/mp4' : 'image/jpeg'),
      folder,
    }),
  });

  const { uploadUrl, publicUrl } = data;
  if (!uploadUrl || !publicUrl) {
    throw new Error('Failed to obtain S3 upload authorization');
  }

  // 2. Fetch local file URI as blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  // Enforce 10MB maximum file size limit
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (blob && blob.size > MAX_FILE_SIZE) {
    throw new Error(`Video file size (${(blob.size / (1024 * 1024)).toFixed(1)}MB) exceeds 10MB limit. Please choose a video under 10MB.`);
  }

  // 3. Upload directly to AWS S3 via XMLHttpRequest with real progress monitoring
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', mimeType || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(publicUrl);
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during S3 upload'));
    xhr.ontimeout = () => reject(new Error('S3 upload timed out'));

    xhr.send(blob);
  });
}

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
export async function uploadMediaToS3(fileOrUri, fileName, mimeType, folder = 'videos', onProgress = () => {}) {
  // Determine if it is an image or video
  const isImage = folder === 'images' || folder === 'thumbnails' || folder === 'avatars' || (mimeType && mimeType.startsWith('image/'));
  const effectiveMime = mimeType || (isImage ? 'image/jpeg' : 'video/mp4');
  const defaultExt = isImage ? 'jpg' : 'mp4';
  const effectiveFileName = fileName || `upload_${Date.now()}.${defaultExt}`;

  // 1. Request presigned upload URL from EC2 backend
  const data = await apiRequest('/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      fileName: effectiveFileName,
      fileType: effectiveMime,
      folder,
    }),
  });

  const { uploadUrl, publicUrl } = data;
  if (!uploadUrl || !publicUrl) {
    throw new Error('Failed to obtain S3 upload authorization');
  }

  // 2. Resolve binary payload (File, Blob, or local URI)
  let uploadBlob = null;
  if (fileOrUri instanceof Blob || (typeof File !== 'undefined' && fileOrUri instanceof File)) {
    uploadBlob = fileOrUri;
  } else if (fileOrUri && typeof fileOrUri === 'object' && fileOrUri.file) {
    uploadBlob = fileOrUri.file;
  } else if (fileOrUri && typeof fileOrUri === 'object' && fileOrUri.uri) {
    const response = await fetch(fileOrUri.uri);
    uploadBlob = await response.blob();
  } else if (typeof fileOrUri === 'string') {
    const response = await fetch(fileOrUri);
    uploadBlob = await response.blob();
  } else {
    throw new Error('Invalid file provided for upload');
  }

  // Enforce size limits: 5MB for images, 10MB for videos
  const maxBytes = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  const maxLabel = isImage ? '5MB' : '10MB';
  if (uploadBlob && uploadBlob.size && uploadBlob.size > maxBytes) {
    const sizeMb = (uploadBlob.size / (1024 * 1024)).toFixed(1);
    throw new Error(`${isImage ? 'Image' : 'Video'} file size (${sizeMb}MB) exceeds the ${maxLabel} limit. Please choose a ${isImage ? 'photo' : 'video'} under ${maxLabel}.`);
  }

  // 3. Upload directly to AWS S3 via XMLHttpRequest with real progress monitoring
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', effectiveMime);

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

    xhr.send(uploadBlob);
  });
}

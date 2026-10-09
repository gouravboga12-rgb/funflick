/**
 * Uploads a file directly to AWS S3 using FunFlick presigned PUT URLs
 * Reports real percentage progress (0-100) via XMLHttpRequest
 *
 * @param {File} file File from HTML input (<input type="file" />)
 * @param {string} folder Destination folder ('videos' | 'images' | 'thumbnails' | 'avatars')
 * @param {Function} onProgress Callback receiving percentage number
 * @returns {Promise<string>} S3 public permanent URL
 */
export async function uploadFileToS3(file, folder = 'videos', onProgress = () => {}) {
  // Enforce 5MB limit for images, 10MB for videos
  const isImage = folder === 'images' || folder === 'thumbnails' || folder === 'avatars' || (file?.type && file.type.startsWith('image/'));
  const maxBytes = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  const maxLabel = isImage ? '5MB' : '10MB';

  if (file && file.size > maxBytes) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${maxLabel} limit. Please select a ${isImage ? 'photo' : 'video'} under ${maxLabel}.`);
  }

  const token = 
    localStorage.getItem('funflick_admin_token') || 
    localStorage.getItem('funflick_token') || 
    sessionStorage.getItem('funflick_token') || 
    '';

  // 1. Get presigned upload URL from AWS EC2 backend
  const res = await fetch('/api/media/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || (folder === 'images' ? 'image/jpeg' : 'video/mp4'),
      folder
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to initialize AWS S3 upload');
  }

  const { uploadUrl, publicUrl } = await res.json();
  if (!uploadUrl || !publicUrl) {
    throw new Error('Invalid upload authorization from server');
  }

  // 2. Perform direct PUT to S3 with live progress monitoring
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

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
        reject(new Error(`AWS S3 rejected upload (HTTP ${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error uploading file to AWS S3'));
    xhr.ontimeout = () => reject(new Error('Upload to AWS S3 timed out'));

    xhr.send(file);
  });

  return publicUrl;
}

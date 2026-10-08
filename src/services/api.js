/**
 * FunFlick API Service
 * Handles API requests and direct S3 uploads
 */

const TOKEN_KEY = 'funflick_token';

export const authStorage = {
  getToken: () => 
    localStorage.getItem('funflick_admin_token') || 
    localStorage.getItem(TOKEN_KEY) || 
    sessionStorage.getItem(TOKEN_KEY) || 
    null,
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('funflick_admin_token');
  },
};

export async function apiRequest(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    register: (userData) =>
      apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    login: (credentials) =>
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    getProfile: () => apiRequest('/api/auth/me'),

    updateProfile: (profileData) =>
      apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
  },

  // Videos / Feed
  videos: {
    list: (category = 'All') =>
      apiRequest(`/api/videos${category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : ''}`),

    create: (videoData) =>
      apiRequest('/api/videos', {
        method: 'POST',
        body: JSON.stringify(videoData),
      }),

    like: (videoId) =>
      apiRequest(`/api/videos/${videoId}/like`, {
        method: 'POST',
      }),
  },

  // Media (Direct S3 Upload via Presigned URL)
  media: {
    /**
     * Uploads a file directly to AWS S3 without passing bytes through the server
     * @param {File} file The file to upload
     * @param {string} folder Target folder ('videos' | 'thumbnails' | 'avatars')
     * @returns {Promise<{ key: string, publicUrl: string }>}
     */
    uploadFileToS3: async (file, folder = 'videos') => {
      // 1. Ask backend for presigned S3 upload URL
      const { uploadUrl, key, publicUrl } = await apiRequest('/api/media/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          folder,
        }),
      });

      // 2. Upload file bytes directly to Amazon S3
      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!s3Response.ok) {
        throw new Error(`S3 direct upload failed with status ${s3Response.status}`);
      }

      return { key, publicUrl };
    },
  },
};

export default api;

const BASE = '/api';

function getToken() {
  return sessionStorage.getItem('scripta_token');
}

export function setToken(token) {
  if (token) sessionStorage.setItem('scripta_token', token);
  else sessionStorage.removeItem('scripta_token');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (email, password, name) => request('/auth/register', { method: 'POST', body: { email, password, name } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  savePlatforms: (platforms) => request('/auth/platforms', { method: 'PUT', body: { platforms } }),
  me: () => request('/auth/me'),

  getBrand: () => request('/brand'),
  updateBrand: (profile) => request('/brand', { method: 'PUT', body: profile }),

  getAccounts: () => request('/accounts'),
  connectAccount: (platform, handle) => request('/accounts', { method: 'POST', body: { platform, handle } }),
  disconnectAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),

  getPosts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/posts${qs ? `?${qs}` : ''}`);
  },
  generatePosts: (idea, platforms) => request('/posts/generate', { method: 'POST', body: { idea, platforms } }),
  createPost: (post) => request('/posts', { method: 'POST', body: post }),
  updatePost: (id, post) => request(`/posts/${id}`, { method: 'PUT', body: post }),
  publishNow: (id) => request(`/posts/${id}/publish-now`, { method: 'POST' }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),

  // Media uses multipart/form-data, so it bypasses the JSON `request` helper.
  uploadMedia: async (file) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
    return data;
  },
  fitMedia: (filename, platform, mimetype) =>
    request(`/media/${filename}/fit`, { method: 'POST', body: { platform, mimetype } }),
  generateMedia: (prompt) => request('/media/generate', { method: 'POST', body: { prompt } }),

  getCampaigns: () => request('/campaigns'),
  createCampaign: (campaign) => request('/campaigns', { method: 'POST', body: campaign }),
  updateCampaign: (id, campaign) => request(`/campaigns/${id}`, { method: 'PUT', body: campaign }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
};
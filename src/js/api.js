/**
 * API utility for communicating with Cloudflare Pages Functions
 */
export const API = {
  async register(username, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async me() {
    const res = await fetch('/api/auth/me');
    return res.json();
  },

  async getBuckets() {
    const res = await fetch('/api/buckets');
    if (!res.ok) throw new Error('Failed to fetch buckets');
    return res.json();
  },

  async createBucket(bucketData) {
    const res = await fetch('/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create bucket');
    return data;
  },

  async updateBucket(id, bucketData) {
    const res = await fetch(`/api/buckets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update bucket');
    return data;
  },

  async deleteBucket(id) {
    const res = await fetch(`/api/buckets/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete bucket');
    return data;
  }
};

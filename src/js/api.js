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
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server error (Invalid JSON response)');
    }
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server error (Invalid JSON response)');
    }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
  },

  async me() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return { authenticated: false };
      return await res.json();
    } catch {
      return { authenticated: false };
    }
  },

  async getBuckets() {
    const res = await fetch('/api/buckets');
    if (!res.ok) throw new Error('Failed to fetch buckets');
    try {
      return await res.json();
    } catch {
      throw new Error('Failed to parse buckets response');
    }
  },

  async createBucket(bucketData) {
    const res = await fetch('/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketData)
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Failed to parse create bucket response');
    }
    if (!res.ok) throw new Error(data.error || 'Failed to create bucket');
    return data;
  },

  async updateBucket(id, bucketData) {
    const res = await fetch(`/api/buckets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketData)
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Failed to parse update bucket response');
    }
    if (!res.ok) throw new Error(data.error || 'Failed to update bucket');
    return data;
  },

  async deleteBucket(id) {
    const res = await fetch(`/api/buckets/${id}`, {
      method: 'DELETE'
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Failed to parse delete bucket response');
    }
    if (!res.ok) throw new Error(data.error || 'Failed to delete bucket');
    return data;
  }
};

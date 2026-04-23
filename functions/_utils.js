const DEFAULT_SECRET = 'r2-web-secret-key-change-me';

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createToken(user, secret = DEFAULT_SECRET) {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64(JSON.stringify({
    id: user.id,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }));
  
  const token = `${header}.${payload}`;
  const signature = await sign(token, secret);
  return `${token}.${signature}`;
}

export async function verifyToken(token, secret = DEFAULT_SECRET) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [header, payload, signature] = parts;
  const validSignature = await sign(`${header}.${payload}`, secret);
  
  if (signature !== validSignature) return null;
  
  try {
    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;
    return decodedPayload;
  } catch {
    return null;
  }
}

async function sign(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return b64(sig);
}

function b64(data) {
  const str = typeof data === 'string' ? data : String.fromCharCode(...new Uint8Array(data));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function getUser(request, env) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const token = cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  return verifyToken(token, env.JWT_SECRET || DEFAULT_SECRET);
}

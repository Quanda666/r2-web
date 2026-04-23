import { hashPassword, createToken, response } from '../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, password } = await request.json();

  if (!username || !password) {
    return response({ error: 'Username and password required' }, 400);
  }

  const hashedPassword = await hashPassword(password);

  const user = await env.DB.prepare(
    'SELECT id, username, password_hash FROM users WHERE username = ?'
  ).bind(username).first();

  if (!user || user.password_hash !== hashedPassword) {
    return response({ error: 'Invalid username or password' }, 401);
  }

  const token = await createToken(user);
  delete user.password_hash;

  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`
    }
  });
}

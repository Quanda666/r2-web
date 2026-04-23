import { hashPassword, createToken, response } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, password } = await request.json();

  if (!username || !password) {
    return response({ error: 'Username and password required' }, 400);
  }

  const hashedPassword = await hashPassword(password);

  try {
    const { results } = await env.DB.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id, username'
    ).bind(username, hashedPassword).run();

    const user = results[0];
    const token = await createToken(user);

    return new Response(JSON.stringify({ user }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`
      }
    });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return response({ error: 'Username already exists' }, 400);
    }
    return response({ error: e.message }, 500);
  }
}

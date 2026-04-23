import { response } from '../_utils.js';

export async function onRequestPost() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
    }
  });
}

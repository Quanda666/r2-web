import { getUser, response } from '../../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getUser(request, env);

  if (!user) {
    return response({ authenticated: false }, 200);
  }

  return response({ authenticated: true, user }, 200);
}

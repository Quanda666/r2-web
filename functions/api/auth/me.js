import { getUser, response } from '../_utils.js';

export async function onRequestGet(context) {
  const { request } = context;
  const user = await getUser(request);

  if (!user) {
    return response({ authenticated: false }, 200);
  }

  return response({ authenticated: true, user }, 200);
}

import { getUser, response } from '../../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getUser(request, env);

  if (!user) return response({ error: 'Unauthorized' }, 401);

  const buckets = await env.DB.prepare(
    'SELECT * FROM buckets WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return response(buckets.results);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUser(request, env);

  if (!user) return response({ error: 'Unauthorized' }, 401);

  const data = await request.json();
  const {
    name,
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    customDomain,
    bucketVisibility,
    isDefault
  } = data;

  if (!name || !accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return response({ error: 'Missing required fields' }, 400);
  }

  if (isDefault) {
    await env.DB.prepare('UPDATE buckets SET is_default = 0 WHERE user_id = ?')
      .bind(user.id).run();
  }

  const result = await env.DB.prepare(
    `INSERT INTO buckets (
      user_id, name, account_id, access_key_id, secret_access_key, 
      bucket_name, custom_domain, bucket_visibility, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id, name, accountId, accessKeyId, secretAccessKey,
    bucketName, customDomain, bucketVisibility, isDefault ? 1 : 0
  ).run();

  return response({ success: true, id: result.meta.last_row_id }, 201);
}

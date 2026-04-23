import { getUser, response } from '../../_utils.js';

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const user = await getUser(request, env);
  const id = params.id;

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

  if (isDefault) {
    await env.DB.prepare('UPDATE buckets SET is_default = 0 WHERE user_id = ?')
      .bind(user.id).run();
  }

  await env.DB.prepare(
    `UPDATE buckets SET 
      name = ?, account_id = ?, access_key_id = ?, secret_access_key = ?, 
      bucket_name = ?, custom_domain = ?, bucket_visibility = ?, is_default = ?
    WHERE id = ? AND user_id = ?`
  ).bind(
    name, accountId, accessKeyId, secretAccessKey, 
    bucketName, customDomain, bucketVisibility, isDefault ? 1 : 0,
    id, user.id
  ).run();

  return response({ success: true });
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const user = await getUser(request, env);
  const id = params.id;

  if (!user) return response({ error: 'Unauthorized' }, 401);

  await env.DB.prepare('DELETE FROM buckets WHERE id = ? AND user_id = ?')
    .bind(id, user.id).run();

  return response({ success: true });
}

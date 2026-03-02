export async function onRequestGet({ env }) {
  const list = await env.GIFTS.list();
  return Response.json(list.keys.map(k => k.name));
}

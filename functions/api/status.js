export async function onRequestGet({ env }) {
  const list = await env.GIFTS.list();
  const result = {};

  for (const k of list.keys) {
    const val = await env.GIFTS.get(k.name);
    result[k.name] = JSON.parse(val).count;
  }

  return Response.json(result);
}

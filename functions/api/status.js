export async function onRequestGet({ env }) {
  const list = await env.GIFTS.list();
  const result = {};

  for (const k of list.keys) {
    const raw = await env.GIFTS.get(k.name);
    // If you store {count: n} use that, otherwise treat as 1
    try {
      const obj = JSON.parse(raw);
      result[k.name] = Number(obj?.count ?? 1);
    } catch {
      result[k.name] = 1;
    }
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

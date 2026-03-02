export async function onRequestPost({ request, env }) {
  const data = await request.json();
  const { gift, first_name, last_name, email, message } = data;

  if (!gift || !first_name || !last_name || !email) {
    return new Response("Missing fields", { status: 400 });
  }

  const max = data.max ?? 1;

const existingRaw = await env.GIFTS.get(gift);
const existing = existingRaw ? JSON.parse(existingRaw) : { count: 0 };

if (existing.count >= max) {
  return new Response("Already reserved", { status: 409 });
}

await env.GIFTS.put(
  gift,
  JSON.stringify({
    count: existing.count + 1,
    last: { first_name, last_name, email, message },
    updated: new Date().toISOString()
  })
);

  await env.GIFTS.put(
    gift,
    JSON.stringify({
      first_name,
      last_name,
      email,
      message,
      date: new Date().toISOString()
    })
  );

  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: "info@claudiaetruben.ch" }] }],
      from: { email: "noreply@claudiaetruben.ch", name: "Wedding Website" },
      subject: "🎁 Gift Reserved",
      content: [{
        type: "text/plain",
        value:
`Gift: ${gift}
Name: ${first_name} ${last_name}
Email: ${email}
Message: ${message || "—"}`
      }]
    })
  });

  return new Response("OK");
}

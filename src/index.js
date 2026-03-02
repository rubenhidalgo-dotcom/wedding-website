export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- Get reserved gifts
    if (url.pathname === "/api/status") {
      const list = await env.GIFTS.list();
      return Response.json(list.keys.map(k => k.name));
    }

    // --- Reserve gift
    if (url.pathname === "/api/reserve" && request.method === "POST") {
      const data = await request.json();
      const { gift, first_name, last_name, email, message } = data;

      const existing = await env.GIFTS.get(gift);
      if (existing) {
        return new Response("Already reserved", { status: 409 });
      }

      await env.GIFTS.put(
        gift,
        JSON.stringify({ first_name, last_name, email, message, date: new Date().toISOString() })
      );

      // Send email
      await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: "info@claudiaetruben.ch" }]
          }],
          from: {
            email: "noreply@claudiaetruben.ch",
            name: "Wedding Website"
          },
          subject: "🎁 Gift Reserved",
          content: [{
            type: "text/plain",
            value:
`A gift has been reserved.

Gift: ${gift}
Name: ${first_name} ${last_name}
Email: ${email}
Message: ${message || "—"}`
          }]
        })
      });

      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  }
};

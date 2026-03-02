const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    personalizations: [
      { to: [{ email: "info@claudiaetruben.ch" }] }
    ],
    from: {
      email: "ruben.hidalgo@bluewin.ch",
      name: "Wedding Website"
    },
    subject: "TEST – Cloudflare MailChannels",
    content: [{
      type: "text/plain",
      value: "If you receive this email, MailChannels works."
    }]
  })
});

const text = await res.text();
return new Response(
  `MailChannels status: ${res.status}\n\n${text}`,
  { status: res.ok ? 200 : 502 }
);

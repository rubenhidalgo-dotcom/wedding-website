// --- Send email (and VERIFY it actually sent)
const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: "ruben.hidalgo@bluewin.ch" }] }], // TEMP: your personal email
    from: { email: "info@claudiaetruben.ch", name: "Wedding Website" },
    reply_to: { email, name: `${first_name} ${last_name}` },
    subject: "Gift reservation received",
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

const mcText = await mcRes.text();

// If MailChannels rejects, DO NOT return OK
if (!mcRes.ok) {
  return new Response(`MailChannels failed (${mcRes.status}): ${mcText}`, {
    status: 502,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

// Only return OK if MailChannels accepted it
return new Response("OK", { status: 200 });

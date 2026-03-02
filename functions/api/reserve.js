import { connect } from "cloudflare:sockets";

function b64(s) {
  return btoa(s);
}

async function readLine(reader) {
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += new TextDecoder().decode(value);
    const idx = buf.indexOf("\n");
    if (idx !== -1) {
      const line = buf.slice(0, idx + 1);
      return line.replace(/\r?\n$/, "");
    }
  }
  return buf.trim();
}

async function expectCode(reader, codePrefix) {
  let line = await readLine(reader);
  if (!line.startsWith(codePrefix)) {
    throw new Error(`SMTP expected ${codePrefix}*, got: ${line}`);
  }
  while (line.length >= 4 && line[3] === "-") {
    line = await readLine(reader);
    if (!line.startsWith(codePrefix)) {
      throw new Error(`SMTP expected ${codePrefix}*, got: ${line}`);
    }
  }
}

async function writeLine(writer, line) {
  await writer.write(new TextEncoder().encode(line + "\r\n"));
}

async function sendMailInfomaniak({ user, pass, from, to, subject, text }) {
  const socket = connect(
    { hostname: "mail.infomaniak.com", port: 587 },
    { secureTransport: "starttls" }
  );

  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();

  await expectCode(reader, "220");

  await writeLine(writer, "EHLO claudiaetruben.ch");
  await expectCode(reader, "250");

  await writeLine(writer, "STARTTLS");
  await expectCode(reader, "220");

  const tlsSocket = socket.startTls();
  reader.releaseLock();
  writer.releaseLock();

  const tlsReader = tlsSocket.readable.getReader();
  const tlsWriter = tlsSocket.writable.getWriter();

  await writeLine(tlsWriter, "EHLO claudiaetruben.ch");
  await expectCode(tlsReader, "250");

  await writeLine(tlsWriter, "AUTH LOGIN");
  await expectCode(tlsReader, "334");
  await writeLine(tlsWriter, b64(user));
  await expectCode(tlsReader, "334");
  await writeLine(tlsWriter, b64(pass));
  await expectCode(tlsReader, "235");

  await writeLine(tlsWriter, `MAIL FROM:<${from}>`);
  await expectCode(tlsReader, "250");

  await writeLine(tlsWriter, `RCPT TO:<${to}>`);
  await expectCode(tlsReader, "250");

  await writeLine(tlsWriter, "DATA");
  await expectCode(tlsReader, "354");

  const headers =
`From: Wedding Website <${from}>
To: <${to}>
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8`;

  // SMTP message must end with "\r\n.\r\n"
  const msg = `${headers}\r\n\r\n${text}\r\n.`;

  await tlsWriter.write(new TextEncoder().encode(msg.replace(/\n/g, "\r\n") + "\r\n"));
  await expectCode(tlsReader, "250");

  await writeLine(tlsWriter, "QUIT");
  try { await expectCode(tlsReader, "221"); } catch {}

  tlsSocket.close();
}

export async function onRequestPost({ request, env }) {
  const data = await request.json();
  const { gift, first_name, last_name, email, message } = data;

  if (!gift || !first_name || !last_name || !email) {
    return new Response("Missing fields", { status: 400 });
  }

  // (keep your KV reserve logic here if you already have it)
  // e.g. update count / max etc. before sending email

  try {
    await sendMailInfomaniak({
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.SMTP_FROM || env.SMTP_USER,
      to: env.SMTP_TO || env.SMTP_USER,
      subject: "Gift reservation received",
      text:
`A gift has been reserved.

Gift: ${gift}
Name: ${first_name} ${last_name}
Email: ${email}
Message: ${message || "—"}`
    });
  } catch (err) {
    return new Response(`SMTP send failed: ${err?.message || err}`, { status: 502 });
  }

  return new Response("OK", { status: 200 });
}

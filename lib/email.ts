import nodemailer from "nodemailer";

export type SendVerificationResult =
  | { ok: true; devLogged?: boolean }
  | { ok: false; error: string };

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(opts: {
  to: string;
  verifyUrl: string;
}): Promise<SendVerificationResult> {
  const from = process.env.SMTP_FROM ?? process.env.EMAIL_FROM;
  const subject = "Verify your email — Bambu Filament Inventory";
  const text = `Open this link to verify your email (valid for 48 hours):\n${opts.verifyUrl}`;
  const html = `<p>Hi,</p><p>Please verify your email using the link below (<strong>valid for 48 hours</strong>):</p><p><a href="${opts.verifyUrl}">${opts.verifyUrl}</a></p><p>If you did not sign up, you can ignore this message.</p>`;

  const transport = createTransport();
  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email] SMTP not configured; dev verification link:\n", opts.verifyUrl);
      return { ok: true, devLogged: true };
    }
    return {
      ok: false,
      error:
        "Email not configured: set SMTP_HOST, SMTP_PORT (optional), SMTP_USER, SMTP_PASS, and SMTP_FROM (or EMAIL_FROM).",
    };
  }

  if (!from) {
    return { ok: false, error: "Missing sender: set SMTP_FROM or EMAIL_FROM." };
  }

  try {
    await transport.sendMail({ from, to: opts.to, subject, text, html });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, error: msg };
  }
}

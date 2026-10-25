import "server-only";

type Mail = { to: string; subject: string; text: string };

/**
 * Sends e-mail through Resend's HTTP API when RESEND_API_KEY is set.
 * Without a key, in development the message is printed to the server console.
 * In production without a key, sending fails loudly instead of pretending.
 * NOTE: the Resend call has not been tested from this project (no API key was available).
 */
export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const forceConsole = process.env.MAIL_TRANSPORT === "console"; // testing only, never on a live shop
  if (!key || forceConsole) {
    if (process.env.NODE_ENV === "production" && !forceConsole) {
      throw new Error("E-posta servisi yapılandırılmadı (RESEND_API_KEY).");
    }
    console.info(`\n[DEV MAIL] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "no-reply@example.com",
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!res.ok) throw new Error(`E-posta gönderilemedi (${res.status}).`);
}

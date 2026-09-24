// Envío del enlace mágico. Con BREVO_API_KEY manda un correo; si no,
// devuelve el enlace para desarrollo (se muestra en la propia pantalla).

export async function sendMagicLink(email: string, link: string): Promise<{ sent: boolean; devLink?: string }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.log(`[reflejo] Enlace mágico para ${email}: ${link}`);
    return { sent: false, devLink: link };
  }
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;color:#23233a">Entra en Reflejo</h1>
      <p style="color:#444">Pulsa el botón para iniciar sesión y sincronizar tus datos.</p>
      <p><a href="${link}" style="display:inline-block;background:#3e4c7e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">Entrar en Reflejo</a></p>
      <p style="color:#888;font-size:12px">El enlace caduca en 15 minutos. Si no lo pediste, ignora este correo.</p>
    </div>`;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: process.env.BREVO_SENDER_EMAIL || "no-reply@reflejo.app", name: process.env.BREVO_SENDER_NAME || "Reflejo" },
        to: [{ email }],
        subject: "Tu enlace para entrar en Reflejo",
        htmlContent: html,
      }),
    });
    return { sent: res.ok };
  } catch {
    return { sent: false, devLink: link };
  }
}

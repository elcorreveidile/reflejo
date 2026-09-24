// Proveedores de IA con failover, compatibles con la API de mensajes de Anthropic.
// Con ZAI_API_KEY usa z.ai; si no, Anthropic. Sin ninguna clave, la IA se omite.

interface Provider {
  url: string;
  key: string;
  model: string;
}

function providers(): Provider[] {
  const list: Provider[] = [];
  if (process.env.ZAI_API_KEY) {
    const base = process.env.ZAI_BASE_URL || "https://api.z.ai/api/anthropic";
    list.push({ url: `${base}/v1/messages`, key: process.env.ZAI_API_KEY, model: process.env.ZAI_MODEL || "glm-4.6" });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    list.push({ url: "https://api.anthropic.com/v1/messages", key: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest" });
  }
  return list;
}

export function aiConfigured(): boolean {
  return providers().length > 0;
}

interface AnthropicResponse {
  content?: Array<{ text?: string }>;
}

export async function askAI(system: string, user: string, maxTokens = 400): Promise<string | null> {
  for (const p of providers()) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(p.url, {
        method: "POST",
        headers: {
          "x-api-key": p.key,
          authorization: `Bearer ${p.key}`,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({ model: p.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const j = (await res.json()) as AnthropicResponse;
      const text = Array.isArray(j.content) ? j.content.map((c) => c.text ?? "").join("").trim() : "";
      if (text) return text;
    } catch {
      /* siguiente proveedor */
    }
  }
  return null;
}

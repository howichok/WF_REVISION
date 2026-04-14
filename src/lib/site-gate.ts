const GATE_PREFIX = "wf-site-gate|";

export const SITE_GATE_COOKIE = "wf_site_gate";

export function isSiteGateEnabled(): boolean {
  return Boolean(process.env.SITE_GATE_PASSWORD?.trim());
}

function gateKeyMaterial(): string {
  const secret = process.env.SITE_GATE_SECRET?.trim();
  const password = process.env.SITE_GATE_PASSWORD?.trim();
  if (secret) {
    return secret;
  }
  if (password) {
    return password;
  }
  return "";
}

export async function siteGateExpectedToken(): Promise<string | null> {
  const password = process.env.SITE_GATE_PASSWORD?.trim();
  const keyMaterial = gateKeyMaterial();
  if (!password || !keyMaterial) {
    return null;
  }
  return siteGateTokenFromParts(password, keyMaterial);
}

export async function siteGateTokenFromParts(password: string, keyMaterial: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${GATE_PREFIX}${password}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

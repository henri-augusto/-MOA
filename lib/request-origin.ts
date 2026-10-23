import "server-only";

import { headers } from "next/headers";

export async function requestOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function isLocalDevHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * Base URL for auth redirects (e-mail confirmation, OAuth callback).
 * Prefer SITE_URL so clients cannot steer the confirmation link via Host / Origin headers.
 */
export async function authSiteOrigin(): Promise<string> {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) {
    let url: URL;
    try {
      url = new URL(configured);
    } catch {
      throw new Error("SITE_URL inválida. Use uma URL absoluta, por exemplo https://moa.exemplo.br.");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("SITE_URL precisa usar http ou https.");
    }
    return url.origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Defina SITE_URL com a URL pública do site.");
  }

  const fromRequest = await requestOrigin();
  let url: URL;
  try {
    url = new URL(fromRequest);
  } catch {
    throw new Error("Não foi possível determinar a origem do site em desenvolvimento.");
  }
  if (!isLocalDevHost(url.hostname)) {
    throw new Error("Em desenvolvimento sem SITE_URL, só localhost e 127.0.0.1 são aceitos.");
  }
  return url.origin;
}

export function safeRedirectPath(value: string | null, fallback: string, siteOrigin: string) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return fallback;
  }

  try {
    const base = new URL(siteOrigin);
    const resolved = new URL(value, base);
    if (resolved.origin !== base.origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

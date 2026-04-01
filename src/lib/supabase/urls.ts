function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

export function getConfiguredAppOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredOrigin) {
    return null;
  }

  try {
    return normalizeOrigin(new URL(configuredOrigin).toString());
  } catch {
    return null;
  }
}

export function getAppOrigin() {
  const configuredOrigin = getConfiguredAppOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return normalizeOrigin(window.location.origin);
  }

  return null;
}

export function buildAuthRedirectUrl(pathname: string) {
  const origin = getAppOrigin();

  if (!origin) {
    return undefined;
  }

  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin}${path}`;
}

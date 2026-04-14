const STORAGE_KEY = "wf-saved-login-profile-v1";
const PROMPT_DISMISSED_KEY = "wf-save-profile-prompt-dismissed-v1";

export type SavedLoginProfileV1 = {
  v: 1;
  email: string;
  displayName: string;
  /** ISO timestamp when the plate expires (typically +30 days). */
  expiresAt: string;
};

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function readSavedLoginProfile(): SavedLoginProfileV1 | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SavedLoginProfileV1;
    if (parsed?.v !== 1 || !parsed.email?.trim() || !parsed.expiresAt) {
      return null;
    }
    if (Date.now() > Date.parse(parsed.expiresAt)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedLoginProfile(input: { email: string; displayName: string }) {
  if (typeof window === "undefined") {
    return;
  }
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  const payload: SavedLoginProfileV1 = {
    v: 1,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim() || "Student",
    expiresAt,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function clearSavedLoginProfile() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** User chose “Don’t ask again” on the save-profile prompt — skip the modal after future logins. */
export function readSaveProfilePromptDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSaveProfilePromptDismissed() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Best-effort: store in the browser password manager (Chrome etc.) when supported. */
export async function tryStorePasswordCredential(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<void> {
  if (typeof window === "undefined" || !window.isSecureContext) {
    return;
  }
  const PasswordCredentialCtor = (
    window as unknown as {
      PasswordCredential?: new (init: {
        id: string;
        password: string;
        name: string;
      }) => unknown;
    }
  ).PasswordCredential;
  if (!PasswordCredentialCtor || !navigator.credentials?.store) {
    return;
  }
  try {
    const cred = new PasswordCredentialCtor({
      id: params.email,
      password: params.password,
      name: params.displayName,
    });
    await navigator.credentials.store(cred as Credential);
  } catch {
    /* user denied or unsupported */
  }
}

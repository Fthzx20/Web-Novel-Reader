export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export const AUTH_KEY = "nocturne:auth";

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_KEY);
}

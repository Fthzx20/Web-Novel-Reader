"use client";

import { useSyncExternalStore } from "react";

import { AUTH_KEY, type AuthSession } from "./auth";

let cachedRaw: string | null | undefined;
let cachedSession: AuthSession | null | undefined;

const readSessionSnapshot = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_KEY);

  if (raw === cachedRaw) {
    return cachedSession ?? null;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedSession = null;
    return null;
  }

  try {
    cachedSession = JSON.parse(raw) as AuthSession;
  } catch {
    cachedSession = null;
  }

  return cachedSession;
};

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: StorageEvent) => {
    if (!event.key || event.key === AUTH_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", handler);
  window.addEventListener("auth-session", callback);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("auth-session", callback);
  };
};

export function useAuthSession(): AuthSession | null | undefined {
  return useSyncExternalStore(subscribe, readSessionSnapshot, () => undefined);
}

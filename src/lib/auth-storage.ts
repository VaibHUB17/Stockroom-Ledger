import { AuthUser } from "./types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function setSession(user: AuthUser): void {
  if (typeof document === "undefined") return;

  // Set cookie for middleware access before render
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(user.accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Store user profile details in localStorage for UI header
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage access may fail in private mode or full storage
  }
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_KEY}=`));

  if (!match) return null;
  return decodeURIComponent(match.split("=")[1]);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof document === "undefined") return;

  // Clear cookie
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;

  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage errors on cleanup
  }
}

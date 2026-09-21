import * as SecureStore from "expo-secure-store";
import { configureCore, type KeyValueStorage } from "core";
import i18n from "./i18n";

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3000";

const REFRESH_TOKEN_KEY = "moviemark.refreshToken";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function persistRefreshToken(
  token: string | null
): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  let refreshToken: string | null = null;
  try {
    refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client": "mobile",
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await persistRefreshToken(null);
      return null;
    }
    const body = (await res.json()) as {
      accessToken: string;
      refreshToken?: string;
    };
    accessToken = body.accessToken;
    if (body.refreshToken) {
      await persistRefreshToken(body.refreshToken);
    }
    return body.accessToken;
  } catch {
    return null;
  }
}

const storage: KeyValueStorage = {
  getItem: () => null,
  setItem: () => {},
};

configureCore({
  apiBase: API_BASE,
  client: "mobile",
  getAccessToken,
  setAccessToken,
  refreshAccessToken,
  translate: (key) => i18n.t(key),
  translateExists: (key) => i18n.exists(key),
  getLanguage: () => i18n.language,
  storage,
});

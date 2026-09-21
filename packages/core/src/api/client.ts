import type { AuthErrorResponse, RegisterErrorResponse } from "shared";
import { coreConfig } from "../config";

type ApiErrorBody = AuthErrorResponse | RegisterErrorResponse;

function extractErrorMessage(body: ApiErrorBody | unknown): string {
  const { translate, translateExists } = coreConfig();
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    const code = (body as { error: string }).error;
    if (code.startsWith("error.") && translateExists(code)) {
      return translate(code);
    }
    return code;
  }
  return translate("error.generic");
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) {
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

export function refreshTokenOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = coreConfig()
      .refreshAccessToken()
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  includeAuth?: boolean;
  useRefresh?: boolean;
}

async function rawFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { apiBase, getAccessToken, client } = coreConfig();
  const { method = "GET", body, includeAuth = true } = options;

  const headers: Record<string, string> = {
    "X-Client": client,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    return await fetch(`${apiBase}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(coreConfig().translate("common.networkError"));
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  retried = false
): Promise<T> {
  const { useRefresh = true } = options;

  let res = await rawFetch(path, options);

  if (res.status === 401 && useRefresh && !retried) {
    const newToken = await refreshTokenOnce();
    if (newToken) {
      res = await rawFetch(path, options);
    } else {
      coreConfig().setAccessToken(null);
    }
  }

  if (!res.ok) {
    const body = await parseBody(res);
    throw new Error(extractErrorMessage(body));
  }

  return (await parseBody(res)) as T;
}

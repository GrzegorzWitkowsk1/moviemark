import type {
  AddMovieRequest,
  AuthErrorResponse,
  CollectionResponse,
  LoginRequest,
  LoginResponse,
  MovieStatusResponse,
  MarkEpisodesRequest,
  RefreshResponse,
  RegisterErrorResponse,
  RegisterRequest,
  RegisterResponse,
  SeriesStatusResponse,
  UserResponse,
} from "shared";
import { config } from "./config";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./token";

type ApiErrorBody =
  | AuthErrorResponse
  | RegisterErrorResponse;

function extractErrorMessage(body: ApiErrorBody | unknown): string {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    return (body as { error: string }).error;
  }
  return "Something went wrong. Please try again.";
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

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${config.apiBase}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      clearAccessToken();
      return null;
    }
    const body = (await res.json()) as RefreshResponse;
    setAccessToken(body.accessToken);
    return body.accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
}

export function refreshTokenOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  includeAuth?: boolean;
  useRefresh?: boolean;
}

async function rawFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const {
    method = "GET",
    body,
    includeAuth = true,
  } = options;

  const headers: Record<string, string> = {};
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
    return await fetch(`${config.apiBase}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Network error. Please try again later.");
  }
}

async function apiFetch<T>(
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
      clearAccessToken();
    }
  }

  if (!res.ok) {
    const body = await parseBody(res);
    throw new Error(extractErrorMessage(body));
  }

  return (await parseBody(res)) as T;
}

export async function registerUser(
  payload: RegisterRequest
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: payload,
    includeAuth: false,
    useRefresh: false,
  });
}

export async function loginUser(
  payload: LoginRequest
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
    includeAuth: false,
    useRefresh: false,
  });
}

export async function logoutUser(): Promise<void> {
  try {
    await apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
      useRefresh: false,
    });
  } finally {
    clearAccessToken();
  }
}

export async function getCurrentUser(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/me");
}

export async function getCollection(): Promise<CollectionResponse> {
  return apiFetch<CollectionResponse>("/collection");
}

export async function getMovieCollectionStatus(
  tmdbId: number
): Promise<MovieStatusResponse> {
  return apiFetch<MovieStatusResponse>(`/collection/movie/${tmdbId}`);
}

export async function addMovieToCollection(
  payload: AddMovieRequest
): Promise<MovieStatusResponse> {
  return apiFetch<MovieStatusResponse>("/collection/movie", {
    method: "POST",
    body: payload,
  });
}

export async function removeMovieFromCollection(
  tmdbId: number
): Promise<MovieStatusResponse> {
  return apiFetch<MovieStatusResponse>(`/collection/movie/${tmdbId}`, {
    method: "DELETE",
  });
}

export async function getSeriesCollectionStatus(
  tmdbId: number
): Promise<SeriesStatusResponse> {
  return apiFetch<SeriesStatusResponse>(`/collection/series/${tmdbId}`);
}

export async function checkSeriesEpisode(
  payload: MarkEpisodesRequest
): Promise<SeriesStatusResponse> {
  return apiFetch<SeriesStatusResponse>("/collection/series/episode", {
    method: "PUT",
    body: payload,
  });
}

export async function uncheckSeriesEpisode(
  tmdbId: number,
  season: number,
  episode: number
): Promise<SeriesStatusResponse> {
  return apiFetch<SeriesStatusResponse>(
    `/collection/series/${tmdbId}/episode?season=${season}&episode=${episode}`,
    {
      method: "DELETE",
    }
  );
}
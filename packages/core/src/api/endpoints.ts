import type {
  AddMovieRequest,
  AddFutureMovieRequest,
  AddFutureSeriesRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CollectionResponse,
  CustomItemResponse,
  CustomMovieRequest,
  CustomSeriesRequest,
  FutureListResponse,
  FutureStatusResponse,
  LoginRequest,
  LoginResponse,
  MarkEpisodesRequest,
  MovieStatusResponse,
  RegisterRequest,
  RegisterResponse,
  SeriesStatusResponse,
  TmdbMediaType,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserResponse,
} from "shared";
import { coreConfig } from "../config";
import { apiFetch } from "./client";

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
    coreConfig().setAccessToken(null);
  }
}

export async function getCurrentUser(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/me");
}

export async function updateProfile(
  payload: UpdateProfileRequest
): Promise<UpdateProfileResponse> {
  return apiFetch<UpdateProfileResponse>("/auth/profile", {
    method: "PUT",
    body: payload,
  });
}

export async function changePassword(
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return apiFetch<ChangePasswordResponse>("/auth/password", {
    method: "PUT",
    body: payload,
  });
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

export async function createCustomMovie(
  payload: CustomMovieRequest
): Promise<CustomItemResponse> {
  return apiFetch<CustomItemResponse>("/custom/movie", {
    method: "POST",
    body: payload,
  });
}

export async function createCustomSeries(
  payload: CustomSeriesRequest
): Promise<CustomItemResponse> {
  return apiFetch<CustomItemResponse>("/custom/series", {
    method: "POST",
    body: payload,
  });
}

export async function getCustomItem(
  id: number,
  type: TmdbMediaType
): Promise<CustomItemResponse> {
  return apiFetch<CustomItemResponse>(`/custom/${id}?type=${type}`);
}

export async function getFutureList(): Promise<FutureListResponse> {
  return apiFetch<FutureListResponse>("/future");
}

export async function getFutureMovieStatus(
  tmdbId: number
): Promise<FutureStatusResponse> {
  return apiFetch<FutureStatusResponse>(`/future/movie/${tmdbId}`);
}

export async function addFutureMovie(
  payload: AddFutureMovieRequest
): Promise<FutureStatusResponse> {
  return apiFetch<FutureStatusResponse>("/future/movie", {
    method: "POST",
    body: payload,
  });
}

export async function removeFutureMovie(
  tmdbId: number
): Promise<FutureStatusResponse> {
  return apiFetch<FutureStatusResponse>(`/future/movie/${tmdbId}`, {
    method: "DELETE",
  });
}

export async function getFutureSeriesStatus(
  tmdbId: number
): Promise<FutureStatusResponse> {
  return apiFetch<FutureStatusResponse>(`/future/series/${tmdbId}`);
}

export async function addFutureSeries(
  payload: AddFutureSeriesRequest
): Promise<FutureStatusResponse> {
  return apiFetch<FutureStatusResponse>("/future/series", {
    method: "POST",
    body: payload,
  });
}

export async function removeFutureSeries(
  tmdbId: number
): Promise<FutureStatusResponse> {
  return apiFetch<FutureStatusResponse>(`/future/series/${tmdbId}`, {
    method: "DELETE",
  });
}

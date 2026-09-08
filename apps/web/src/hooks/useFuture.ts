import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FutureStatusResponse } from "shared";
import {
  addFutureMovie,
  addFutureSeries,
  getFutureList,
  getFutureMovieStatus,
  getFutureSeriesStatus,
  removeFutureMovie,
  removeFutureSeries,
} from "@/lib/api";

export const futureKey = ["future"] as const;
export const futureMovieStatusKey = (tmdbId: number) => [
  "future",
  "movie",
  tmdbId,
];
export const futureSeriesStatusKey = (tmdbId: number) => [
  "future",
  "series",
  tmdbId,
];

export function useFutureList() {
  return useQuery({
    queryKey: futureKey,
    queryFn: getFutureList,
  });
}

export function useMovieFutureStatus(tmdbId: number) {
  return useQuery({
    queryKey: futureMovieStatusKey(tmdbId),
    queryFn: () => getFutureMovieStatus(tmdbId),
    enabled: Number.isFinite(tmdbId) && tmdbId !== 0,
  });
}

export function useSeriesFutureStatus(tmdbId: number) {
  return useQuery({
    queryKey: futureSeriesStatusKey(tmdbId),
    queryFn: () => getFutureSeriesStatus(tmdbId),
    enabled: Number.isFinite(tmdbId) && tmdbId !== 0,
  });
}

export function useAddFutureMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFutureMovie,
    onMutate: async ({ tmdbId }) => {
      await queryClient.cancelQueries({
        queryKey: futureMovieStatusKey(tmdbId),
      });
      queryClient.setQueryData<FutureStatusResponse>(
        futureMovieStatusKey(tmdbId),
        { wanted: true }
      );
    },
    onSettled: (_data, _error, { tmdbId }) => {
      queryClient.invalidateQueries({
        queryKey: futureMovieStatusKey(tmdbId),
      });
      queryClient.invalidateQueries({ queryKey: futureKey });
    },
  });
}

export function useRemoveFutureMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFutureMovie,
    onMutate: async (tmdbId) => {
      await queryClient.cancelQueries({
        queryKey: futureMovieStatusKey(tmdbId),
      });
      queryClient.setQueryData<FutureStatusResponse>(
        futureMovieStatusKey(tmdbId),
        { wanted: false }
      );
    },
    onSettled: (_data, _error, tmdbId) => {
      queryClient.invalidateQueries({
        queryKey: futureMovieStatusKey(tmdbId),
      });
      queryClient.invalidateQueries({ queryKey: futureKey });
    },
  });
}

export function useAddFutureSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFutureSeries,
    onMutate: async ({ tmdbId }) => {
      await queryClient.cancelQueries({
        queryKey: futureSeriesStatusKey(tmdbId),
      });
      queryClient.setQueryData<FutureStatusResponse>(
        futureSeriesStatusKey(tmdbId),
        { wanted: true }
      );
    },
    onSettled: (_data, _error, { tmdbId }) => {
      queryClient.invalidateQueries({
        queryKey: futureSeriesStatusKey(tmdbId),
      });
      queryClient.invalidateQueries({ queryKey: futureKey });
    },
  });
}

export function useRemoveFutureSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFutureSeries,
    onMutate: async (tmdbId) => {
      await queryClient.cancelQueries({
        queryKey: futureSeriesStatusKey(tmdbId),
      });
      queryClient.setQueryData<FutureStatusResponse>(
        futureSeriesStatusKey(tmdbId),
        { wanted: false }
      );
    },
    onSettled: (_data, _error, tmdbId) => {
      queryClient.invalidateQueries({
        queryKey: futureSeriesStatusKey(tmdbId),
      });
      queryClient.invalidateQueries({ queryKey: futureKey });
    },
  });
}

export interface FutureToggleControls {
  wanted: boolean;
  toggle: () => void;
  isPending: boolean;
}

export function useFutureMovieControls(
  tmdbId: number,
  meta: { title: string; posterPath: string | null; rating?: number }
): FutureToggleControls {
  const { data } = useMovieFutureStatus(tmdbId);
  const addFuture = useAddFutureMovie();
  const removeFuture = useRemoveFutureMovie();

  const toggle = () => {
    if (data?.wanted) {
      removeFuture.mutate(tmdbId);
    } else {
      addFuture.mutate({
        tmdbId,
        title: meta.title,
        posterPath: meta.posterPath,
        rating: meta.rating,
      });
    }
  };

  return {
    wanted: data?.wanted ?? false,
    toggle,
    isPending: addFuture.isPending || removeFuture.isPending,
  };
}

export function useFutureSeriesControls(
  tmdbId: number,
  meta: { name: string; posterPath: string | null; rating?: number }
): FutureToggleControls {
  const { data } = useSeriesFutureStatus(tmdbId);
  const addFuture = useAddFutureSeries();
  const removeFuture = useRemoveFutureSeries();

  const toggle = () => {
    if (data?.wanted) {
      removeFuture.mutate(tmdbId);
    } else {
      addFuture.mutate({
        tmdbId,
        name: meta.name,
        posterPath: meta.posterPath,
        rating: meta.rating,
      });
    }
  };

  return {
    wanted: data?.wanted ?? false,
    toggle,
    isPending: addFuture.isPending || removeFuture.isPending,
  };
}
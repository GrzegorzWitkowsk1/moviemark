import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MarkEpisodesRequest,
  MovieStatusResponse,
  SeriesStatusResponse,
} from "shared";
import {
  addMovieToCollection,
  checkSeriesEpisode,
  getCollection,
  getMovieCollectionStatus,
  getSeriesCollectionStatus,
  removeMovieFromCollection,
  uncheckSeriesEpisode,
} from "@/lib/api";

export const collectionKey = ["collection"] as const;
export const movieStatusKey = (tmdbId: number) => [
  "collection",
  "movie",
  tmdbId,
];
export const seriesStatusKey = (tmdbId: number) => [
  "collection",
  "series",
  tmdbId,
];

export function useCollection() {
  return useQuery({
    queryKey: collectionKey,
    queryFn: getCollection,
  });
}

export function useMovieWatched(tmdbId: number) {
  return useQuery({
    queryKey: movieStatusKey(tmdbId),
    queryFn: () => getMovieCollectionStatus(tmdbId),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
  });
}

export function useSeriesWatched(tmdbId: number) {
  return useQuery({
    queryKey: seriesStatusKey(tmdbId),
    queryFn: () => getSeriesCollectionStatus(tmdbId),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
  });
}

export function useAddMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMovieToCollection,
    onMutate: async ({ tmdbId }) => {
      await queryClient.cancelQueries({ queryKey: movieStatusKey(tmdbId) });
      queryClient.setQueryData<MovieStatusResponse>(
        movieStatusKey(tmdbId),
        { watched: true }
      );
    },
    onSettled: (_data, _error, { tmdbId }) => {
      queryClient.invalidateQueries({ queryKey: movieStatusKey(tmdbId) });
      queryClient.invalidateQueries({ queryKey: collectionKey });
    },
  });
}

export function useRemoveMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMovieFromCollection,
    onMutate: async (tmdbId) => {
      await queryClient.cancelQueries({ queryKey: movieStatusKey(tmdbId) });
      queryClient.setQueryData<MovieStatusResponse>(
        movieStatusKey(tmdbId),
        { watched: false }
      );
    },
    onSettled: (_data, _error, tmdbId) => {
      queryClient.invalidateQueries({ queryKey: movieStatusKey(tmdbId) });
      queryClient.invalidateQueries({ queryKey: collectionKey }); 
    },
  });
}

export function useCheckEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkSeriesEpisode,
    onMutate: async ({ tmdbId, season, episodes }) => {
      await queryClient.cancelQueries({ queryKey: seriesStatusKey(tmdbId) });
      queryClient.setQueryData<SeriesStatusResponse>(
        seriesStatusKey(tmdbId),
        (current) => {
          const watchedEpisodes = current?.watchedEpisodes ?? [];
          const toAdd = episodes.filter(
            (episode) =>
              !watchedEpisodes.some(
                (e) => e.season === season && e.episode === episode
              )
          );
          return {
            watched: true,
            watchedCount: watchedEpisodes.length + toAdd.length,
            totalEpisodes: current?.totalEpisodes ?? 0,
            watchedEpisodes: [
              ...watchedEpisodes,
              ...toAdd.map((episode) => ({ season, episode })),
            ],
          };
        }
      );
    },
    onSettled: (_data, _error, { tmdbId }) => {
      queryClient.invalidateQueries({ queryKey: seriesStatusKey(tmdbId) });
      queryClient.invalidateQueries({ queryKey: collectionKey }); 
    },
  });
}

export function useUncheckEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tmdbId,
      season,
      episode,
    }: {
      tmdbId: number;
      season: number;
      episode: number;
    }) => uncheckSeriesEpisode(tmdbId, season, episode),
    onMutate: async ({ tmdbId, season, episode }) => {
      await queryClient.cancelQueries({ queryKey: seriesStatusKey(tmdbId) });
      queryClient.setQueryData<SeriesStatusResponse>(
        seriesStatusKey(tmdbId),
        (current) => {
          const watchedEpisodes =
            current?.watchedEpisodes.filter(
              (e) => e.season !== season || e.episode !== episode
            ) ?? [];
          return {
            watched: watchedEpisodes.length > 0,
            watchedCount: watchedEpisodes.length,
            totalEpisodes: current?.totalEpisodes ?? 0,
            watchedEpisodes,
          };
        }
      );
    },
    onSettled: (_data, _error, { tmdbId }) => {
      queryClient.invalidateQueries({ queryKey: seriesStatusKey(tmdbId) });
      queryClient.invalidateQueries({ queryKey: collectionKey }); 
    },
  });
}

export interface SeriesMeta {
  name: string;
  posterPath: string | null;
  totalEpisodes: number;
  rating?: number;
}

export interface SeriesWatchedControls {
  isEpisodeWatched: (season: number, episode: number) => boolean;
  countWatchedEpisodes: (season: number) => number;
  markEpisodesWatched: (
    season: number,
    episodes: number[]
  ) => Promise<void>;
  unmarkEpisode: (season: number, episode: number) => Promise<void>;
}

export function useSeriesWatchedControls(
  tvId: number,
  meta: SeriesMeta
): SeriesWatchedControls {
  const { data } = useSeriesWatched(tvId);
  const checkEpisode = useCheckEpisode();
  const uncheckEpisode = useUncheckEpisode();

  const watchedEpisodes = data?.watchedEpisodes ?? [];

  const watchedKeys = new Set(
    watchedEpisodes.map((e) => `${e.season}:${e.episode}`)
  );

  const isEpisodeWatched = (season: number, episode: number) =>
    watchedKeys.has(`${season}:${episode}`);

  const countWatchedEpisodes = (season: number) =>
    watchedEpisodes.filter((e) => e.season === season).length;

  const markEpisodesWatched = async (season: number, episodes: number[]) => {
    const payload: MarkEpisodesRequest = {
      tmdbId: tvId,
      season,
      episodes,
      name: meta.name,
      posterPath: meta.posterPath,
      totalEpisodes: meta.totalEpisodes,
      rating: meta.rating,
    };
    await checkEpisode.mutateAsync(payload);
  };

  const unmarkEpisode = async (season: number, episode: number) => {
    await uncheckEpisode.mutateAsync({ tmdbId: tvId, season, episode });
  };

  return {
    isEpisodeWatched,
    countWatchedEpisodes,
    markEpisodesWatched,
    unmarkEpisode,
  };
}
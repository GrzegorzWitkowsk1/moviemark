import { useSyncExternalStore } from "react";

const STORAGE_KEY = "moviemark.watched";

interface WatchedStore {
  movies: number[];
  episodes: Record<string, true>;
  skipEpisodePrompt: Record<number, true>;
}

const DEFAULT_STORE: WatchedStore = {
  movies: [],
  episodes: {},
  skipEpisodePrompt: {},
};

function load(): WatchedStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STORE;
    }
    const parsed = JSON.parse(raw) as Partial<WatchedStore>;
    return {
      movies: Array.isArray(parsed.movies) ? parsed.movies : [],
      episodes: parsed.episodes ?? {},
      skipEpisodePrompt: parsed.skipEpisodePrompt ?? {},
    };
  } catch {
    return DEFAULT_STORE;
  }
}

let store: WatchedStore = load();

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: WatchedStore) {
  store = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / availability errors
  }
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): WatchedStore {
  return store;
}

const episodeKey = (tvId: number, season: number, episode: number) =>
  `${tvId}:${season}:${episode}`;

export function toggleMovieWatched(id: number): boolean {
  const next = { ...store, movies: store.movies.includes(id) ? store.movies.filter((m) => m !== id) : [...store.movies, id] };
  persist(next);
  return next.movies.includes(id);
}

export function isMovieWatched(id: number): boolean {
  return store.movies.includes(id);
}

export function toggleEpisodeWatched(
  tvId: number,
  season: number,
  episode: number
): boolean {
  const key = episodeKey(tvId, season, episode);
  const episodes = { ...store.episodes };
  if (episodes[key]) {
    delete episodes[key];
  } else {
    episodes[key] = true;
  }
  persist({ ...store, episodes });
  return !!episodes[key];
}

export function isEpisodeWatched(
  tvId: number,
  season: number,
  episode: number
): boolean {
  return !!store.episodes[episodeKey(tvId, season, episode)];
}

export function countWatchedEpisodes(tvId: number, season: number): number {
  const prefix = `${tvId}:${season}:`;
  return Object.keys(store.episodes).filter((key) =>
    key.startsWith(prefix)
  ).length;
}

export function markEpisodesWatched(
  tvId: number,
  season: number,
  episodes: number[]
): void {
  const next = { ...store.episodes };
  episodes.forEach((episode) => {
    next[episodeKey(tvId, season, episode)] = true;
  });
  persist({ ...store, episodes: next });
}

export function isEpisodePromptSkipped(tvId: number): boolean {
  return !!store.skipEpisodePrompt[tvId];
}

export function skipEpisodePromptsFor(tvId: number): void {
  persist({ ...store, skipEpisodePrompt: { ...store.skipEpisodePrompt, [tvId]: true } });
}

interface WatchedApi {
  isMovieWatched: typeof isMovieWatched;
  toggleMovieWatched: typeof toggleMovieWatched;
  isEpisodeWatched: typeof isEpisodeWatched;
  toggleEpisodeWatched: typeof toggleEpisodeWatched;
  countWatchedEpisodes: typeof countWatchedEpisodes;
  markEpisodesWatched: typeof markEpisodesWatched;
  isEpisodePromptSkipped: typeof isEpisodePromptSkipped;
  skipEpisodePromptsFor: typeof skipEpisodePromptsFor;
}

export function useWatched(): WatchedApi {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    isMovieWatched,
    toggleMovieWatched,
    isEpisodeWatched,
    toggleEpisodeWatched,
    countWatchedEpisodes,
    markEpisodesWatched,
    isEpisodePromptSkipped,
    skipEpisodePromptsFor,
  };
}
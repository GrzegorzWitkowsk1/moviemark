import { useSyncExternalStore } from "react";

const STORAGE_KEY = "moviemark.skipEpisodePrompt";

function load(): Record<number, true> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<number, true> = {};
    Object.keys(parsed).forEach((key) => {
      const num = Number(key);
      if (Number.isFinite(num) && parsed[key] === true) {
        result[num] = true;
      }
    });
    return result;
  } catch {
    return {};
  }
}

let store: Record<number, true> = load();

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: Record<number, true>) {
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

export function getSnapshot(): Record<number, true> {
  return store;
}

export function isPromptSkipped(tvId: number): boolean {
  return !!store[tvId];
}

export function skipPromptsFor(tvId: number): void {
  persist({ ...store, [tvId]: true });
}

interface WatchedPromptApi {
  isPromptSkipped: typeof isPromptSkipped;
  skipPromptsFor: typeof skipPromptsFor;
}

export function useWatchedPrompt(): WatchedPromptApi {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    isPromptSkipped,
    skipPromptsFor,
  };
}
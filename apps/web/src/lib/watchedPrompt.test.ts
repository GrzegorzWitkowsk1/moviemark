import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const STORAGE_KEY = "moviemark.skipEpisodePrompt";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe("watchedPrompt store", () => {
  it("is empty initially", async () => {
    const api = await import("./watchedPrompt");
    expect(api.isPromptSkipped(5)).toBe(false);
    expect(api.getSnapshot()).toEqual({});
  });

  it("skips prompts for a tv id", async () => {
    const api = await import("./watchedPrompt");
    api.skipPromptsFor(5);
    expect(api.isPromptSkipped(5)).toBe(true);
    expect(api.getSnapshot()).toEqual({ 5: true });
  });

  it("persists to localStorage", async () => {
    const api = await import("./watchedPrompt");
    api.skipPromptsFor(7);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      7: true,
    });
  });

  it("ignores invalid persisted entries", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ 1: true, 2: "yes", three: true })
    );
    const api = await import("./watchedPrompt");
    expect(api.getSnapshot()).toEqual({ 1: true });
  });

  it("updates through the hook when prompts are skipped", async () => {
    const api = await import("./watchedPrompt");
    const { result } = renderHook(() => api.useWatchedPrompt());

    expect(result.current.isPromptSkipped(3)).toBe(false);
    act(() => {
      result.current.skipPromptsFor(3);
    });
    expect(result.current.isPromptSkipped(3)).toBe(true);
  });
});
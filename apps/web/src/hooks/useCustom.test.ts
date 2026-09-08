import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useCreateCustomItem, useCustomItem } from "./useCustom";
import { renderHookWithProviders } from "@/test/utils";

const api = vi.hoisted(() => ({
  createCustomMovie: vi.fn(),
  createCustomSeries: vi.fn(),
  getCustomItem: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

beforeEach(() => {
  api.createCustomMovie.mockReset();
  api.createCustomSeries.mockReset();
  api.getCustomItem.mockReset();
});

describe("useCustomItem", () => {
  it("fetches custom items with a negative (custom) id", async () => {
    const item = { id: -1, title: "My Movie", watched: false };
    api.getCustomItem.mockResolvedValue(item);

    const { result } = renderHookWithProviders(() =>
      useCustomItem(-1, "movie")
    );
    await waitFor(() => expect(result.current.data).toEqual(item));
    expect(api.getCustomItem).toHaveBeenCalledWith(-1, "movie");
  });

  it("never fetches for positive (tmdb) ids", async () => {
    const { result } = renderHookWithProviders(() =>
      useCustomItem(123, "movie")
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.getCustomItem).not.toHaveBeenCalled();
  });
});

describe("useCreateCustomItem", () => {
  it("creates a custom movie", async () => {
    const created = { id: -1, mediaType: "movie", customId: -1 };
    api.createCustomMovie.mockResolvedValue(created);

    const { result } = renderHookWithProviders(() => useCreateCustomItem());

    await act(async () => {
      await result.current.mutateAsync({
        mediaType: "movie",
        data: {
          name: "My Movie",
          genreIds: [28],
          year: "2020",
          runtimeMinutes: 100,
        },
      });
    });

    expect(api.createCustomMovie).toHaveBeenCalledWith({
      name: "My Movie",
      genreIds: [28],
      year: "2020",
      runtimeMinutes: 100,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("creates a custom series through the series endpoint", async () => {
    const created = { id: -1, mediaType: "tv", customId: -1 };
    api.createCustomSeries.mockResolvedValue(created);

    const { result } = renderHookWithProviders(() => useCreateCustomItem());

    await act(async () => {
      await result.current.mutateAsync({
        mediaType: "tv",
        data: { name: "My Series", seasons: [] },
      });
    });

    expect(api.createCustomSeries).toHaveBeenCalledWith({
      name: "My Series",
      seasons: [],
    });
  });
});
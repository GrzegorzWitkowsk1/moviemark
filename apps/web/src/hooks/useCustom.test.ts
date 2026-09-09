import { describe, expect, it } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { useCreateCustomItem, useCustomItem } from "./useCustom";
import { renderHookWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

describe("useCustomItem", () => {
  it("fetches custom items with a negative (custom) id", async () => {
    const item = { id: -1, title: "My Movie", watched: false };
    let capturedUrl = "";
    server.use(
      http.get(`${API}/custom/:id`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(item);
      })
    );

    const { result } = renderHookWithProviders(() =>
      useCustomItem(-1, "movie")
    );
    await waitFor(() => expect(result.current.data).toEqual(item));
    expect(capturedUrl).toContain("/custom/-1?type=movie");
  });

  it("never fetches for positive (tmdb) ids", async () => {
    const { result } = renderHookWithProviders(() =>
      useCustomItem(123, "movie")
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

describe("useCreateCustomItem", () => {
  it("creates a custom movie", async () => {
    const created = { id: -1, mediaType: "movie" as const, customId: -1 };
    let lastBody: unknown;
    server.use(
      http.post(`${API}/custom/movie`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(created);
      })
    );

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

    expect(lastBody).toEqual({
      name: "My Movie",
      genreIds: [28],
      year: "2020",
      runtimeMinutes: 100,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("creates a custom series through the series endpoint", async () => {
    const created = { id: -1, mediaType: "tv" as const, customId: -1 };
    let lastBody: unknown;
    server.use(
      http.post(`${API}/custom/series`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(created);
      })
    );

    const { result } = renderHookWithProviders(() => useCreateCustomItem());

    await act(async () => {
      await result.current.mutateAsync({
        mediaType: "tv",
        data: { name: "My Series", seasons: [] },
      });
    });

    expect(lastBody).toEqual({
      name: "My Series",
      seasons: [],
    });
  });
});

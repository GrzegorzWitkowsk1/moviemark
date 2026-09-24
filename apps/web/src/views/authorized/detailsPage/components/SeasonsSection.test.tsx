import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { TmdbEpisode, TmdbSeasonSummary } from "shared";
import SeasonsSection from "./SeasonsSection";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";
import { useSeriesWatchedControls } from "@/hooks/useCollection";
import { TMDB_BASE } from "@/test/handlers/tmdbHandlers";

const API = "http://localhost:3000";
const TV_ID = 1396;

const seasonSummary: TmdbSeasonSummary = {
  id: 999,
  name: "Season 1",
  overview: null,
  air_date: null,
  poster_path: null,
  season_number: 1,
  episode_count: 3,
};

const seasonEpisodes: TmdbEpisode[] = [1, 2, 3].map((n) => ({
  id: 1000 + n,
  name: n === 1 ? "Pilot" : `Episode ${n}`,
  overview: "",
  air_date: null,
  episode_number: n,
  season_number: 1,
  runtime: 45,
  still_path: null,
  vote_average: 8,
}));

const fullWatched = {
  watched: true,
  watchedCount: 3,
  totalEpisodes: 62,
  watchedEpisodes: [
    { season: 1, episode: 1 },
    { season: 1, episode: 2 },
    { season: 1, episode: 3 },
  ],
};

function Harness({
  tvId,
  seasons,
}: {
  tvId: number;
  seasons: TmdbSeasonSummary[];
}) {
  const watched = useSeriesWatchedControls(tvId, {
    name: "Breaking Bad",
    posterPath: null,
    totalEpisodes: 62,
  });
  return <SeasonsSection tvId={tvId} seasons={seasons} watched={watched} />;
}

describe("SeasonsSection season checkbox", () => {
  it("marks the whole season as watched without expanding the accordion", async () => {
    let lastPayload: unknown;
    let persisted = SeriesStatus(() => false);
    server.use(
      http.get(`${API}/collection/series/${TV_ID}`, () =>
        HttpResponse.json(persisted())
      ),
      http.put(`${API}/collection/series/episode`, async ({ request }) => {
        lastPayload = await request.json();
        persisted = SeriesStatus(() => true);
        return HttpResponse.json(persisted());
      })
    );
    const userEventCtx = userEvent.setup();

    const { container } = renderWithProviders(
      <Harness tvId={TV_ID} seasons={[seasonSummary]} />
    );

    const checkbox = await screen.findByLabelText("Mark whole season as watched");
    await userEventCtx.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText("3/3")).toBeTruthy();
    });
    expect(lastPayload).toEqual(
      expect.objectContaining({
        tmdbId: TV_ID,
        season: 1,
        episodes: [1, 2, 3],
      })
    );

    const summary = container.querySelector('[aria-expanded="true"]');
    expect(summary).not.toBeNull();
  });

  it("unchecks the whole season", async () => {
    let requestedUrl: string | null = null;
    let persisted = () => fullWatched;
    server.use(
      http.get(`${API}/collection/series/${TV_ID}`, () =>
        HttpResponse.json(persisted())
      ),
      http.delete(
        `${API}/collection/series/${TV_ID}/season`,
        ({ request }) => {
          requestedUrl = request.url;
          persisted = () => ({
            watched: false,
            watchedCount: 0,
            totalEpisodes: 0,
            watchedEpisodes: [],
          });
          return HttpResponse.json(persisted());
        }
      )
    );
    const userEventCtx = userEvent.setup();

    renderWithProviders(<Harness tvId={TV_ID} seasons={[seasonSummary]} />);

    const checkbox = await screen.findByLabelText("Mark whole season as watched");
    await waitFor(() => expect(checkbox).toBeChecked());
    await userEventCtx.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText("0/3")).toBeTruthy();
    });
    expect(requestedUrl).toContain("?season=1");
  });

  it("uses the loaded episodes list when the season is expanded", async () => {
    server.use(
      http.get(`${TMDB_BASE}/tv/${TV_ID}/season/1`, () =>
        HttpResponse.json({
          id: 999,
          name: "Season 1",
          overview: null,
          air_date: null,
          episodes: seasonEpisodes,
        })
      )
    );
    let lastPayload: unknown;
    let persisted = SeriesStatus(() => false);
    server.use(
      http.get(`${API}/collection/series/${TV_ID}`, () =>
        HttpResponse.json(persisted())
      ),
      http.put(`${API}/collection/series/episode`, async ({ request }) => {
        lastPayload = await request.json();
        persisted = SeriesStatus(() => true);
        return HttpResponse.json(persisted());
      })
    );
    const userEventCtx = userEvent.setup();

    renderWithProviders(<Harness tvId={TV_ID} seasons={[seasonSummary]} />);

    await screen.findByText("Pilot");

    const checkbox = await screen.findByLabelText("Mark whole season as watched");
    await userEventCtx.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText("3/3")).toBeTruthy();
    });
    expect(lastPayload).toEqual(
      expect.objectContaining({ season: 1, episodes: [1, 2, 3] })
    );
  });
});

function SeriesStatus(watched: () => boolean) {
  return () =>
    watched()
      ? fullWatched
      : {
          watched: false,
          watchedCount: 0,
          totalEpisodes: 62,
          watchedEpisodes: [],
        };
}
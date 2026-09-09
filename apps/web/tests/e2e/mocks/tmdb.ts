import type { Page } from "@playwright/test";

const MOCK_MOVIE = {
  id: 550,
  title: "Fight Club",
  overview: "A ticking time-bomb insomniac and a slippery soap salesman.",
  poster_path: "/pB8BM7pdSp6B6Ih7QI4S2t0POoT.jpg",
  backdrop_path: "/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg",
  release_date: "1999-10-15",
  vote_average: 8.4,
  vote_count: 28000,
  genre_ids: [18, 53],
  media_type: "movie" as const,
};

const MOCK_TV = {
  id: 1396,
  name: "Breaking Bad",
  overview: "A high school chemistry teacher turned methamphetamine manufacturer.",
  poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
  backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
  first_air_date: "2008-01-20",
  vote_average: 8.9,
  vote_count: 14000,
  genre_ids: [18, 80],
  media_type: "tv" as const,
};

const MOCK_MOVIE_DETAILS = {
  ...MOCK_MOVIE,
  runtime: 139,
  genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
};

const MOCK_TV_DETAILS = {
  ...MOCK_TV,
  number_of_seasons: 5,
  seasons: [
    { season_number: 1, name: "Season 1", episode_count: 7 },
    { season_number: 2, name: "Season 2", episode_count: 13 },
  ],
  genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
};

const MOCK_TV_SEASON = {
  season_number: 1,
  episodes: [
    { episode_number: 1, name: "Pilot" },
    { episode_number: 2, name: "Cats in the Bag..." },
  ],
};

export async function mockTmdb(page: Page) {
  await page.route("**/tmdb/search/multi**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [MOCK_MOVIE, MOCK_TV] }),
    }),
  );

  await page.route("**/tmdb/movie/550**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_MOVIE_DETAILS),
    }),
  );

  await page.route("**/tmdb/movie/550/similar**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [] }),
    }),
  );

  await page.route("**/tmdb/tv/1396**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_TV_DETAILS),
    }),
  );

  await page.route("**/tmdb/tv/1396/similar**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [] }),
    }),
  );

  await page.route("**/tmdb/tv/1396/season/1**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_TV_SEASON),
    }),
  );

  await page.route("**/tmdb/movie/now_playing**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [MOCK_MOVIE] }),
    }),
  );

  await page.route("**/tmdb/movie/upcoming**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [MOCK_MOVIE] }),
    }),
  );

  await page.route("**/tmdb/tv/on_the_air**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [MOCK_TV] }),
    }),
  );

  await page.route("**/tmdb/trending/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [MOCK_MOVIE, MOCK_TV] }),
    }),
  );

  await page.route("**/tmdb/genre/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        genres: [
          { id: 18, name: "Drama" },
          { id: 53, name: "Thriller" },
          { id: 80, name: "Crime" },
          { id: 28, name: "Action" },
        ],
      }),
    }),
  );
}

export { MOCK_MOVIE, MOCK_TV, MOCK_MOVIE_DETAILS };

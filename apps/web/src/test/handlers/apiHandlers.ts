import { HttpResponse, http } from "msw";

export const TEST_USER = {
  id: "1",
  name: "Anna",
  surname: "Kowalska",
  email: "anna@test.com",
};

const emptyCollection = { movies: [], series: [] };
const emptyFuture = { movies: [], series: [] };

function movieStatus(watched = false) {
  return { watched };
}

function seriesStatus(watched = false) {
  return {
    watched,
    watchedCount: 0,
    totalEpisodes: 12,
    watchedEpisodes: [],
  };
}

function futureStatus(wanted = false) {
  return { wanted };
}

export const apiHandlers = [
  http.post("http://localhost:3000/auth/register", () =>
    HttpResponse.json({ message: "Registration successful" }, { status: 201 })
  ),
  http.post("http://localhost:3000/auth/login", async ({ request }) => {
    const body = (await request.json()) as { remember?: boolean };
    return HttpResponse.json({
      user: TEST_USER,
      accessToken: "token-abc",
      remember: body.remember ?? false,
    });
  }),
  http.post("http://localhost:3000/auth/logout", () =>
    HttpResponse.json({ message: "Logged out" })
  ),
  http.get("http://localhost:3000/auth/me", () =>
    HttpResponse.json(TEST_USER)
  ),
  http.put("http://localhost:3000/auth/profile", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      surname: string;
      email: string;
    };
    return HttpResponse.json({
      user: { ...TEST_USER, ...body },
      accessToken: "new-token",
    });
  }),
  http.put("http://localhost:3000/auth/password", () =>
    HttpResponse.json({ message: "changed" })
  ),
  http.post("http://localhost:3000/auth/refresh", () =>
    HttpResponse.json({ accessToken: "new-token" })
  ),

  http.get("http://localhost:3000/collection", () =>
    HttpResponse.json(emptyCollection)
  ),
  http.get("http://localhost:3000/collection/movie/:tmdbId", () =>
    HttpResponse.json(movieStatus(false))
  ),
  http.post("http://localhost:3000/collection/movie", () =>
    HttpResponse.json(movieStatus(true))
  ),
  http.delete("http://localhost:3000/collection/movie/:tmdbId", () =>
    HttpResponse.json(movieStatus(false))
  ),
  http.get("http://localhost:3000/collection/series/:tmdbId", () =>
    HttpResponse.json(seriesStatus(false))
  ),
  http.put("http://localhost:3000/collection/series/episode", () =>
    HttpResponse.json(seriesStatus(true))
  ),
  http.delete(
    "http://localhost:3000/collection/series/:tmdbId/episode",
    () => HttpResponse.json(seriesStatus(false))
  ),

  http.post("http://localhost:3000/custom/movie", () =>
    HttpResponse.json({
      customId: -1,
      mediaType: "movie",
      name: "My Movie",
      genreIds: [],
      year: null,
      runtimeMinutes: null,
      watchedAt: new Date().toISOString(),
    })
  ),
  http.post("http://localhost:3000/custom/series", () =>
    HttpResponse.json({
      customId: -1,
      mediaType: "tv",
      name: "My Series",
      genreIds: [],
      year: null,
      seasons: [],
      totalEpisodes: 0,
      watchedAt: new Date().toISOString(),
    })
  ),
  http.get("http://localhost:3000/custom/:id", () =>
    HttpResponse.json({
      customId: -1,
      mediaType: "movie",
      name: "My Movie",
      genreIds: [],
      year: "2024",
      runtimeMinutes: 120,
      watchedAt: "2026-01-01T00:00:00Z",
    })
  ),

  http.get("http://localhost:3000/future", () =>
    HttpResponse.json(emptyFuture)
  ),
  http.get("http://localhost:3000/future/movie/:tmdbId", () =>
    HttpResponse.json(futureStatus(false))
  ),
  http.post("http://localhost:3000/future/movie", () =>
    HttpResponse.json(futureStatus(true))
  ),
  http.delete("http://localhost:3000/future/movie/:tmdbId", () =>
    HttpResponse.json(futureStatus(false))
  ),
  http.get("http://localhost:3000/future/series/:tmdbId", () =>
    HttpResponse.json(futureStatus(false))
  ),
  http.post("http://localhost:3000/future/series", () =>
    HttpResponse.json(futureStatus(true))
  ),
  http.delete("http://localhost:3000/future/series/:tmdbId", () =>
    HttpResponse.json(futureStatus(false))
  ),
];

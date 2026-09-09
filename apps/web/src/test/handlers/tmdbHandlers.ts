import { HttpResponse, http } from "msw";

export const TMDB_BASE = "https://api.themoviedb.org/3";

const movieGenres: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 878, name: "Science Fiction" },
];

const tvGenres: { id: number; name: string }[] = [
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 18, name: "Drama" },
];

function listResponse<T>(results: T[] = []) {
  return {
    page: 1,
    results,
    total_pages: results.length === 0 ? 0 : 1,
    total_results: results.length,
  };
}

export const tmdbHandlers = [
  http.get(`${TMDB_BASE}/movie/now_playing`, () =>
    HttpResponse.json(listResponse())
  ),
  http.get(`${TMDB_BASE}/tv/on_the_air`, () =>
    HttpResponse.json(listResponse())
  ),
  http.get(`${TMDB_BASE}/movie/upcoming`, () =>
    HttpResponse.json(listResponse())
  ),
  http.get(`${TMDB_BASE}/trending/:mediaType/:timeWindow`, () =>
    HttpResponse.json(listResponse())
  ),
  http.get(`${TMDB_BASE}/genre/:mediaType/list`, ({ params }) => {
    const mediaType = params.mediaType as "movie" | "tv";
    return HttpResponse.json({
      genres: mediaType === "movie" ? movieGenres : tvGenres,
    });
  }),
  http.get(`${TMDB_BASE}/movie/:id/similar`, () =>
    HttpResponse.json(listResponse())
  ),
  http.get(`${TMDB_BASE}/tv/:id/similar`, () =>
    HttpResponse.json(listResponse())
  ),
  http.get(`${TMDB_BASE}/search/multi`, () =>
    HttpResponse.json(listResponse())
  ),
  http.get(`${TMDB_BASE}/tv/:id/season/:seasonNumber`, () =>
    HttpResponse.json({
      id: 1396,
      name: "Season 1",
      season_number: 1,
      overview: null,
      air_date: null,
      episodes: [],
    })
  ),
  http.get(`${TMDB_BASE}/movie/:id`, () =>
    HttpResponse.json({
      adult: false,
      backdrop_path: null,
      genre_ids: [28],
      genres: movieGenres,
      id: 550,
      original_language: "en",
      original_title: "Fight Club",
      overview: "A nameless narrator.",
      popularity: 75,
      poster_path: "/fc.jpg",
      release_date: "1999-10-15",
      runtime: 139,
      tagline: null,
      status: "Released",
      title: "Fight Club",
      video: false,
      vote_average: 8.4,
      vote_count: 23000,
    })
  ),
  http.get(`${TMDB_BASE}/tv/:id`, () =>
    HttpResponse.json({
      adult: false,
      backdrop_path: null,
      first_air_date: "2008-01-20",
      genre_ids: [18],
      id: 1396,
      name: "Breaking Bad",
      origin_country: ["US"],
      original_language: "en",
      original_name: "Breaking Bad",
      overview: "Chemistry",
      popularity: 20,
      poster_path: "/bb.jpg",
      vote_average: 9.5,
      vote_count: 100,
      genres: tvGenres,
      status: "Ended",
      number_of_episodes: 62,
      number_of_seasons: 5,
      episode_run_time: [45],
      seasons: [],
    })
  ),
];

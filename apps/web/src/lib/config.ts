export const config = {
  apiBase: import.meta.env.VITE_API_BASE ?? "http://localhost:3000",
  tmdbApiBase: "https://api.themoviedb.org/3",
  tmdbToken: import.meta.env.VITE_TMDB_TOKEN,
};

export interface MessageType {
  _id?: string;
  text: string;
  createdAt?: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface RegisterErrorResponse {
  error: string;
}

export interface UserResponse {
  id: string;
  name: string;
  surname: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface AuthErrorResponse {
  error: string;
}

export type TmdbMediaType = "movie" | "tv";

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TmdbTv {
  adult: boolean;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  id: number;
  name: string;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TmdbListResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface GenreListResponse {
  genres: TmdbGenre[];
}

export interface HomeSection {
  movies: TmdbMovie[];
  series: TmdbTv[];
}

export interface HomeContent {
  new: HomeSection;
  upcoming: {
    movies: TmdbMovie[];
  };
  trending: HomeSection;
}

export interface TmdbMovieDetails extends TmdbMovie {
  genres: TmdbGenre[];
  runtime: number;
  tagline: string | null;
  status: string;
}

export interface TmdbSeasonSummary {
  id: number;
  name: string;
  overview: string | null;
  air_date: string | null;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
}

export interface TmdbTvDetails extends TmdbTv {
  genres: TmdbGenre[];
  status: string;
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  seasons: TmdbSeasonSummary[];
}

export interface TmdbEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
}

export interface TmdbSeasonDetails {
  id: number;
  name: string;
  overview: string | null;
  air_date: string | null;
  episodes: TmdbEpisode[];
}

export interface WatchedEpisode {
  season: number;
  episode: number;
}

export interface WatchedMovieResponse {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  watchedAt: string;
}

export interface WatchedSeriesResponse {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  totalEpisodes: number;
  watchedCount: number;
  watchedEpisodes: WatchedEpisode[];
  watchedAt: string;
}

export interface CollectionResponse {
  movies: WatchedMovieResponse[];
  series: WatchedSeriesResponse[];
}

export interface AddMovieRequest {
  tmdbId: number;
  title: string;
  posterPath: string | null;
}

export interface MarkEpisodesRequest {
  tmdbId: number;
  season: number;
  episodes: number[];
  name: string;
  posterPath: string | null;
  totalEpisodes: number;
}

export interface MovieStatusResponse {
  watched: boolean;
}

export interface SeriesStatusResponse {
  watched: boolean;
  watchedCount: number;
  totalEpisodes: number;
  watchedEpisodes: WatchedEpisode[];
}

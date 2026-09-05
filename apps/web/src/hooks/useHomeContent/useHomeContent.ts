import { useQuery } from "@tanstack/react-query";
import { getHomeContent } from "@/lib/tmdb";
import type { HomeContent } from "shared";

const HOME_CONTENT_KEY = ["homeContent"] as const;

export function useHomeContent() {
  return useQuery({
    queryKey: HOME_CONTENT_KEY,
    queryFn: getHomeContent,
  });
}

const selectNew = (data: HomeContent) => data.new;
const selectTrending = (data: HomeContent) => data.trending;
const selectUpcoming = (data: HomeContent) => data.upcoming.movies;

export function useNewContent() {
  return useQuery({
    queryKey: HOME_CONTENT_KEY,
    queryFn: getHomeContent,
    select: selectNew,
  });
}

export function useTrendingContent() {
  return useQuery({
    queryKey: HOME_CONTENT_KEY,
    queryFn: getHomeContent,
    select: selectTrending,
  });
}

export function useUpcomingMovies() {
  return useQuery({
    queryKey: HOME_CONTENT_KEY,
    queryFn: getHomeContent,
    select: selectUpcoming,
  });
}
import { useQuery } from "@tanstack/react-query";
import { getHomeContent, tmdbLanguage } from "@/lib/tmdb";
import type { HomeContent } from "shared";

const homeContentKey = () => ["homeContent", tmdbLanguage()] as const;

export function useHomeContent() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
  });
}

const selectNew = (data: HomeContent) => data.new;
const selectTrending = (data: HomeContent) => data.trending;
const selectUpcoming = (data: HomeContent) => data.upcoming.movies;

export function useNewContent() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
    select: selectNew,
  });
}

export function useTrendingContent() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
    select: selectTrending,
  });
}

export function useUpcomingMovies() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
    select: selectUpcoming,
  });
}
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Image,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  List,
  Text,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useRoute, type RouteProp } from "@react-navigation/native";
import type { TmdbMediaType } from "shared";
import {
  getPosterUrl,
  useAddMovie,
  useCustomItem,
  useFutureMovieControls,
  useFutureSeriesControls,
  useMovieDetails,
  useMovieWatched,
  useRemoveFutureMovie,
  useRemoveFutureSeries,
  useRemoveMovie,
  useResolveGenres,
  useSeriesFutureStatus,
  useSeriesWatched,
  useSeriesWatchedControls,
  useSimilarMovies,
  useSimilarTv,
  useTvDetails,
  useTvSeason,
  type SeriesWatchedControls,
} from "core";
import { Screen } from "@/components/Screen";
import Loading from "@/components/Loading";
import { FutureToggleButton } from "@/components/FutureToggleButton";
import { CarouselSection } from "@/components/CarouselSection";
import { movieToItem, tvToItem } from "@/utils/media";
import type { RootStackParamList } from "@/navigation/types";

export default function DetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Details">>();
  const { id, mediaType } = route.params;

  if (!Number.isFinite(id) || id === 0) {
    return <MissingId />;
  }

  if (id < 0) {
    return <CustomView id={id} mediaType={mediaType} />;
  }

  return mediaType === "tv" ? <TvView id={id} /> : <MovieView id={id} />;
}

function MissingId() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false} style={styles.centered}>
      <Text variant="bodyLarge">{t("details.missingId")}</Text>
    </Screen>
  );
}

function ErrorState({
  onRetry,
  isRetrying,
  short,
}: {
  onRetry: () => void;
  isRetrying?: boolean;
  short?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.centered}>
      <Text variant="bodyMedium" style={styles.errorText}>
        {short ? t("details.loadErrorShort") : t("details.loadError")}
      </Text>
      <Button mode="contained" onPress={onRetry} disabled={isRetrying}>
        {isRetrying ? t("common.loading") : t("common.tryAgain")}
      </Button>
    </View>
  );
}

interface HeroHeaderProps {
  posterPath: string | null;
  title: string;
  meta: string;
  overview: string;
  actions?: ReactNode;
}

function HeroHeader({
  posterPath,
  title,
  meta,
  overview,
  actions,
}: HeroHeaderProps) {
  const posterUrl = getPosterUrl(posterPath);
  return (
    <View style={styles.hero}>
      <View style={styles.heroRow}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.heroInfo}>
          <Text variant="titleLarge" style={styles.heroTitle}>
            {title}
          </Text>
          {meta ? (
            <Text variant="bodySmall" style={styles.heroMeta}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
      {overview ? (
        <Text variant="bodyMedium" style={styles.overview}>
          {overview}
        </Text>
      ) : null}
      {actions ? <View style={styles.actionsRow}>{actions}</View> : null}
    </View>
  );
}

function MovieView({ id }: { id: number }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, isRefetching, refetch } =
    useMovieDetails(id);
  const { data: similar } = useSimilarMovies(id);
  const { data: watchedStatus } = useMovieWatched(id);
  const addMovie = useAddMovie();
  const removeMovie = useRemoveMovie();
  const futureControls = useFutureMovieControls(id, {
    title: data?.title ?? "",
    posterPath: data?.poster_path ?? null,
    rating: data?.vote_average,
  });
  const removeFuture = useRemoveFutureMovie();

  if (isError) {
    return (
      <ErrorState onRetry={() => refetch()} isRetrying={isRefetching} />
    );
  }
  if (isLoading || !data) {
    return <Loading />;
  }

  const isWatched = watchedStatus?.watched ?? false;
  const pending = addMovie.isPending || removeMovie.isPending;

  const handleToggleWatched = () => {
    if (isWatched) {
      removeMovie.mutate(data.id);
    } else {
      addMovie.mutate(
        {
          tmdbId: data.id,
          title: data.title,
          posterPath: data.poster_path,
          rating: data.vote_average,
        },
        {
          onSuccess: () => {
            if (futureControls.wanted) {
              removeFuture.mutate(data.id);
            }
          },
        }
      );
    }
  };

  const meta = [
    data.vote_average ? data.vote_average.toFixed(1) : null,
    data.release_date || t("details.unknown"),
    data.runtime
      ? t("details.movieRuntime", { minutes: data.runtime })
      : "-",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Screen>
      <HeroHeader
        posterPath={data.poster_path}
        title={data.title}
        meta={meta}
        overview={data.overview}
        actions={
          <>
            <Button
              mode="contained"
              loading={pending}
              disabled={pending}
              onPress={handleToggleWatched}
            >
              {isWatched ? t("details.watched") : t("details.addToWatched")}
            </Button>
            <FutureToggleButton controls={futureControls} disabled={isWatched} />
          </>
        }
      />
      <CarouselSection
        title={t("details.youMayAlsoLike")}
        movies={(similar?.results ?? []).map(movieToItem)}
      />
    </Screen>
  );
}

function TvView({ id }: { id: number }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, isRefetching, refetch } = useTvDetails(id);
  const { data: similar } = useSimilarTv(id);
  const { data: watchedStatus } = useSeriesWatched(id);
  const { data: futureStatus } = useSeriesFutureStatus(id);
  const watched = useSeriesWatchedControls(id, {
    name: data?.name ?? "",
    posterPath: data?.poster_path ?? null,
    totalEpisodes: data?.number_of_episodes ?? 0,
    rating: data?.vote_average,
  });
  const futureControls = useFutureSeriesControls(id, {
    name: data?.name ?? "",
    posterPath: data?.poster_path ?? null,
    rating: data?.vote_average,
  });
  const removeFutureSeries = useRemoveFutureSeries();

  const totalEpisodes = data?.number_of_episodes ?? 0;
  const watchedCount = watchedStatus?.watchedCount ?? 0;
  const fullyWatched = totalEpisodes > 0 && watchedCount >= totalEpisodes;
  const futureWanted = futureStatus?.wanted ?? false;
  const prevFullyWatched = useRef(fullyWatched);

  useEffect(() => {
    if (fullyWatched && !prevFullyWatched.current && futureWanted) {
      removeFutureSeries.mutate(id);
    }
    prevFullyWatched.current = fullyWatched;
  }, [fullyWatched, futureWanted, id, removeFutureSeries]);

  if (isError) {
    return (
      <ErrorState onRetry={() => refetch()} isRetrying={isRefetching} />
    );
  }
  if (isLoading || !data) {
    return <Loading />;
  }

  const episodeMinutes = data.episode_run_time[0];
  const meta = [
    data.vote_average ? data.vote_average.toFixed(1) : null,
    data.first_air_date || t("details.unknown"),
    episodeMinutes
      ? t("details.minPerEpisode", { minutes: episodeMinutes })
      : t("details.unknown"),
  ]
    .filter(Boolean)
    .join(" • ");

  const seasons = data.seasons.filter((season) => season.season_number > 0);

  return (
    <Screen>
      <HeroHeader
        posterPath={data.poster_path}
        title={data.name}
        meta={meta}
        overview={data.overview}
        actions={<FutureToggleButton controls={futureControls} />}
      />

      <View style={styles.seasons}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {t("details.seasons")}
        </Text>
        {seasons.map((season) => (
          <SeasonAccordion
            key={season.season_number}
            tvId={id}
            seasonNumber={season.season_number}
            episodeCount={season.episode_count}
            watched={watched}
          />
        ))}
      </View>

      <CarouselSection
        title={t("details.youMayAlsoLike")}
        movies={[]}
        series={(similar?.results ?? []).map(tvToItem)}
      />
    </Screen>
  );
}

interface SeasonAccordionProps {
  tvId: number;
  seasonNumber: number;
  episodeCount: number;
  watched: SeriesWatchedControls;
}

function SeasonAccordion({
  tvId,
  seasonNumber,
  episodeCount,
  watched,
}: SeasonAccordionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useTvSeason(tvId, seasonNumber, {
    enabled: expanded,
  });

  const episodes = data?.episodes ?? [];
  const watchedCount = watched.countWatchedEpisodes(seasonNumber);

  const markAll = () => {
    watched
      .markEpisodesWatched(
        seasonNumber,
        Array.from({ length: episodeCount }, (_, index) => index + 1)
      )
      .catch(() => {});
  };

  return (
    <List.Accordion
      title={t("common.seasonHeader", { number: seasonNumber })}
      description={t("collection.watchedProgress", {
        watched: watchedCount,
        total: episodeCount,
      })}
      expanded={expanded}
      onPress={() => setExpanded((prev) => !prev)}
      style={styles.accordion}
    >
      <View style={styles.accordionBody}>
        <Button
          mode="outlined"
          compact
          onPress={markAll}
          disabled={watched.isEpisodePending}
        >
          {t("details.addToWatched")}
        </Button>
        {isLoading ? (
          <ActivityIndicator style={styles.episodeLoader} />
        ) : (
          episodes.map((episode) => {
            const isWatched = watched.isEpisodeWatched(
              seasonNumber,
              episode.episode_number
            );
            return (
              <List.Item
                key={episode.id}
                title={
                  episode.name ||
                  t("details.episodeName", { number: episode.episode_number })
                }
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={
                      isWatched
                        ? "check-circle"
                        : "checkbox-blank-circle-outline"
                    }
                  />
                )}
                onPress={() => {
                  if (isWatched) {
                    watched
                      .unmarkEpisode(seasonNumber, episode.episode_number)
                      .catch(() => {});
                  } else {
                    watched
                      .markEpisodesWatched(seasonNumber, [
                        episode.episode_number,
                      ])
                      .catch(() => {});
                  }
                }}
              />
            );
          })
        )}
      </View>
    </List.Accordion>
  );
}

function CustomView({
  id,
  mediaType,
}: {
  id: number;
  mediaType: TmdbMediaType;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError, isRefetching, refetch } = useCustomItem(
    id,
    mediaType
  );
  const genreList = useResolveGenres(mediaType, data?.genreIds ?? []);
  const isMovie = data?.mediaType === "movie";
  const { data: movieStatus } = useMovieWatched(isMovie ? id : NaN);
  const addMovie = useAddMovie();
  const removeMovie = useRemoveMovie();
  const totalEpisodes =
    data?.mediaType === "tv"
      ? data.seasons.reduce((sum, season) => sum + season.episodes.length, 0)
      : 0;
  const watched = useSeriesWatchedControls(id, {
    name: data?.name ?? "",
    posterPath: null,
    totalEpisodes,
  });

  if (isError) {
    return (
      <ErrorState
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        short
      />
    );
  }
  if (isLoading || !data) {
    return <Loading />;
  }

  const metaParts: string[] = [];
  if (data.year) {
    metaParts.push(data.year);
  }
  if (genreList.length > 0) {
    metaParts.push(genreList.join(", "));
  }
  if (data.mediaType === "movie" && data.runtimeMinutes) {
    metaParts.push(
      t("details.movieRuntime", { minutes: data.runtimeMinutes })
    );
  }

  const movieWatched = movieStatus?.watched ?? false;
  const moviePending = addMovie.isPending || removeMovie.isPending;

  const toggleMovie = () => {
    if (movieWatched) {
      removeMovie.mutate(id);
    } else {
      addMovie.mutate({ tmdbId: id, title: data.name, posterPath: null });
    }
  };

  return (
    <Screen>
      <HeroHeader
        posterPath={null}
        title={data.name}
        meta={metaParts.join(" • ")}
        overview={t("details.addedByYou")}
        actions={
          data.mediaType === "movie" ? (
            <Button
              mode="contained"
              loading={moviePending}
              disabled={moviePending}
              onPress={toggleMovie}
            >
              {movieWatched ? t("details.watched") : t("details.addToWatched")}
            </Button>
          ) : undefined
        }
      />

      {data.mediaType === "tv" && (
        <View style={styles.seasons}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {t("details.seasons")}
          </Text>
          {data.seasons.map((season) => (
            <View key={season.seasonNumber} style={styles.customSeason}>
              <Text variant="titleMedium">
                {t("common.seasonHeader", { number: season.seasonNumber })}
              </Text>
              {season.episodes.map((episode) => {
                const isWatched = watched.isEpisodeWatched(
                  season.seasonNumber,
                  episode.episode
                );
                return (
                  <List.Item
                    key={episode.episode}
                    title={
                      episode.name ||
                      t("addCustom.episodePrefix", { number: episode.episode })
                    }
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          isWatched
                            ? "check-circle"
                            : "checkbox-blank-circle-outline"
                        }
                      />
                    )}
                    onPress={() => {
                      if (isWatched) {
                        watched
                          .unmarkEpisode(season.seasonNumber, episode.episode)
                          .catch(() => {});
                      } else {
                        watched
                          .markEpisodesWatched(season.seasonNumber, [
                            episode.episode,
                          ])
                          .catch(() => {});
                      }
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 48,
  },
  errorText: {
    opacity: 0.7,
  },
  hero: {
    marginTop: 8,
    marginBottom: 24,
    gap: 16,
  },
  heroRow: {
    flexDirection: "row",
    gap: 16,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#1f1f1f",
  },
  posterFallback: {
    opacity: 0.4,
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontWeight: "700",
  },
  heroMeta: {
    opacity: 0.7,
  },
  overview: {
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  seasons: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  accordion: {
    borderRadius: 12,
  },
  accordionBody: {
    gap: 4,
    paddingBottom: 8,
  },
  episodeLoader: {
    marginVertical: 16,
  },
  customSeason: {
    gap: 4,
  },
});

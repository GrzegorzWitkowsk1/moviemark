import { useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  Typography,
  alpha,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Calendar, Clock, ChevronDown, Tag, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TmdbMediaType } from "shared";
import { useCustomItem } from "@/hooks/useCustom";
import {
  useResolveGenres,
} from "@/hooks/useHomeContent";
import {
  useAddMovie,
  useMovieWatched,
  useRemoveMovie,
  useSeriesWatchedControls,
} from "@/hooks/useCollection";
import ContainedButton from "@/shared/components/buttons/containedButton";
import DetailHero, { type HeroMetaItem } from "./DetailHero";

interface CustomDetailsViewProps {
  id: number;
  mediaType: TmdbMediaType;
}

export default function CustomDetailsView({
  id,
  mediaType,
}: CustomDetailsViewProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data, isLoading, isError, isRefetching, refetch } = useCustomItem(id, mediaType);
  const genreList = useResolveGenres(mediaType, data?.genreIds ?? []);
  const [expanded, setExpanded] = useState<number[]>([]);

  const isSeries = data?.mediaType === "tv";
  const totalEpisodes = isSeries
    ? (data as { seasons: { episodes: unknown[] }[] } | undefined)?.seasons.reduce(
        (sum, season) => sum + season.episodes.length,
        0
      ) ?? 0
    : 0;
  const watchedControls = useSeriesWatchedControls(id, {
    name: data?.name ?? "",
    posterPath: null,
    totalEpisodes,
  });

  const isMovie = mediaType === "movie";
  const { data: movieStatus } = useMovieWatched(isMovie ? id : NaN);
  const addMovie = useAddMovie();
  const removeMovie = useRemoveMovie();
  const movieWatched = movieStatus?.watched ?? false;
  const movieActionPending = addMovie.isPending || removeMovie.isPending;
  const handleToggleMovie = () => {
    if (!data) {
      return;
    }
    if (movieWatched) {
      removeMovie.mutate(id);
    } else {
      addMovie.mutate({
        tmdbId: id,
        title: data.name,
        posterPath: null,
      });
    }
  };

  if (isError) {
    return (
      <Box sx={{ py: 10, textAlign: "center" }}>
        <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
          {t("details.loadErrorShort")}
        </Typography>
        <ContainedButton onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? t("common.loading") : t("common.tryAgain")}
        </ContainedButton>
      </Box>
    );
  }
  if (isLoading || !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const meta: HeroMetaItem[] = [];
  if (data.year) {
    meta.push({
      icon: <Calendar size={18} style={{ color: alpha("#fff", 0.85) }} />,
      label: data.year,
    });
  }
  if (genreList.length > 0) {
    meta.push({
      icon: <Tag size={18} style={{ color: alpha("#fff", 0.85) }} />,
      label: genreList.join(", "),
    });
  }
  if (data.mediaType === "movie" && data.runtimeMinutes) {
    meta.push({
      icon: <Clock size={18} style={{ color: alpha("#fff", 0.85) }} />,
      label: t("details.movieRuntime", { minutes: data.runtimeMinutes }),
    });
  }

  const toggleSeason = (seasonNumber: number) => {
    setExpanded((current) =>
      current.includes(seasonNumber)
        ? current.filter((n) => n !== seasonNumber)
        : [...current, seasonNumber]
    );
  };

  const handleEpisodeToggle = (
    season: number,
    episode: number,
    watched: boolean
  ) => {
    if (watched) {
      watchedControls.unmarkEpisode(season, episode).catch(() => {});
    } else {
      watchedControls.markEpisodesWatched(season, [episode]).catch(() => {});
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <DetailHero
        backdropUrl={null}
        posterPath={null}
        title={data.name}
        meta={meta}
        overview={t("details.addedByYou")}
        action={
          data.mediaType === "movie" ? (
            <ContainedButton
              onClick={handleToggleMovie}
              disabled={movieActionPending}
              startIcon={movieWatched ? <Check size={16} /> : undefined}
            >
              {movieWatched ? t("details.watched") : t("details.addToWatched")}
            </ContainedButton>
          ) : undefined
        }
      />

      {data.mediaType === "tv" && (
        <Box sx={{ mb: 5 }}>
          <Typography
            sx={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: theme.palette.text.primary,
              letterSpacing: "-0.02em",
              mb: 2,
            }}
>
              {t("details.seasons")}
            </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {data.seasons.map((season) => {
              const isOpen = expanded.includes(season.seasonNumber);
              return (
                <Accordion
                  key={season.seasonNumber}
                  expanded={isOpen}
                  onChange={() => toggleSeason(season.seasonNumber)}
                  disableGutters
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    borderRadius: "14px",
                    "&::before": { display: "none" },
                    boxShadow: "none",
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ChevronDown
                        size={20}
                        style={{ color: theme.palette.text.secondary }}
                      />
                    }
                    sx={{ borderRadius: "14px", px: 2.5 }}
                  >
                    <Typography
                      sx={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {t("common.seasonHeader", { number: season.seasonNumber })}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                    {season.episodes.map((episode, index) => {
                      const isWatched = watchedControls.isEpisodeWatched(
                        season.seasonNumber,
                        episode.episode
                      );
                      return (
                        <Box key={episode.episode}>
                          {index > 0 && (
                            <Box
                              sx={{
                                height: 1,
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.12
                                ),
                              }}
                            />
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              py: 1.25,
                            }}
                          >
                            <Checkbox
                              checked={isWatched}
                              onChange={() =>
                                handleEpisodeToggle(
                                  season.seasonNumber,
                                  episode.episode,
                                  isWatched
                                )
                              }
                              color="primary"
                              sx={{ p: 0.5 }}
                            />
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                color: theme.palette.text.secondary,
                                width: 42,
                                flexShrink: 0,
                              }}
                            >
                              {episode.episode < 10
                                ? `0${episode.episode}`
                                : episode.episode}
                            </Typography>
                            <Typography
                              noWrap
                              sx={{
                                fontSize: "0.95rem",
                                color: isWatched
                                  ? theme.palette.text.secondary
                                  : theme.palette.text.primary,
                                minWidth: 0,
                              }}
                            >
                              {episode.name || t("addCustom.episodePrefix", { number: episode.episode })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

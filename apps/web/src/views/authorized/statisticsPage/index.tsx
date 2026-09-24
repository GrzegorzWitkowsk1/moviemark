import { useMemo } from "react";
import {
  Box,
  Card,
  CircularProgress,
  Grid,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { darken } from "@mui/material/styles";
import {
  CalendarDays,
  Clapperboard,
  Clock,
  Film,
  Trophy,
  Tv,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StatisticsResponse } from "shared";
import StyledCard from "@/shared/components/card";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";
import { useStatistics } from "@/hooks/useStatistics";
import { useGenres } from "@/hooks/useHomeContent";
import {
  GENRE_ICON_BY_ID,
  DEFAULT_GENRE_ICON,
} from "./genreIconsMap";
import type { GenreIcon } from "./genreIcons";
import { formatDuration } from "./format";

function StatCard({
  icon: Icon,
  value,
  description,
}: {
  icon: GenreIcon;
  value: number;
  description: string;
}) {
  const theme = useTheme();
  return (
    <StyledCard>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "12px",
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            color: theme.palette.primary.main,
          }}
        >
          <Icon size={20} />
        </Box>
        <Box>
          <Typography
            sx={{
              color: theme.palette.mode === 'dark' ? 'white' : 'black',
              fontSize: "1.5rem",
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              color: theme.palette.primary.main,
              fontSize: "0.8rem",
            }}
          >
            {description}
          </Typography>
        </Box>
      </Box>
    </StyledCard>
  );
}

function TitlesChartCard({
  watchedMovies,
  watchedSeries,
}: {
  watchedMovies: number;
  watchedSeries: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const movieColor = isDark ? theme.palette.primary.main : theme.palette.primary.light;
  const seriesColor = darken(movieColor, isDark ? 0.45 : 0.35);
  const max = Math.max(watchedMovies, watchedSeries, 1);
  const bars = [
    {
      label: t("common.movies"),
      count: watchedMovies,
      color: movieColor,
      icon: <Film size={14} />,
    },
    {
      label: t("common.series"),
      count: watchedSeries,
      color: seriesColor,
      icon: <Tv size={14} />,
    },
  ];

  return (
    <StyledCard sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography
        sx={{ color: theme.palette.mode === 'dark' ? 'white' : 'black', fontWeight: 700, fontSize: "1.05rem" }}
      >
        {t("statistics.charts.titles.title")}
      </Typography>
      <Typography
        sx={{ color: theme.palette.primary.light, fontSize: "0.8rem", mt: 0.25 }}
      >
        {t("statistics.charts.titles.subtitle")}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 8,
          mt: 2,
        }}
      >
        {bars.map((bar) => (
          <Box
            key={bar.label}
            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}
          >
            <Typography
              sx={{ color: theme.palette.text.primary, fontSize: "0.9rem", fontWeight: 600 }}
            >
              {bar.count}
            </Typography>
            <Box
              sx={{
                height: 160,
                width: 56,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <Box
                sx={{
                  height: `${
                    Math.max((bar.count / max) * 100, bar.count > 0 ? 8 : 0)
                  }%`,
                  minHeight: 4,
                  borderRadius: "8px 8px 4px 4px",
                  backgroundColor: bar.color,
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.primary.light }}>
              {bar.icon}
              <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                {bar.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
        {bars.slice(0, 2).map((bar) => (
          <Box key={bar.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "4px", backgroundColor: bar.color }} />
            <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
              {bar.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </StyledCard>
  );
}

function WatchtimeRow({
  icon: Icon,
  title,
  minutes,
  pct,
}: {
  icon: GenreIcon;
  title: string;
  minutes: number;
  pct: number;
}) {
  const theme = useTheme();
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "10px",
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              color: theme.palette.primary.main,
            }}
          >
            <Icon size={16} />
          </Box>
          <Typography sx={{ color: theme.palette.text.primary, fontSize: "0.9rem", fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Clock size={14} color={theme.palette.text.secondary} />
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.8rem" }}>
            {formatDuration(minutes)}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          mt: 1,
          height: 8,
          borderRadius: "999px",
          backgroundColor: alpha(theme.palette.primary.main, 0.15),
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "999px",
            backgroundColor: theme.palette.primary.main,
          }}
        />
      </Box>
    </Box>
  );
}

function WatchtimeChartCard({ stats }: { stats: StatisticsResponse }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const total = stats.movieWatchtimeMinutes + stats.seriesWatchtimeMinutes;
  const moviePct = total > 0 ? (stats.movieWatchtimeMinutes / total) * 100 : 0;
  const seriesPct = total > 0 ? (stats.seriesWatchtimeMinutes / total) * 100 : 0;

  return (
    <StyledCard sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
      <Typography
        sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: "1.05rem" }}
      >
        {t("statistics.charts.watchtime.title")}
      </Typography>
      <Typography sx={{ color: theme.palette.primary.light, fontSize: "0.8rem", mt: -1.5 }}>
        {t("statistics.charts.watchtime.subtitle", { duration: formatDuration(total) })}
      </Typography>
      <WatchtimeRow
        icon={Film}
        title={t("common.movies")}
        minutes={stats.movieWatchtimeMinutes}
        pct={moviePct}
      />
      <WatchtimeRow
        icon={Tv}
        title={t("common.series")}
        minutes={stats.seriesWatchtimeMinutes}
        pct={seriesPct}
      />
    </StyledCard>
  );
}

function FavouritesCard({
  stats,
  genreNames,
}: {
  stats: StatisticsResponse;
  genreNames: Record<number, string> | undefined;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const totalTitles = stats.watchedMovies + stats.watchedSeries;

  return (
    <StyledCard>
      <Typography
        sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: "1.05rem" }}
      >
        {t("statistics.favourites.title")}
      </Typography>
      <Typography sx={{ color: theme.palette.primary.light, fontSize: "0.8rem", mt: 0.25, mb: 2 }}>
        {t("statistics.favourites.subtitle")}
      </Typography>

      {stats.favouriteGenres.length === 0 ? (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.9rem" }}>
          {t("statistics.favourites.empty")}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {stats.favouriteGenres.map((genre, index) => {
            const isFirst = index === 0;
            const GenreIconComp = GENRE_ICON_BY_ID[genre.genreId] ?? DEFAULT_GENRE_ICON;
            if (!GENRE_ICON_BY_ID[genre.genreId]) {
              console.warn(`[statistics] unhandled genre id: ${genre.genreId}`);
            }
            const pct =
              totalTitles > 0 ? Math.min((genre.count / totalTitles) * 100, 100) : 0;

            return (
              <Box key={genre.genreId} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: isFirst ? 44 : 40,
                    height: isFirst ? 44 : 40,
                    borderRadius: "12px",
                    backgroundColor: isFirst
                      ? theme.palette.primary.main
                      : alpha(theme.palette.primary.main, 0.12),
                    color: isFirst ? 'white' : theme.palette.primary.light,
                  }}
                >
                  <GenreIconComp size={isFirst ? 22 : 18} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {genreNames?.[genre.genreId] ?? t("statistics.genres.other")}
                      </Typography>
                      {isFirst && (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: "999px",
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.dark,
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t("statistics.favourites.mostWatched")}
                        </Box>
                      )}
                    </Box>
                    <Typography
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("statistics.genres.count", { count: genre.count })}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      mt: 0.75,
                      height: 8,
                      borderRadius: "999px",
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: "999px",
                        backgroundColor: theme.palette.primary.main,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </StyledCard>
  );
}

export default function StatisticsPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useStatistics();
  const { data: genreMaps } = useGenres();

  const genreNames = useMemo(() => {
    if (!genreMaps) {
      return undefined;
    }
    return { ...genreMaps.tv, ...genreMaps.movie };
  }, [genreMaps]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          py: 10,
        }}
      >
        <Typography sx={{ color: theme.palette.text.secondary }}>
          {t("common.somethingWentWrong")}
        </Typography>
        <OutlinedButton onClick={() => void refetch()}>{t("common.tryAgain")}</OutlinedButton>
      </Box>
    );
  }

  const stats = data;
  const year = new Date().getFullYear();
  const moviePhrase = t("statistics.hero.movies", { count: stats.watchedMovies });
  const seriesPhrase = t("statistics.hero.series", {
    count: stats.fullSeriesWatched,
  });
  const heroSummary = t("statistics.hero.summary", {
    movies: moviePhrase,
    series: seriesPhrase,
    year,
  });

  const statCards = [
    {
      key: "movies",
      icon: Film,
      value: stats.watchedMovies,
      description: t("statistics.stats.watchedMovies"),
    },
    {
      key: "series",
      icon: Tv,
      value: stats.fullSeriesWatched,
      description: t("statistics.stats.completedSeries"),
    },
    {
      key: "episodes",
      icon: Clapperboard,
      value: stats.watchedEpisodes,
      description: t("statistics.stats.watchedEpisodes"),
    },
    {
      key: "titles",
      icon: Trophy,
      value: stats.totalMovies + stats.fullSeriesWatched,
      description: t("statistics.stats.totalTitles"),
    },
  ];

  return (
    <Box
      className="fade-in"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        maxWidth: 1040,
        mx: "auto",
        textAlign: "left",
      }}
    >
      <Box>
        <Typography
          variant="h3"
          sx={{ fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.4rem" }, letterSpacing: "-0.03em" }}
        >
          {t("nav.statistics")}
        </Typography>
        <Typography
          variant="body1"
          sx={(theme) => ({ color: theme.palette.text.secondary })}
        >
          {t("statistics.subtitle")}
        </Typography>
      </Box>

      <Card
        sx={{
          position: "relative",
          borderRadius: "16px",
          backgroundColor: theme.palette.primary.main,
          border: `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
          overflow: "hidden",
          p: { xs: 3, sm: 4 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -28,
            right: -28,
            transform:'rotate(15deg)',
            opacity: 0.5,
            color: theme.palette.primary.lighter,
          }}
        >
          <CalendarDays size={160} />
        </Box>
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {t("statistics.hero.thisYear")}
        </Typography>
        <Typography
          sx={{
            color: 'white',
            fontSize: { xs: "1.15rem", sm: "1.45rem" },
            fontWeight: 700,
            mt: 1,
            maxWidth: "85%",
          }}
        >
          {heroSummary}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.primary.light,
            fontSize: "0.85rem",
            mt: 1.5,
          }}
        >
          {t("statistics.hero.watchtime", {
            duration: formatDuration(stats.watchtimeMinutesInYear),
          })}
        </Typography>
      </Card>

      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid key={card.key} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard icon={card.icon} value={card.value} description={card.description} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TitlesChartCard
            watchedMovies={stats.watchedMovies}
            watchedSeries={stats.watchedSeries}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <WatchtimeChartCard stats={stats} />
        </Grid>
      </Grid>

      <FavouritesCard stats={stats} genreNames={genreNames} />
    </Box>
  );
}
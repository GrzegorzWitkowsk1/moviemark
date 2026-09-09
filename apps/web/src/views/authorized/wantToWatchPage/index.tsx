import { useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import type {
  FutureMovieResponse,
  FutureSeriesResponse,
  TmdbMediaType,
} from "shared";
import { useTranslation } from "react-i18next";
import { useFutureList } from "@/hooks/useFuture";
import {
  StyledSelect,
  StyledMenuItem,
  PaperStyles,
} from "@/shared/components/select";
import MediaTypeToggle from "@/shared/components/MediaTypeToggle";
import MovieCard, { type MovieCardData } from "@/shared/components/MovieCard";

type SortOrder = "recent" | "rating" | "alphabetical";

type FutureItem = FutureMovieResponse | FutureSeriesResponse;

const SORT_OPTIONS: { value: SortOrder; labelKey: string }[] = [
  { value: "recent", labelKey: "wantToWatch.sortRecent" },
  { value: "rating", labelKey: "common.sort.highestRated" },
  { value: "alphabetical", labelKey: "common.sort.alphabetical" },
];

function toCardData(item: FutureItem): MovieCardData {
  const isTv = item.mediaType === "tv";
  return {
    mediaType: item.mediaType,
    id: item.tmdbId,
    title: isTv ? item.name : item.title,
    year: item.year ?? null,
    overview: item.overview ?? "",
    voteCount: item.voteCount ?? 0,
    posterPath: item.posterPath,
    rating: item.rating ?? 0,
    genreIds: item.genreIds ?? [],
  };
}

function itemTitle(item: FutureItem): string {
  return item.mediaType === "tv" ? item.name : item.title;
}

function itemRating(item: FutureItem): number {
  return item.rating ?? -1;
}

export default function WantToWatchPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [mediaType, setMediaType] = useState<TmdbMediaType>("movie");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const { data, isLoading } = useFutureList();

  const items = useMemo<FutureItem[]>(() => {
    const all = data ? [...data.movies, ...data.series] : [];
    return all.filter((item) => item.mediaType === mediaType);
  }, [data, mediaType]);

  const sorted = useMemo(() => {
    const copy = [...items];
    switch (sortOrder) {
      case "recent":
        copy.sort(
          (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
        break;
      case "rating":
        copy.sort((a, b) => itemRating(b) - itemRating(a));
        break;
      case "alphabetical":
        copy.sort((a, b) =>
          itemTitle(a).localeCompare(itemTitle(b), undefined, {
            sensitivity: "base",
          })
        );
        break;
    }
    return copy;
  }, [items, sortOrder]);

  return (
    <Box className="fade-in" sx={{ width: "100%", maxWidth: 900, mx: "auto" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          fontSize: { xs: "1.75rem", md: "2.25rem" },
          letterSpacing: "-0.03em",
          color: theme.palette.text.primary,
          textAlign: "left",
        }}
      >
        {t("nav.wantToWatch")}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mt: 0.5,
          mb: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.95rem",
            color: theme.palette.text.secondary,
            textAlign: "left",
          }}
        >
          {t("wantToWatch.description")}
        </Typography>

        <StyledSelect
          value={sortOrder}
          MenuProps={{
            slotProps: {
              paper: {
                sx: {
                  ...PaperStyles(theme),
                },
              },
            },
          }}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          displayEmpty
          sx={{ minWidth: 190 }}
        >
          {SORT_OPTIONS.map((option) => (
            <StyledMenuItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </StyledMenuItem>
          ))}
        </StyledSelect>
      </Box>

      <Box sx={{ mb: 3, display: "flex" }}>
        <MediaTypeToggle value={mediaType} onChange={setMediaType} />
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : sorted.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <Typography
            sx={{
              fontSize: "1.1rem",
              color: theme.palette.text.secondary,
            }}
          >
            {t("wantToWatch.empty")}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sorted.map((item) => (
            <Grid
              key={`${item.mediaType}-${item.tmdbId}`}
              size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
            >
              <MovieCard movie={toCardData(item)} variant="light" />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
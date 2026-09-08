import { useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import type {
  TmdbMediaType,
  WatchedMovieResponse,
  WatchedSeriesResponse,
} from "shared";
import { useTranslation } from "react-i18next";
import { useCollection } from "@/hooks/useCollection";
import { StyledSelect, StyledMenuItem, PaperStyles } from "@/shared/components/select";
import MediaTypeToggle from "@/shared/components/MediaTypeToggle";
import MovieCard, { type MovieCardData } from "@/shared/components/MovieCard";
import SeriesCollectionCard from "./components/SeriesCollectionCard";

type SortOrder = "recent" | "rating" | "alphabetical";

type CollectionItem = WatchedMovieResponse | WatchedSeriesResponse;

const SORT_OPTIONS: { value: SortOrder; labelKey: string }[] = [
  { value: "recent", labelKey: "collection.sortRecent" },
  { value: "rating", labelKey: "common.sort.highestRated" },
  { value: "alphabetical", labelKey: "common.sort.alphabetical" },
];

function toCardData(item: CollectionItem): MovieCardData {
  const movieItem = item as WatchedMovieResponse;
  const seriesItem = item as WatchedSeriesResponse;
  const isTv = item.mediaType === "tv";
  return {
    mediaType: item.mediaType,
    id: item.tmdbId,
    title: isTv ? seriesItem.name : movieItem.title,
    year: item.year ?? null,
    overview: item.overview ?? "",
    voteCount: item.voteCount ?? 0,
    posterPath: item.posterPath,
    rating: item.rating ?? 0,
    genreIds: item.genreIds ?? [],
  };
}

function itemTitle(item: CollectionItem): string {
  const movieItem = item as WatchedMovieResponse;
  const seriesItem = item as WatchedSeriesResponse;
  return item.mediaType === "tv" ? seriesItem.name : movieItem.title;
}

function itemRating(item: CollectionItem): number {
  return item.rating ?? -1;
}

function monthKey(dateStr: string): string {
  const [year, month] = dateStr.slice(0, 10).split("-");
  return `${year}.${month}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split(".");
  return `${month}.${year}`;
}

export default function CollectionPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [mediaType, setMediaType] = useState<TmdbMediaType>("movie");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const { data, isLoading } = useCollection();

  const items = useMemo<CollectionItem[]>(() => {
    const all = data
      ? (data.movies as CollectionItem[]).concat(
          data.series as CollectionItem[]
        )
      : [];
    return all.filter((item) => item.mediaType === mediaType);
  }, [data, mediaType]);

  const sorted = useMemo(() => {
    const copy = [...items];
    switch (sortOrder) {
      case "recent":
        copy.sort(
          (a, b) =>
            new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
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

  const groups = useMemo(() => {
    const map = new Map<string, CollectionItem[]>();
    for (const item of sorted) {
      const key = monthKey(item.watchedAt);
      const arr = map.get(key);
      if (arr) {
        arr.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sorted]);

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
				{t("collection.title")}
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
					{t("collection.description")}
				</Typography>

				<StyledSelect
					value={sortOrder}
          MenuProps={{
            slotProps:{ 
              paper: { 
                sx: {
                  ...PaperStyles(theme)
                }
              }
            }
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
			) : groups.length === 0 ? (
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						py: 10,
					}}
				>
					<Typography
						sx={{
							fontSize: "1.1rem",
							color: theme.palette.text.secondary,
						}}
					>
						{t("collection.empty")}
					</Typography>
				</Box>
			) : (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
					{groups.map(([key, groupItems]) => (
						<Box key={key}>
							<Divider sx={{ mb: 2 }} flexItem>
								<Typography
									sx={{
										fontSize: "0.85rem",
										fontWeight: 700,
										color: theme.palette.text.secondary,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									{monthLabel(key)}
								</Typography>
							</Divider>

							{mediaType === "tv" ? (
								<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
									{groupItems.map((item) => (
										<SeriesCollectionCard
											key={item.tmdbId}
											series={item as WatchedSeriesResponse}
										/>
									))}
								</Box>
							) : (
								<Grid container spacing={2}>
									{groupItems.map((item) => (
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
					))}
				</Box>
			)}
		</Box>
	);
}

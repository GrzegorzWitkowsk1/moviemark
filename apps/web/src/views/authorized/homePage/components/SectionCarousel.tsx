import { useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TmdbMediaType, TmdbMovie, TmdbTv } from "shared";
import MovieCard, { type MovieCardData } from "@/shared/components/MovieCard";
import MediaTypeToggle from "@/shared/components/MediaTypeToggle";

function toCardData(item: TmdbMovie | TmdbTv): MovieCardData {
  const isTv = "name" in item;
  return {
    mediaType: isTv ? "tv" : "movie",
    id: item.id,
    title: isTv ? item.name : item.title,
    year: isTv ? item.first_air_date : item.release_date,
    overview: item.overview,
    voteCount: item.vote_count,
    posterPath: item.poster_path,
    rating: item.vote_average,
    genreIds: item.genre_ids,
  };
}

function usePerPage(): number {
  const theme = useTheme();
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));

  if (isLg) return 6;
  if (isMd) return 4;
  if (isSm) return 3;
  return 2;
}

interface SectionCarouselProps {
  title: string;
  movies: TmdbMovie[];
  series?: TmdbTv[];
}

export default function SectionCarousel({
  title,
  movies,
  series,
}: SectionCarouselProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const perPage = usePerPage();
  const hasSeriesToggle = !!series && series.length > 0 && movies.length > 0;

  const [viewMode, setViewMode] = useState<TmdbMediaType>(
    () => (movies.length > 0 ? "movie" : "tv")
  );
  const [pageIndex, setPageIndex] = useState(0);

  const items = viewMode === "movie" ? movies : series ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visible = items.slice(
    currentPage * perPage,
    currentPage * perPage + perPage
  );

  const handleViewModeChange = (next: TmdbMediaType) => {
    if (next === viewMode) return;
    setViewMode(next);
    setPageIndex(0);
  };

  return (
		<Box sx={{ width: "100%" }}>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: 1,
					mb: 2,
				}}
			>
				<Typography
					sx={{
						fontSize: "1.4rem",
						fontWeight: 700,
						color: theme.palette.text.primary,
						letterSpacing: "-0.02em",
					}}
				>
					{title}
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{hasSeriesToggle && (
						<MediaTypeToggle
							value={viewMode}
							onChange={handleViewModeChange}
						/>
					)}

					<Box sx={{ display: "flex", gap: 0.5 }}>
						<IconButton
							size="small"
							disabled={currentPage === 0}
							onClick={() => setPageIndex(currentPage - 1)}
							aria-label={t("home.previous")}
							sx={{
								color: theme.palette.text.secondary,
								border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
								borderRadius: "10px",
								"&.Mui-disabled": {
									color: theme.palette.grey[500],
									borderColor: alpha(theme.palette.grey[500], 0.3),
								},
							}}
						>
							<ChevronLeft size={18} />
						</IconButton>
						<IconButton
							size="small"
							disabled={currentPage >= totalPages - 1}
							onClick={() => setPageIndex(currentPage + 1)}
							aria-label={t("home.next")}
							sx={{
								color: theme.palette.text.secondary,
								border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
								borderRadius: "10px",
								"&.Mui-disabled": {
									color: theme.palette.grey[500],
									borderColor: alpha(theme.palette.grey[500], 0.3),
								},
							}}
						>
							<ChevronRight size={18} />
						</IconButton>
					</Box>
				</Box>
			</Box>

			<Grid container spacing={2}>
				{visible.map((item) => (
					<Grid key={`${item.id}`} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
						<MovieCard movie={toCardData(item)} />
					</Grid>
				))}
			</Grid>
		</Box>
	);
}
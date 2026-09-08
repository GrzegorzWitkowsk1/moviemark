import { useEffect, useRef } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Check, Clock, Star } from "lucide-react";
import type { TmdbMediaType } from "shared";
import { getBackdropUrl } from "@/lib/poster";
import {
  useAddMovie,
  useMovieWatched,
  useRemoveMovie,
  useSeriesWatched,
  useSeriesWatchedControls,
  type SeriesWatchedControls,
} from "@/hooks/useCollection";
import {
  useFutureMovieControls,
  useFutureSeriesControls,
  useRemoveFutureMovie,
  useRemoveFutureSeries,
  useSeriesFutureStatus,
} from "@/hooks/useFuture";
import {
  useMovieDetails,
  useSimilarMovies,
  useSimilarTv,
  useTvDetails,
} from "@/hooks/useDetails";
import ContainedButton from "@/shared/components/buttons/containedButton";
import SectionCarousel from "@/views/authorized/homePage/components/SectionCarousel";
import DetailHero, { type HeroMetaItem } from "./components/DetailHero";
import SeasonsSection from "./components/SeasonsSection";
import CustomDetailsView from "./components/CustomDetailsView";
import FutureToggleButton from "./components/FutureToggleButton";

export default function DetailsPage() {
  const [params] = useSearchParams();
  const rawId = params.get("id");
  const id = Number(rawId);

  if (!rawId || !Number.isFinite(id) || id === 0) {
    return <MissingId />;
  }

  const mediaType: TmdbMediaType = params.get("type") === "tv" ? "tv" : "movie";

  if (id < 0) {
    return <CustomDetailsView id={id} mediaType={mediaType} />;
  }

  return mediaType === "tv" ? (
    <TvView id={id} />
  ) : (
    <MovieView id={id} />
  );
}

function MissingId() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 10, textAlign: "center" }}>
      <Typography sx={{ color: theme.palette.text.secondary }}>
        {t("details.missingId")}
      </Typography>
    </Box>
  );
}

function LoadingState() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
      <CircularProgress />
    </Box>
  );
}

function ErrorState({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 10, textAlign: "center" }}>
      <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
        {t("details.loadError")}
      </Typography>
      <ContainedButton onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? t("common.loading") : t("common.tryAgain")}
      </ContainedButton>
    </Box>
  );
}

function MovieView({ id }: { id: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data, isLoading, isError, isRefetching, refetch } = useMovieDetails(id);
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
    return <ErrorState onRetry={refetch} isRetrying={isRefetching} />;
  }
  if (isLoading || !data) {
    return <LoadingState />;
  }

  const isWatched = watchedStatus?.watched ?? false;
  const actionPending = addMovie.isPending || removeMovie.isPending;

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

  const meta: HeroMetaItem[] = [
    {
      icon: (
        <Star
          size={18}
          fill={theme.palette.warning.main}
          color={theme.palette.warning.main}
        />
      ),
      label: data.vote_average.toFixed(1),
    },
    {
      icon: (
        <Calendar size={18} style={{ color: alpha("#fff", 0.85) }} />
      ),
      label: data.release_date || t("details.unknown"),
    },
    {
      icon: (
        <Clock size={18} style={{ color: alpha("#fff", 0.85) }} />
      ),
      label: data.runtime
        ? t("details.movieRuntime", { minutes: data.runtime })
        : "-",
    },
  ];

  return (
		<Box className="fade-in" sx={{ width: "100%" }}>
			<DetailHero
				backdropUrl={getBackdropUrl(data.backdrop_path)}
				posterPath={data.poster_path}
				title={data.title}
				meta={meta}
				overview={data.overview}
				action={
					<Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
						<ContainedButton
							onClick={handleToggleWatched}
							disabled={actionPending}
							startIcon={isWatched ? <Check size={16} /> : undefined}
						>
							{isWatched ? t("details.watched") : t("details.addToWatched")}
						</ContainedButton>
						<FutureToggleButton
							controls={futureControls}
							disabled={isWatched}
						/>
					</Box>
				}
			/>

			<SectionCarousel
				title={t("details.youMayAlsoLike")}
				movies={similar?.results ?? []}
			/>
		</Box>
	);
}

function TvView({ id }: { id: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data, isLoading, isError, isRefetching, refetch } = useTvDetails(id);
  const { data: similar } = useSimilarTv(id);
  const watched: SeriesWatchedControls = useSeriesWatchedControls(id, {
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
  const { data: watchedStatus } = useSeriesWatched(id);
  const { data: futureStatus } = useSeriesFutureStatus(id);
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
    return <ErrorState onRetry={refetch} isRetrying={isRefetching} />;
  }
  if (isLoading || !data) {
    return <LoadingState />;
  }

  const episodeMinutes = data.episode_run_time[0];
  const meta: HeroMetaItem[] = [
    {
      icon: (
        <Star
          size={18}
          fill={theme.palette.warning.main}
          color={theme.palette.warning.main}
        />
      ),
      label: data.vote_average.toFixed(1),
    },
    {
      icon: (
        <Calendar size={18} style={{ color: alpha("#fff", 0.85) }} />
      ),
      label: data.first_air_date || t("details.unknown"),
    },
    {
      icon: (
        <Clock size={18} style={{ color: alpha("#fff", 0.85) }} />
      ),
      label: episodeMinutes
        ? t("details.minPerEpisode", { minutes: episodeMinutes })
        : t("details.unknown"),
    },
  ];

  return (
    <Box className="fade-in" sx={{ width: "100%" }}>
      <DetailHero
        backdropUrl={getBackdropUrl(data.backdrop_path)}
        posterPath={data.poster_path}
        title={data.name}
        meta={meta}
        overview={data.overview}
        action={<FutureToggleButton controls={futureControls} />}
      />

      <SeasonsSection tvId={data.id} seasons={data.seasons} watched={watched} />

      <SectionCarousel title={t("details.youMayAlsoLike")} movies={[]} series={similar?.results ?? []} />
    </Box>
  );
}
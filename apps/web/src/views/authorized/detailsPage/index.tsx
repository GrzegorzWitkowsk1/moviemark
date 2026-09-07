import {
  Box,
  CircularProgress,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { Calendar, Check, Clock, Star } from "lucide-react";
import type { TmdbMediaType } from "shared";
import { getBackdropUrl } from "@/lib/poster";
import {
  useAddMovie,
  useMovieWatched,
  useRemoveMovie,
  useSeriesWatchedControls,
  type SeriesWatchedControls,
} from "@/hooks/useCollection";
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

export default function DetailsPage() {
  const [params] = useSearchParams();
  const rawId = params.get("id");
  const id = Number(rawId);

  if (!rawId || !Number.isFinite(id) || id <= 0) {
    return <MissingId />;
  }

  const mediaType: TmdbMediaType = params.get("type") === "tv" ? "tv" : "movie";

  return mediaType === "tv" ? (
    <TvView id={id} />
  ) : (
    <MovieView id={id} />
  );
}

function MissingId() {
  const theme = useTheme();
  return (
    <Box sx={{ py: 10, textAlign: "center" }}>
      <Typography sx={{ color: theme.palette.text.secondary }}>
        Missing or invalid movie/series id.
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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <Box sx={{ py: 10, textAlign: "center" }}>
      <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
        Couldn&apos;t load this title. Please try again.
      </Typography>
      <ContainedButton onClick={onRetry}>Try again</ContainedButton>
    </Box>
  );
}

function MovieView({ id }: { id: number }) {
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useMovieDetails(id);
  const { data: similar } = useSimilarMovies(id);
  const { data: watchedStatus } = useMovieWatched(id);
  const addMovie = useAddMovie();
  const removeMovie = useRemoveMovie();

  if (isError) {
    return <ErrorState onRetry={refetch} />;
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
      addMovie.mutate({
        tmdbId: data.id,
        title: data.title,
        posterPath: data.poster_path,
        rating: data.vote_average,
      });
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
      label: data.release_date || "Unknown",
    },
    {
      icon: (
        <Clock size={18} style={{ color: alpha("#fff", 0.85) }} />
      ),
      label: data.runtime ? `${data.runtime} min.` : "-",
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
          <ContainedButton
            onClick={handleToggleWatched}
            disabled={actionPending}
            startIcon={isWatched ? <Check size={16} /> : undefined}
          >
            {isWatched ? "Watched" : "Add to watched"}
          </ContainedButton>
        }
      />

      <SectionCarousel title="You may also like" movies={similar?.results ?? []} />
    </Box>
  );
}

function TvView({ id }: { id: number }) {
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useTvDetails(id);
  const { data: similar } = useSimilarTv(id);
  const watched: SeriesWatchedControls = useSeriesWatchedControls(id, {
    name: data?.name ?? "",
    posterPath: data?.poster_path ?? null,
    totalEpisodes: data?.number_of_episodes ?? 0,
    rating: data?.vote_average,
  });

  if (isError) {
    return <ErrorState onRetry={refetch} />;
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
      label: data.first_air_date || "Unknown",
    },
    {
      icon: (
        <Clock size={18} style={{ color: alpha("#fff", 0.85) }} />
      ),
      label: episodeMinutes ? `~ ${episodeMinutes} min/ep` : "Unknown",
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
      />

      <SeasonsSection tvId={data.id} seasons={data.seasons} watched={watched} />

      <SectionCarousel title="You may also like" movies={[]} series={similar?.results ?? []} />
    </Box>
  );
}
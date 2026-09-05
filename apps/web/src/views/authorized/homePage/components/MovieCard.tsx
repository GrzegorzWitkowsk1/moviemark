import { Box, Typography, alpha, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import type { TmdbMediaType } from "shared";
import { useResolveGenres } from "@/hooks/useHomeContent";
import { getPosterUrl } from "@/lib/poster";

export interface MovieCardData {
  mediaType: TmdbMediaType;
  id: number;
  title: string;
  year: string | null;
  overview: string;
  posterPath: string | null;
  voteCount?: number | null;
  rating: number;
  genreIds: number[];
}

interface MovieCardProps {
  movie: MovieCardData;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const genres = useResolveGenres(movie.mediaType, movie.genreIds);

  const posterUrl = getPosterUrl(movie.posterPath);
  const year = movie.year ? movie.year.slice(0, 4) : null;
  const meta = [year, ...genres].filter(Boolean).join(" · ");

  const handleClick = () => {
    navigate(`/auth/movies?id=${movie.id}`);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "2 / 3",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: alpha(theme.palette.primary.darker, 0.4),
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.28)}`,
          "&:hover .card-description": {
            opacity: 1,
            transform: "translateY(0)",
          },
        }}
      >
        {posterUrl && (
          <Box
            component="img"
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 0.4,
            padding: "2px 8px",
            borderRadius: "10px",
            backgroundColor: alpha(theme.palette.common.black, 0.6),
            backdropFilter: "blur(4px)",
          }}
        >
          <Star
            size={14}
            fill={theme.palette.warning.main}
            color={theme.palette.warning.main}
          />
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            {movie.rating.toFixed(1)}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            {`(${movie.voteCount || 0})`}
          </Typography>
        </Box>

        <Box
          className="card-description"
          sx={{
            position: "absolute",
            inset: "auto 0 0 0",
            padding: "12px",
            background: `linear-gradient(to top, ${alpha(
              theme.palette.common.black,
              0.85
            )}, ${alpha(theme.palette.common.black, 0.55)} 60%, transparent)`,
            opacity: 0,
            transform: "translateY(100%)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {movie.overview || "No description available."}
          </Typography>
        </Box>
      </Box>

      <Typography
        noWrap
        sx={{
          mt: 1,
          alignSelf: "flex-start",
          fontSize: "0.9rem",
          color: theme.palette.text.primary,
        }}
      >
        {movie.title}
      </Typography>

      <Typography
        noWrap
        sx={{
          alignSelf: "flex-start",
          fontSize: "0.8rem",
          color: theme.palette.text.secondary,
        }}
      >
        {meta}
      </Typography>
    </Box>
  );
}

import {
  Box,
  LinearProgress,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPosterUrl } from "@/lib/poster";
import type { WatchedSeriesResponse } from "shared";

interface SeriesCollectionCardProps {
  series: WatchedSeriesResponse;
}

export default function SeriesCollectionCard({
  series,
}: SeriesCollectionCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const posterUrl = getPosterUrl(series.posterPath);
  const percent =
    series.totalEpisodes > 0
      ? Math.round((series.watchedCount / series.totalEpisodes) * 100)
      : 0;

  const handleClick = () => {
    navigate(`/auth/movies?id=${series.tmdbId}&type=tv`);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "stretch",
        cursor: "pointer",
        width: "100%",
        borderRadius: "16px",
        backgroundColor: theme.palette.primary.dark,
        border: `1px solid ${theme.palette.secondary.darker}`,
        overflow: "hidden",
        transition: "border-color 0.2s ease, transform 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          transform: "translateY(-1px)",
        },
        [theme.breakpoints.down("sm")]: {
          gap: 1.5,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: { xs: 72, sm: 96, md: 110 },
          aspectRatio: "2 / 3",
          flexShrink: 0,
          backgroundColor: alpha(theme.palette.primary.darker, 0.4),
        }}
      >
        {posterUrl && (
          <Box
            component="img"
            src={posterUrl}
            alt={series.name}
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
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          py: 1.5,
          pr: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "0.95rem", sm: "1.05rem" },
            fontWeight: 700,
            color: theme.palette.text.primary,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {series.name}
        </Typography>

        {series.rating != null && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <Star
              size={14}
              fill={theme.palette.warning.main}
              color={theme.palette.warning.main}
            />
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              {series.rating.toFixed(1)}
            </Typography>
          </Box>
        )}

        <Typography
          sx={{
            mt: 0.5,
            fontSize: "0.85rem",
            color: theme.palette.text.secondary,
          }}
        >
          {`${series.watchedCount}/${series.totalEpisodes} episodes watched`}
        </Typography>

        <Box sx={{ mt: "auto", pt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              height: 6,
              borderRadius: 999,
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

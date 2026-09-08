import {
  Box,
  LinearProgress,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getPosterUrl } from "@/lib/poster";
import type { WatchedSeriesResponse } from "shared";
import { useTranslation } from "react-i18next";

interface SeriesCollectionCardProps {
  series: WatchedSeriesResponse;
}

export default function SeriesCollectionCard({
  series,
}: SeriesCollectionCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        <Typography
          sx={{
            mt: 0.5,
            fontSize: "0.85rem",
            color: theme.palette.text.secondary,
          }}
        >
          {t("collection.watchedProgress", {
            watched: series.watchedCount,
            total: series.totalEpisodes,
          })}
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

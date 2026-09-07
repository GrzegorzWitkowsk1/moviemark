import type { ReactNode } from "react";
import { Box, Typography, alpha, useTheme } from "@mui/material";
import { getPosterUrl } from "@/lib/poster";

export interface HeroMetaItem {
  icon: ReactNode;
  label: string;
}

interface DetailHeroProps {
  backdropUrl: string | null;
  posterPath: string | null;
  title: string;
  meta: HeroMetaItem[];
  overview: string;
  action?: ReactNode;
}

export default function DetailHero({
  backdropUrl,
  posterPath,
  title,
  meta,
  overview,
  action,
}: DetailHeroProps) {
  const theme = useTheme();
  const posterUrl = getPosterUrl(posterPath);

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "24px",
        overflow: "hidden",
        mb: 5,
      }}
    >
      {backdropUrl && (
        <Box
          component="img"
          src={backdropUrl}
          alt=""
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
          position: "relative",
          background: `linear-gradient(180deg, ${alpha(
            theme.palette.common.black,
            0.55
          )}, ${alpha(theme.palette.common.black, 0.88)})`,
          p: { xs: 3, md: 5 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            alignItems: "flex-start",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: "100%", md: 260 },
              maxWidth: 260,
              aspectRatio: "2 / 3",
              borderRadius: "16px",
              overflow: "hidden",
              mx: { xs: "auto", md: 0 },
              backgroundColor: alpha(theme.palette.primary.darker, 0.4),
              boxShadow: `0 16px 40px ${alpha(theme.palette.common.black, 0.5)}`,
            }}
          >
            {posterUrl && (
              <Box
                component="img"
                src={posterUrl}
                alt={title}
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
              width: "100%",
              textAlign: "left",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                justifySelf:'center',
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#fff",
                mb: 1.5,
              }}
            >
              {title}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              {meta.map((item, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "center", gap: 0.6 }}
                >
                  {item.icon}
                  <Typography
                    sx={{ color: "#fff", fontSize: "0.9rem", fontWeight: 500 }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography
              sx={{
                color: alpha("#fff", 0.85),
                fontSize: "1rem",
                lineHeight: 1.7,
                mb: 2.5,
              }}
            >
              {overview || "No description available."}
            </Typography>

            {action && (
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                {action}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
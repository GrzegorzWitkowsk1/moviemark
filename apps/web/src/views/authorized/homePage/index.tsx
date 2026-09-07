import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, InputAdornment, Typography, alpha, useTheme } from "@mui/material";
import { Search } from "lucide-react";
import {
  useNewContent,
  useTrendingContent,
  useUpcomingMovies,
} from "@/hooks/useHomeContent";
import StyledTextField from "@/shared/components/textField";
import ContainedButton from "@/shared/components/buttons/containedButton";
import SectionCarousel from "./components/SectionCarousel";

export default function HomePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const newContent = useNewContent();
  const upcoming = useUpcomingMovies();
  const trending = useTrendingContent();

  const loading =
    newContent.isLoading || upcoming.isLoading || trending.isLoading;

  return (
    <Box className="fade-in" sx={{ width: "100%" }}>
      <Box
        sx={{
          textAlign: "center",
          maxWidth: 760,
          margin: "0 auto",
          mb: 5,
          mt: { xs: 2, md: 4 },
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "2rem", md: "2.75rem" },
            letterSpacing: "-0.03em",
            color: theme.palette.text.primary,
            mb: 1.5,
          }}
        >
          Your calm little cinema log.
        </Typography>

        <Typography
          sx={{
            fontSize: "1rem",
            lineHeight: 1.6,
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          Browse, rate and remember the movies and shows you love — in a space
          that feels like a favorite café.
        </Typography>

        <Box
          component="form"
          sx={{
            display: "flex",
            gap: 1,
            maxWidth: 520,
            margin: "0 auto",
          }}
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            if (query.trim()) {
              navigate(`/auth/search?q=${encodeURIComponent(query.trim())}`);
            }
          }}
        >
          <StyledTextField
            fullWidth
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies & series..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search
                      size={18}
                      style={{ color: theme.palette.text.secondary }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha(theme.palette.common.white, 0.04),
              },
            }}
          />
          <ContainedButton
            type="submit"
            size="large"
            sx={{ px: 3, flexShrink: 0, height: 45 }}
          >
            Search
          </ContainedButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <SectionCarousel
            title="New Releases"
            movies={newContent.data?.movies ?? []}
            series={newContent.data?.series ?? []}
          />

          <SectionCarousel
            title="Upcoming"
            movies={upcoming.data ?? []}
          />

          <SectionCarousel
            title="Trending"
            movies={trending.data?.movies ?? []}
            series={trending.data?.series ?? []}
          />
        </Box>
      )}
    </Box>
  );
}
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Grid,
  InputAdornment,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Search, Film } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearch } from "@/hooks/useSearch";
import StyledTextField from "@/shared/components/textField";
import ContainedButton from "@/shared/components/buttons/containedButton";
import MovieCard, { type MovieCardData } from "@/shared/components/MovieCard";
import type { TmdbMovie, TmdbTv } from "shared";
import AddCustomDialog from "./components/AddCustomDialog";

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

export default function SearchPage() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const debouncedValue = useDebounce(inputValue, 400);

  useEffect(() => {
    if (debouncedValue.trim()) {
      setSearchParams({ q: debouncedValue.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedValue, setSearchParams]);

  const { data: results, isLoading } = useSearch(debouncedValue);
  const hasQuery = debouncedValue.trim().length > 0;
  const [customOpen, setCustomOpen] = useState(false);

  return (
    <Box className="fade-in" sx={{ width: "100%", maxWidth: 900, mx: "auto" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          fontSize: { xs: "1.75rem", md: "2.25rem" },
          letterSpacing: "-0.03em",
          textAlign:'left',
          color: theme.palette.text.primary,
          mb: 3,
        }}
      >
        Search
      </Typography>

      <StyledTextField
        fullWidth
        variant="outlined"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search movies, series, genres...."
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
          mb: 3,
          "& .MuiOutlinedInput-root": {
            backgroundColor: alpha(theme.palette.common.white, 0.04),
          },
        }}
      />

      {hasQuery && (
        <Typography
          sx={{
            fontSize: "0.9rem",
            textAlign: "left",
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          {isLoading
            ? "Searching..."
            : `${results?.length ?? 0} result${(results?.length ?? 0) !== 1 ? "s" : ""} found`}
        </Typography>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : hasQuery && results && results.length > 0 ? (
        <Grid container spacing={2}>
          {results.map((item) => (
            <Grid key={item.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
              <MovieCard movie={toCardData(item)} />
            </Grid>
          ))}
        </Grid>
      ) : hasQuery && !isLoading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 10,
            gap: 2,
          }}
        >
          <Film
            size={48}
            style={{ color: theme.palette.text.secondary, opacity: 0.5 }}
          />
          <Typography
            sx={{
              fontSize: "1.1rem",
              color: theme.palette.text.secondary,
            }}
          >
            No results found
          </Typography>
          <ContainedButton
            size="large"
            sx={{ mt: 1 }}
            onClick={() => setCustomOpen(true)}
          >
            Add movie/series
          </ContainedButton>
        </Box>
      ) : null}

      <AddCustomDialog open={customOpen} onClose={() => setCustomOpen(false)} />
    </Box>
  );
}

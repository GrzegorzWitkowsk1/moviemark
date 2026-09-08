import { useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Plus, ChevronDown, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TmdbMediaType } from "shared";
import { useGenres } from "@/hooks/useHomeContent";
import { useCreateCustomItem } from "@/hooks/useCustom";
import { useSnackbar } from "@/contexts/snackbarContext";
import StyledTextField from "@/shared/components/textField";
import {
  StyledSelect,
  StyledMenuItem,
  PaperStyles,
} from "@/shared/components/select";
import MediaTypeToggle from "@/shared/components/MediaTypeToggle";
import ContainedButton from "@/shared/components/buttons/containedButton";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";

interface AddCustomDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CustomEpisode {
  season: number;
  episode: number;
  name: string;
}

interface CustomSeason {
  seasonNumber: number;
  episodes: CustomEpisode[];
}

interface SeriesDraft {
  name: string;
  year: string | null;
  genreIds: number[];
  seasons: CustomSeason[];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      color="primary"
      variant="body2"
      sx={{ mb: 0.5, fontWeight: 500, textAlign: "left" }}
    >
      {children}
    </Typography>
  );
}

export default function AddCustomDialog({
  open,
  onClose,
}: AddCustomDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: genres } = useGenres();
  const { open: snackbar } = useSnackbar();
  const createCustom = useCreateCustomItem();

  const [mediaType, setMediaType] = useState<TmdbMediaType>("movie");
  const [submitting, setSubmitting] = useState(false);

  const [movieName, setMovieName] = useState("");
  const [movieGenres, setMovieGenres] = useState<number[]>([]);
  const [movieYear, setMovieYear] = useState("");
  const [movieRuntime, setMovieRuntime] = useState("");

  const [series, setSeries] = useState<SeriesDraft>({
    name: "",
    year: "",
    genreIds: [],
    seasons: [],
  });
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const genreOptions =
    mediaType === "movie"
      ? Object.entries(genres?.movie ?? {}).map(([id, name]) => ({
          id: Number(id),
          name,
        }))
      : Object.entries(genres?.tv ?? {}).map(([id, name]) => ({
          id: Number(id),
          name,
        }));

  const reset = () => {
    setMediaType("movie");
    setMovieName("");
    setMovieGenres([]);
    setMovieYear("");
    setMovieRuntime("");
    setSeries({ name: "", year: "", genreIds: [], seasons: [] });
    setExpandedSeason(null);
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  const addSeason = () => {
    const nextNumber =
      series.seasons.length > 0
        ? series.seasons[series.seasons.length - 1].seasonNumber + 1
        : 1;
    const newSeason: CustomSeason = {
      seasonNumber: nextNumber,
      episodes: [
        {
          season: nextNumber,
          episode: 1,
          name: t("addCustom.episodePrefix", { number: 1 }),
        },
      ],
    };
    setSeries((prev) => ({
      ...prev,
      seasons: [...prev.seasons, newSeason],
    }));
    setExpandedSeason(nextNumber);
  };

  const removeSeason = (seasonNumber: number) => {
    setSeries((prev) => ({
      ...prev,
      seasons: prev.seasons
        .filter((s) => s.seasonNumber !== seasonNumber)
        .map((s, index) => ({
          seasonNumber: index + 1,
          episodes: s.episodes.map((e) => ({
            ...e,
            season: index + 1,
          })),
        })),
    }));
    setExpandedSeason(null);
  };

  const addEpisode = (seasonNumber: number) => {
    setSeries((prev) => ({
      ...prev,
      seasons: prev.seasons.map((s) => {
        if (s.seasonNumber !== seasonNumber) {
          return s;
        }
        const nextEpisode = s.episodes.length + 1;
        return {
          ...s,
          episodes: [
            ...s.episodes,
            {
              season: s.seasonNumber,
              episode: nextEpisode,
              name: t("addCustom.episodePrefix", { number: nextEpisode }),
            },
          ],
        };
      }),
    }));
  };

  const removeEpisode = (seasonNumber: number, episode: number) => {
    setSeries((prev) => ({
      ...prev,
      seasons: prev.seasons.map((s) => {
        if (s.seasonNumber !== seasonNumber) {
          return s;
        }
        const episodes = s.episodes
          .filter((e) => e.episode !== episode)
          .map((e, index) => ({
            ...e,
            episode: index + 1,
            name: e.name.startsWith("EP ") ? `EP ${index + 1}` : e.name,
          }));
        return { ...s, episodes };
      }),
    }));
  };

  const updateEpisodeName = (
    seasonNumber: number,
    episode: number,
    name: string
  ) => {
    setSeries((prev) => ({
      ...prev,
      seasons: prev.seasons.map((s) =>
        s.seasonNumber === seasonNumber
          ? {
              ...s,
              episodes: s.episodes.map((e) =>
                e.episode === episode ? { ...e, name } : e
              ),
            }
          : s
      ),
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mediaType === "movie") {
        if (!movieName.trim()) {
          setError(t("addCustom.movieNameError"));
          setSubmitting(false);
          return;
        }
        await createCustom.mutateAsync({
          mediaType: "movie",
          data: {
            name: movieName.trim(),
            genreIds: movieGenres,
            year: movieYear ? new Date(movieYear).getFullYear().toString() : null,
            runtimeMinutes: movieRuntime
              ? Number(movieRuntime)
              : null,
          },
        });
        snackbar(t("addCustom.movieAdded"), "success");
      } else {
        if (!series.name.trim()) {
          setError(t("addCustom.seriesNameError"));
          setSubmitting(false);
          return;
        }
        if (series.seasons.length === 0) {
          setError(t("addCustom.atLeastOneSeason"));
          setSubmitting(false);
          return;
        }
        if (series.seasons.some((s) => s.episodes.length === 0)) {
          setError(t("addCustom.everySeasonEpisode"));
          setSubmitting(false);
          return;
        }
        await createCustom.mutateAsync({
          mediaType: "tv",
          data: {
            name: series.name.trim(),
            genreIds: series.genreIds,
            year: series.year
              ? new Date(series.year).getFullYear().toString()
              : null,
            seasons: series.seasons,
          },
        });
        snackbar(t("addCustom.seriesAdded"), "success");
      }
      reset();
      onClose();
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const isSeries = mediaType === "tv";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            backgroundColor: theme.palette.primary.dark,
            border: `1px solid ${theme.palette.secondary.darker}`,
            color: "#f2f0ea",
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "primary.light" }}>
        {t("addCustom.title")}
      </DialogTitle>
      <DialogContent sx={{ color: "text.secondary" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2.5 }}>
          <MediaTypeToggle value={mediaType} onChange={setMediaType} />
        </Box>

        {isSeries ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <FieldLabel>{t("addCustom.seriesNameRequired")}</FieldLabel>
              <StyledTextField
                fullWidth
                variant="outlined"
                placeholder={t("addCustom.seriesNamePlaceholder")}
                value={series.name}
                onChange={(e) =>
                  setSeries((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <FieldLabel>{t("addCustom.year")}</FieldLabel>
                <StyledTextField
                  fullWidth
                  variant="outlined"
                  type="date"
                  value={series.year}
                  onChange={(e) =>
                    setSeries((prev) => ({
                      ...prev,
                      year: e.target.value,
                    }))
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>{t("addCustom.genre")}</FieldLabel>
                <StyledSelect
                  fullWidth
                  multiple
                  value={series.genreIds}
                  onChange={(e) =>
                    setSeries((prev) => ({
                      ...prev,
                      genreIds: e.target.value as number[],
                    }))
                  }
                  renderValue={(selected) => {
                    const ids = selected as number[];
                    if (ids.length === 0) {
                      return <span>{t("addCustom.selectGenres")}</span>;
                    }
                    const names = ids
                      .map((id) => genreOptions.find((g) => g.id === id)?.name)
                      .filter(Boolean);
                    return <span>{names.join(", ")}</span>;
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: { sx: { ...PaperStyles(theme) } },
                    },
                  }}
                >
                  {genreOptions.map((genre) => (
                    <StyledMenuItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </StyledMenuItem>
                  ))}
                </StyledSelect>
              </Box>
            </Box>

            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <FieldLabel>{t("addCustom.seasons")}</FieldLabel>
                <OutlinedButton
                  size="small"
                  startIcon={<Plus size={15} />}
                  onClick={addSeason}
                >
                  {t("addCustom.addSeason")}
                </OutlinedButton>
              </Box>

              {series.seasons.length === 0 ? (
                <Typography
                  sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary }}
                >
                  {t("addCustom.noSeasons")}
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {series.seasons.map((season) => (
                    <SeasonEditor
                      key={season.seasonNumber}
                      season={season}
                      expanded={expandedSeason === season.seasonNumber}
                      onToggle={() =>
                        setExpandedSeason((current) =>
                          current === season.seasonNumber
                            ? null
                            : season.seasonNumber
                        )
                      }
                      onAddEpisode={() => addEpisode(season.seasonNumber)}
                      onRemoveEpisode={(episode) =>
                        removeEpisode(season.seasonNumber, episode)
                      }
                      onRemoveSeason={() => removeSeason(season.seasonNumber)}
                      onRenameEpisode={(episode, name) =>
                        updateEpisodeName(season.seasonNumber, episode, name)
                      }
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <FieldLabel>{t("addCustom.movieNameRequired")}</FieldLabel>
              <StyledTextField
                fullWidth
                variant="outlined"
                placeholder={t("addCustom.movieNamePlaceholder")}
                value={movieName}
                onChange={(e) => setMovieName(e.target.value)}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <FieldLabel>{t("addCustom.year")}</FieldLabel>
                <StyledTextField
                  fullWidth
                  variant="outlined"
                  type="date"
                  value={movieYear}
                  onChange={(e) => setMovieYear(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>{t("addCustom.durationMinutes")}</FieldLabel>
                <StyledTextField
                  fullWidth
                  variant="outlined"
                  type="number"
                  placeholder={t("addCustom.durationExample")}
                  value={movieRuntime}
                  onChange={(e) => setMovieRuntime(e.target.value)}
                />
              </Box>
            </Box>

            <Box>
              <FieldLabel>{t("addCustom.genre")}</FieldLabel>
              <StyledSelect
                fullWidth
                multiple
                value={movieGenres}
                onChange={(e) => setMovieGenres(e.target.value as number[])}
                renderValue={(selected) => {
                  const ids = selected as number[];
                  if (ids.length === 0) {
                    return <span>{t("addCustom.selectGenres")}</span>;
                  }
                  const names = ids
                    .map((id) => genreOptions.find((g) => g.id === id)?.name)
                    .filter(Boolean);
                  return <span>{names.join(", ")}</span>;
                }}
                MenuProps={{
                  slotProps: {
                    paper: { sx: { ...PaperStyles(theme) } },
                  },
                }}
              >
                {genreOptions.map((genre) => (
                  <StyledMenuItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </StyledMenuItem>
                ))}
              </StyledSelect>
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <OutlinedButton onClick={handleClose} disabled={submitting}>
          {t("common.cancel")}
        </OutlinedButton>
        <ContainedButton onClick={handleSubmit} disabled={submitting}>
          {submitting ? t("common.saving") : t("addCustom.addToCollection")}
        </ContainedButton>
      </DialogActions>
    </Dialog>
  );
}

interface SeasonEditorProps {
  season: CustomSeason;
  expanded: boolean;
  onToggle: () => void;
  onAddEpisode: () => void;
  onRemoveEpisode: (episode: number) => void;
  onRemoveSeason: () => void;
  onRenameEpisode: (episode: number, name: string) => void;
}

function SeasonEditor({
  season,
  expanded,
  onToggle,
  onAddEpisode,
  onRemoveEpisode,
  onRemoveSeason,
  onRenameEpisode,
}: SeasonEditorProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        backgroundColor: alpha(theme.palette.primary.main, 0.06),
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={onToggle}
      >
        <ChevronDown
          size={18}
          style={{
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
            color: theme.palette.text.secondary,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            flex: 1,
            fontSize: "0.9rem",
            fontWeight: 700,
            color: theme.palette.text.primary,
          }}
        >
          {t("common.seasonHeader", { number: season.seasonNumber })}
        </Typography>
        <Box
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSeason();
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "8px",
            cursor: "pointer",
            color: theme.palette.text.secondary,
            "&:hover": { color: theme.palette.error.main },
          }}
          role="button"
          aria-label={t("addCustom.removeSeason")}
        >
          <Trash2 size={15} />
        </Box>
      </Box>

      {expanded && (
        <Box sx={{ px: 2, pb: 2 }}>
          {season.episodes.map((episode) => (
            <Box
              key={episode.episode}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                  width: 34,
                  flexShrink: 0,
                }}
              >
                {episode.episode < 10 ? `0${episode.episode}` : episode.episode}
              </Typography>
              <StyledTextField
                fullWidth
                variant="outlined"
                size="small"
                value={episode.name}
                onChange={(e) => onRenameEpisode(episode.episode, e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { height: "38px" },
                }}
              />
              <Box
                onClick={() => onRemoveEpisode(episode.episode)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: theme.palette.text.secondary,
                  flexShrink: 0,
                  "&:hover": { color: theme.palette.error.main },
                }}
                role="button"
                aria-label={t("addCustom.removeEpisode")}
              >
                <Trash2 size={15} />
              </Box>
            </Box>
          ))}

          <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-start" }}>
            <OutlinedButton
              size="small"
              startIcon={<Plus size={15} />}
              onClick={onAddEpisode}
            >
              {t("addCustom.addEpisode")}
            </OutlinedButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}

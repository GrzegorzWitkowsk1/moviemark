import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  LinearProgress,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { ChevronDown, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TmdbEpisode, TmdbSeasonSummary } from "shared";
import { useTvSeason } from "@/hooks/useDetails";
import type { SeriesWatchedControls } from "@/hooks/useCollection";
import { useWatchedPrompt } from "@/lib/watchedPrompt";
import ContainedButton from "@/shared/components/buttons/containedButton";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";

interface SeasonsSectionProps {
  tvId: number;
  seasons: TmdbSeasonSummary[];
  watched: SeriesWatchedControls;
}

export default function SeasonsSection({
  tvId,
  seasons,
  watched,
}: SeasonsSectionProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<number[]>(() =>
    seasons.length > 0 ? [seasons[0].season_number] : []
  );

  const sorted = useMemo(
    () => [...seasons].sort((a, b) => a.season_number - b.season_number),
    [seasons]
  );

  const toggle = (seasonNumber: number) => {
    setExpanded((current) =>
      current.includes(seasonNumber)
        ? current.filter((n) => n !== seasonNumber)
        : [...current, seasonNumber]
    );
  };

  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        sx={{
          fontSize: "1.4rem",
          fontWeight: 700,
          color: theme.palette.text.primary,
          letterSpacing: "-0.02em",
          mb: 2,
        }}
      >
        {t("details.seasons")}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {sorted.map((season) => (
          <SeasonAccordion
            key={season.season_number}
            tvId={tvId}
            season={season}
            watched={watched}
            expanded={expanded.includes(season.season_number)}
            onToggle={() => toggle(season.season_number)}
          />
        ))}
      </Box>
    </Box>
  );
}

interface SeasonAccordionProps {
  tvId: number;
  season: TmdbSeasonSummary;
  watched: SeriesWatchedControls;
  expanded: boolean;
  onToggle: () => void;
}

interface PendingEpisodes {
  episode: TmdbEpisode;
  earlier: TmdbEpisode[];
}

function SeasonAccordion({
  tvId,
  season,
  watched,
  expanded,
  onToggle,
}: SeasonAccordionProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const prompt = useWatchedPrompt();
  const { data, isLoading } = useTvSeason(tvId, season.season_number, {
    enabled: expanded,
  });
  const [pending, setPending] = useState<PendingEpisodes | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const watchedCount = watched.countWatchedEpisodes(season.season_number);
  const totalCount = season.episode_count;
  const progress = totalCount > 0 ? Math.min(watchedCount, totalCount) : 0;
  const progressPercent =
    totalCount > 0 ? Math.round((progress / totalCount) * 100) : 0;

  const seasonLabel =
    season.name &&
    season.name.toLowerCase() !== `season ${season.season_number}`
      ? ` — ${season.name}`
      : "";

  const handleEpisodeClick = (episode: TmdbEpisode) => {
    if (
      watched.isEpisodeWatched(
        episode.season_number,
        episode.episode_number
      )
    ) {
      watched
        .unmarkEpisode(episode.season_number, episode.episode_number)
        .catch(() => {});
      return;
    }

    const earlierUnchecked =
      data?.episodes.filter(
        (e) =>
          e.episode_number < episode.episode_number &&
          !watched.isEpisodeWatched(e.season_number, e.episode_number)
      ) ?? [];

    if (earlierUnchecked.length > 0 && !prompt.isPromptSkipped(tvId)) {
      setDontAskAgain(false);
      setPending({ episode, earlier: earlierUnchecked });
      return;
    }

    watched
      .markEpisodesWatched(episode.season_number, [
        episode.episode_number,
      ])
      .catch(() => {});
  };

  const closePending = (markEarlier: boolean) => {
    if (!pending) {
      return;
    }
    const { episode, earlier } = pending;
    const mark = markEarlier
      ? watched.markEpisodesWatched(episode.season_number, [
          ...earlier.map((e) => e.episode_number),
          episode.episode_number,
        ])
      : watched.markEpisodesWatched(episode.season_number, [
          episode.episode_number,
        ]);
    mark.catch(() => {});
    if (dontAskAgain) {
      prompt.skipPromptsFor(tvId);
    }
    setPending(null);
  };

  const earlierNumbers = pending?.earlier.map((e) => e.episode_number) ?? [];

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      sx={{
        backgroundColor: alpha(theme.palette.primary.main, 0.06),
        borderRadius: "14px",
        "&::before": { display: "none" },
        boxShadow: "none",
      }}
    >
      <AccordionSummary
        expandIcon={
          <ChevronDown size={20} style={{ color: theme.palette.text.secondary }} />
        }
        sx={{ borderRadius: "14px", px: 2.5 }}
      >
        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              {t("common.seasonHeader", { number: season.season_number })}{seasonLabel}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: theme.palette.text.secondary,
              }}
            >
              {`${progress}/${totalCount}`}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              mt: 1.25,
              height: 6,
              borderRadius: 999,
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
              },
            }}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
        {isLoading && !data ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !data ? (
          <Typography
            sx={{ color: theme.palette.text.secondary, fontSize: "0.9rem" }}
          >
            {t("details.seasonLoadError")}
          </Typography>
        ) : (
          <Box>
            {data.episodes.map((episode, index) => {
              const isWatched = watched.isEpisodeWatched(
                episode.season_number,
                episode.episode_number
              );
              return (
                <Box key={episode.id}>
                  {index > 0 && (
                    <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.12) }} />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 1.25,
                    }}
                  >
                    <Checkbox
                      checked={isWatched}
                      onChange={() => handleEpisodeClick(episode)}
                      disabled={watched.isEpisodePending}
                      color="primary"
                      sx={{ p: 0.5 }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: theme.palette.text.secondary,
                        width: 42,
                        flexShrink: 0,
                      }}
                    >
                      {episode.episode_number < 10 ? `0${episode.episode_number}` : episode.episode_number}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        minWidth: 0,
                        pr: 1,
                        fontSize: "0.95rem",
                        color: isWatched
                          ? theme.palette.text.secondary
                          : theme.palette.text.primary,
                      }}
                    >
                      {episode.name || t("details.episodeName", { number: episode.episode_number })}
                    </Typography>
                    {episode.runtime ? (
                      <Typography
                        sx={{
                          ml:'auto',
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          fontSize: "0.85rem",
                          color: theme.palette.text.secondary,
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={15} />
                        {t("details.episodeRuntime", { minutes: episode.runtime })}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </AccordionDetails>

      <Dialog open={pending !== null} onClose={() => closePending(false)}>
        <DialogTitle>{t("details.markAsWatchedTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pending
              ? t("details.markAsWatchedBody", {
                  episode: pending.episode.episode_number,
                  earlier: earlierNumbers.map((n) => `EP${n}`).join(", "),
                })
              : ""}
          </DialogContentText>
          <FormControlLabel
            control={
              <Checkbox
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                color="primary"
              />
            }
            label={t("details.dontAskAgain")}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <OutlinedButton
            onClick={() => closePending(false)}
            disabled={watched.isEpisodePending}
          >
            {t("details.noJustEpisode", { number: pending?.episode.episode_number ?? "" })}
          </OutlinedButton>
          <ContainedButton
            onClick={() => closePending(true)}
            disabled={watched.isEpisodePending}
          >
            {t("common.yes")}
          </ContainedButton>
        </DialogActions>
      </Dialog>
    </Accordion>
  );
}
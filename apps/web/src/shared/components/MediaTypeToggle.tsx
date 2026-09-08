import { Box, alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TmdbMediaType } from "shared";

interface MediaTypeToggleProps {
  value: TmdbMediaType;
  onChange: (value: TmdbMediaType) => void;
}

const OPTIONS: { value: TmdbMediaType; labelKey: string }[] = [
  { value: "movie", labelKey: "common.mediaType.movies" },
  { value: "tv", labelKey: "common.mediaType.series" },
];

export default function MediaTypeToggle({
  value,
  onChange,
}: MediaTypeToggleProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        padding: "3px",
        borderRadius: "30px",
        backgroundColor: alpha(theme.palette.primary.main, 0.14),
      }}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Box
            key={option.value}
            onClick={() => {
              if (!active) {
                onChange(option.value);
              }
            }}
            sx={{
              padding: "5px 14px",
              borderRadius: "30px",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: active ? 700 : 500,
              color: 'white',
              backgroundColor: active
                ? theme.palette.primary.main
                : "transparent",
              transition: theme.transitions.create(
                ["background-color", "color"],
                { duration: theme.transitions.duration.short }
              ),
            }}
          >
            {t(option.labelKey)}
          </Box>
        );
      })}
    </Box>
  );
}
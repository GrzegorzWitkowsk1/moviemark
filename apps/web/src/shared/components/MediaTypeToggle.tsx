import { Box, alpha, useTheme } from "@mui/material";
import type { TmdbMediaType } from "shared";

interface MediaTypeToggleProps {
  value: TmdbMediaType;
  onChange: (value: TmdbMediaType) => void;
}

const OPTIONS: { value: TmdbMediaType; label: string }[] = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "Series" },
];

export default function MediaTypeToggle({
  value,
  onChange,
}: MediaTypeToggleProps) {
  const theme = useTheme();

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
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
}
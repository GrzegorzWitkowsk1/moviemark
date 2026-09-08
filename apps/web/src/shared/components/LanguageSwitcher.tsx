import { useState, type MouseEvent } from "react";
import { Check } from "lucide-react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLanguage, type Language } from "@/contexts/languageContext";
import GBFlag from "./flags/GBFlag";
import PLFlag from "./flags/PLFlag";

const LANGUAGES: {
  code: Language;
  labelKey: string;
  Flag: typeof GBFlag;
}[] = [
  { code: "en", labelKey: "settings.languageOptions.english", Flag: GBFlag },
  { code: "pl", labelKey: "settings.languageOptions.polish", Flag: PLFlag },
];

export default function LanguageSwitcher() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const current = LANGUAGES.find((lang) => lang.code === language) ?? LANGUAGES[0];
  const CurrentFlag = current.Flag;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label={t("settings.language")}
        title={t("settings.language")}
        size="small"
        sx={{ p: 0.75 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            lineHeight: 0,
            borderRadius: "6px",
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <CurrentFlag size={22} />
        </Box>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 190,
              borderRadius: "16px",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.secondary.darker
                  : theme.palette.primary.lighter,
              border: `1px solid ${theme.palette.secondary.light}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.24)}`,
              p: 1,
            },
          },
        }}
      >
        {LANGUAGES.map(({ code, labelKey, Flag }) => {
          const active = code === language;
          return (
            <Box
              key={code}
              onClick={() => {
                setLanguage(code);
                handleClose();
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 1,
                borderRadius: "10px",
                cursor: "pointer",
                color: theme.palette.text.primary,
                backgroundColor: active
                  ? alpha(theme.palette.primary.main, 0.12)
                  : "transparent",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
              role="menuitemradio"
              aria-checked={active}
            >
              <Box sx={{ lineHeight: 0 }}>
                <Flag size={20} />
              </Box>
              <Typography
                sx={{
                  flex: 1,
                  fontSize: "0.9rem",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {t(labelKey)}
              </Typography>
              {active && <Check size={16} color={theme.palette.primary.main} />}
            </Box>
          );
        })}
      </Popover>
    </>
  );
}
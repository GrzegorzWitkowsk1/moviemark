import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Paper, Tooltip, Typography, alpha } from "@mui/material";
import { X } from "lucide-react";

import { useUser } from "@/hooks/useAuth";
import ContainedButton from "@/shared/components/buttons/containedButton";

export const GUEST_BANNER_STORAGE_KEY = "moviemark.guestBannerDismissed";

/**
 * Dismissal is scoped to a single guest session in a single tab, so a later
 * guest always sees the notice again instead of inheriting an old choice.
 */
function dismissalKey(guestId: string): string {
  return `${GUEST_BANNER_STORAGE_KEY}.${guestId}`;
}

function readDismissed(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export default function GuestBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useUser();
  const storageKey = dismissalKey(user?.id ?? "guest");
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  if (dismissedKey === storageKey || readDismissed(storageKey)) {
    return null;
  }

  const dismiss = () => {
    setDismissedKey(storageKey);
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // ignore storage availability errors
    }
  };

  return (
    <Paper
      role="status"
      elevation={8}
      sx={(theme) => ({
        position: "fixed",
        left: { xs: 8, sm: 16 },
        right: { xs: 8, sm: 16 },
        bottom: { xs: 72, sm: 16 },
        zIndex: theme.zIndex.snackbar,
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 1.5,
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.darker : theme.palette.primary.lighter,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
      })}
    >
      <Box sx={{ flex: 1 }}>
        <Typography color="primary" variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t("auth.guestBanner.bannerTitle")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("auth.guestBanner.bannerBody")}
        </Typography>
      </Box>
      <ContainedButton
        type="button"
        onClick={() => navigate("/register")}
        sx={{ flexShrink: 0, minWidth: 140 }}
      >
        {t("auth.guestBanner.bannerAction")}
      </ContainedButton>
      <Tooltip title={t("auth.guestBanner.bannerDismiss")}>
        <IconButton
          aria-label={t("auth.guestBanner.bannerDismiss")}
          size="small"
          onClick={dismiss}
          sx={{ flexShrink: 0 }}
        >
          <X size={18} />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, alpha, keyframes, useTheme } from "@mui/material";
import { Clapperboard } from "lucide-react";

import ContainedButton from "@/shared/components/buttons/containedButton";
import logo from "@/assets/logo_clean.png";

const SPROCKET_TILE_PX = 34;
const LETTERBOX_HEIGHT = "clamp(18px, 4vh, 34px)";

const reelSpin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const sprocketScroll = keyframes`
  from { background-position: 0px 0px; }
  to   { background-position: -${SPROCKET_TILE_PX}px 0px; }
`;

const stripSweep = keyframes`
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
`;

const dotPulse = keyframes`
  from { opacity: 0.3; transform: scale(0.8); }
  to   { opacity: 1;   transform: scale(1); }
`;

const beamBreathe = keyframes`
  from { opacity: 0.14; }
  to   { opacity: 0.4; }
`;

const reducedMotion = {
  animation: "none !important",
  transition: "none !important",
};

const RIM_HOLES = Array.from({ length: 20 }, (_, index) => index);
const SPOKES = Array.from({ length: 5 }, (_, index) => index);

function looping(animation: string, frozen: boolean) {
  return frozen
    ? { animation: "none" }
    : {
        animation,
        "@media (prefers-reduced-motion: reduce)": reducedMotion,
      };
}

function FilmReel() {
  const theme = useTheme();
  const gradientId = `reel-${useId().replace(/:/g, "")}`;

  return (
    <Box
      sx={{
        width: { xs: 168, sm: 208 },
        height: { xs: 168, sm: 208 },
        willChange: "transform",
        ...looping(`${reelSpin} 7s linear infinite`, false),
      }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.palette.primary.light} />
            <stop offset="100%" stopColor={theme.palette.primary.main} />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="90"
          fill={alpha(theme.palette.common.black, 0.4)}
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
        />
        {RIM_HOLES.map((index) => (
          <g key={`hole-${index}`} transform={`rotate(${index * 18} 100 100)`}>
            <rect
              x="98"
              y="22"
              width="8"
              height="11"
              rx="2.5"
              fill={alpha(theme.palette.primary.lighter, 0.55)}
            />
          </g>
        ))}
        {SPOKES.map((index) => (
          <g key={`spoke-${index}`} transform={`rotate(${index * 72} 100 100)`}>
            <ellipse
              cx="100"
              cy="52"
              rx="16"
              ry="26"
              fill={`url(#${gradientId})`}
            />
          </g>
        ))}
        <circle cx="100" cy="100" r="18" fill={`url(#${gradientId})`} />
        <circle
          cx="100"
          cy="100"
          r="6"
          fill={alpha(theme.palette.common.black, 0.55)}
        />
      </svg>
    </Box>
  );
}

function ProjectorBeam() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        top: 0,
        left: "50%",
        width: { xs: 220, sm: 320 },
        height: { xs: 320, sm: 460 },
        transform: "translateX(-50%)",
        background: `linear-gradient(to bottom, ${alpha("#f8f3e9", 0.55)}, transparent 78%)`,
        clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
        pointerEvents: "none",
        ...looping(`${beamBreathe} 3.6s ease-in-out infinite alternate`, false),
      }}
    />
  );
}

function LetterboxBar({ top, frozen }: { top: boolean; frozen: boolean }) {
  const theme = useTheme();
  const perforation = alpha(
    theme.palette.mode === "dark" ? theme.palette.primary.lighter : "#f8f3e9",
    0.55
  );

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "fixed",
        top: top ? 0 : "auto",
        bottom: top ? "auto" : 0,
        left: 0,
        right: 0,
        height: LETTERBOX_HEIGHT,
        zIndex: 2,
        pointerEvents: "none",
        backgroundColor: alpha(theme.palette.common.black, 0.86),
        backgroundImage: `radial-gradient(circle at ${SPROCKET_TILE_PX / 2}px 50%, ${perforation} 0px, ${perforation} 4.5px, transparent 4.5px)`,
        backgroundSize: `${SPROCKET_TILE_PX}px 100%`,
        ...looping(`${sprocketScroll} 1.4s linear infinite`, frozen),
      }}
    />
  );
}

function ProgressStrip({ frozen }: { frozen: boolean }) {
  const theme = useTheme();

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        width: { xs: 210, sm: 290 },
        height: 10,
        borderRadius: "5px",
        overflow: "hidden",
        backgroundColor: alpha(theme.palette.common.black, 0.45),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: theme.palette.gradients.primary,
          willChange: "transform",
          ...looping(`${stripSweep} 1.8s ease-in-out infinite`, frozen),
        }}
      />
    </Box>
  );
}

function BootStatus({ startedAt }: { startedAt: number }) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(
    () => Math.floor((Date.now() - startedAt) / 1000)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const message =
    seconds < 5 ? t("boot.checkingConnection") : t("boot.wakingUp");

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.8,
        minHeight: 84,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "primary.main",
            ...looping(`${dotPulse} 1.4s ease-in-out infinite alternate`, false),
          }}
        />
        <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>
          {message}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: "0.85rem",
          color: "text.secondary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {t("boot.elapsed", { seconds })}
      </Typography>

      <Typography
        sx={{
          fontSize: "0.8rem",
          color: "text.secondary",
          opacity: seconds >= 8 ? 1 : 0,
          transition: "opacity 0.6s ease",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        {t("boot.thisMayTakeAMoment")}
      </Typography>
    </Box>
  );
}

export interface LoadingScreenProps {
  state: "pending" | "failed";
  onRetry?: () => void;
}

export default function LoadingScreen({ state, onRetry }: LoadingScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [startedAt] = useState(() => Date.now());

  const frozen = state === "failed";

  return (
    <Box
      aria-busy={!frozen}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 2, sm: 2.5 },
        px: 3,
        overflow: "hidden",
        backgroundColor: "background.default",
      }}
    >
      {!frozen && <ProjectorBeam />}
      <LetterboxBar top frozen={frozen} />
      <LetterboxBar top={false} frozen={frozen} />

      {frozen ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: { xs: 128, sm: 152 },
            height: { xs: 128, sm: 152 },
            borderRadius: "50%",
            border: `2px solid ${alpha(theme.palette.error.main, 0.6)}`,
            backgroundColor: alpha(theme.palette.error.main, 0.12),
          }}
        >
          <Clapperboard size={56} color={theme.palette.error.main} />
        </Box>
      ) : (
        <FilmReel />
      )}

      <Box
        component="img"
        src={logo}
        alt="MovieMark"
        sx={{
          height: { xs: 44, sm: 56 },
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
        }}
      />

      {frozen ? (
        <Box
          role="alert"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "1rem",
              textAlign: "center",
              maxWidth: 420,
            }}
          >
            {t("boot.serverUnreachable")}
          </Typography>
          <ContainedButton onClick={onRetry}>{t("boot.retry")}</ContainedButton>
        </Box>
      ) : (
        <>
          <ProgressStrip frozen={frozen} />
          <BootStatus startedAt={startedAt} />
        </>
      )}
    </Box>
  );
}

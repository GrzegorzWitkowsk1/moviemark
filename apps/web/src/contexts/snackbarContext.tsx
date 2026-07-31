import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Snackbar } from "@mui/material";
import type { AlertProps } from "@mui/material";

export type SnackbarVariant = "success" | "info" | "failure";

interface SnackbarState {
  message: string;
  variant: SnackbarVariant;
}

interface SnackbarContextValue {
  message: string | null;
  variant: SnackbarVariant | null;
  open: (message: string, variant?: SnackbarVariant) => void;
  close: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined
);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const open = useCallback((message: string, variant: SnackbarVariant = "info") => {
    setSnackbar({ message, variant });
  }, []);

  const close = useCallback(() => setSnackbar(null), []);

  const severity: AlertProps["severity"] =
    snackbar?.variant === "failure" ? "error" : snackbar?.variant ?? "info";

  const value = useMemo(
    () => ({
      message: snackbar?.message ?? null,
      variant: snackbar?.variant ?? null,
      open,
      close,
    }),
    [snackbar, open, close]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={snackbar?.variant === "success" ? 2000 : 4000}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={severity} onClose={close}>
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }

  return context;
}

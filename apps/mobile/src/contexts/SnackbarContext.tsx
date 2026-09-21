import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Snackbar } from "react-native-paper";

export type SnackbarVariant = "success" | "info" | "failure";

interface SnackbarContextValue {
  showSnackbar: (message: string, variant?: SnackbarVariant) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const VARIANT_COLORS: Record<SnackbarVariant, string> = {
  success: "#2E7D32",
  info: "#323232",
  failure: "#B3261E",
};

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<SnackbarVariant>("info");
  const [visible, setVisible] = useState(false);

  const showSnackbar = useCallback(
    (nextMessage: string, nextVariant: SnackbarVariant = "info") => {
      setMessage(nextMessage);
      setVariant(nextVariant);
      setVisible(true);
    },
    []
  );

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3500}
        style={{ backgroundColor: VARIANT_COLORS[variant] }}
        action={{ label: "OK", onPress: () => setVisible(false) }}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return context;
}

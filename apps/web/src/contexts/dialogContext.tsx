import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import SharedDialog from "@/shared/components/dialog";

interface DialogConfig {
  title: string;
  content: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "delete";
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextValue {
  openDialog: (config: DialogConfig) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const openDialog = useCallback((newConfig: DialogConfig) => {
    setConfig(newConfig);
  }, []);

  const closeDialog = useCallback(() => {
    setConfig(null);
  }, []);

  const handleCancel = useCallback(() => {
    config?.onCancel?.();
    setConfig(null);
  }, [config]);

  const handleConfirm = useCallback(() => {
    config?.onConfirm?.();
    setConfig(null);
  }, [config]);

  const value = useMemo(
    () => ({ openDialog, closeDialog }),
    [openDialog, closeDialog]
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <SharedDialog
        open={!!config}
        title={config?.title ?? ""}
        content={config?.content ?? null}
        confirmLabel={config?.confirmLabel}
        cancelLabel={config?.cancelLabel}
        variant={config?.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

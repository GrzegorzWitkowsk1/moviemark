import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

export interface DialogConfig {
  title: string;
  content?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogContextValue {
  showDialog: (config: DialogConfig) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const showDialog = useCallback((next: DialogConfig) => setConfig(next), []);
  const hideDialog = useCallback(() => setConfig(null), []);

  const value = useMemo(
    () => ({ showDialog, hideDialog }),
    [showDialog, hideDialog]
  );

  const handleCancel = () => {
    const onCancel = config?.onCancel;
    setConfig(null);
    onCancel?.();
  };

  const handleConfirm = () => {
    const onConfirm = config?.onConfirm;
    setConfig(null);
    void onConfirm?.();
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Portal>
        <Dialog visible={!!config} onDismiss={handleCancel}>
          <Dialog.Title>{config?.title}</Dialog.Title>
          {config?.content ? (
            <Dialog.Content>
              <Text variant="bodyMedium">{config.content}</Text>
            </Dialog.Content>
          ) : null}
          <Dialog.Actions>
            <Button onPress={handleCancel}>
              {config?.cancelLabel ?? t("common.cancel")}
            </Button>
            <Button onPress={handleConfirm}>
              {config?.confirmLabel ?? t("common.confirm")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}

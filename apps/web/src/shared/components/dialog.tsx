import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import ContainedButton from "./buttons/containedButton";

export interface SharedDialogProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "delete";
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function SharedDialog({
  open,
  title,
  content,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: SharedDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            backgroundColor: theme.palette.primary.dark,
            border: `1px solid ${theme.palette.secondary.darker}`,
            minWidth: 320,
            color: "#f2f0ea",
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, color: "primary.light" }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ color: "text.secondary" }}>
        {content}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <ContainedButton onClick={onCancel}>{cancelLabel}</ContainedButton>
        <ContainedButton isDelete={variant === "delete"} onClick={onConfirm}>
          {confirmLabel}
        </ContainedButton>
      </DialogActions>
    </Dialog>
  );
}

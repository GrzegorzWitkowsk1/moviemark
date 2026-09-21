import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import type { FutureToggleControls } from "core";

interface FutureToggleButtonProps {
  controls: FutureToggleControls;
  disabled?: boolean;
}

export function FutureToggleButton({
  controls,
  disabled,
}: FutureToggleButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      mode="outlined"
      disabled={disabled || controls.isPending}
      onPress={controls.toggle}
    >
      {controls.wanted ? t("details.inList") : t("details.watchInFuture")}
    </Button>
  );
}

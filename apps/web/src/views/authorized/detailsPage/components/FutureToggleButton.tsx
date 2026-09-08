import { Check, Clock } from "lucide-react";
import type { FutureToggleControls } from "@/hooks/useFuture";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";

interface FutureToggleButtonProps {
  controls: FutureToggleControls;
  disabled?: boolean;
}

export default function FutureToggleButton({
  controls,
  disabled = false,
}: FutureToggleButtonProps) {
  return (
    <OutlinedButton
      onClick={controls.toggle}
      disabled={disabled || controls.isPending}
      startIcon={
        controls.wanted ? <Check size={16} /> : <Clock size={16} />
      }
    >
      {controls.wanted ? "In list" : "Watch in future"}
    </OutlinedButton>
  );
}
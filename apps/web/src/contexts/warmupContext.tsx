import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { waitForApi, type WarmupResult } from "@/lib/warmup";

export type WarmupStatus = "checking" | "ready" | "unreachable";

interface WarmupContextValue {
  status: WarmupStatus;
  runId: number;
  retry: () => void;
}

interface WarmupOutcome {
  runId: number;
  result: WarmupResult;
}

const WarmupContext = createContext<WarmupContextValue | undefined>(undefined);

export function WarmupProvider({ children }: { children: ReactNode }) {
  const [runId, setRunId] = useState(0);
  const [outcome, setOutcome] = useState<WarmupOutcome | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void waitForApi({ signal: controller.signal }).then((result) => {
      if (active) {
        setOutcome({ runId, result });
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [runId]);

  const retry = useCallback(() => {
    setRunId((current) => current + 1);
  }, []);

  const status: WarmupStatus =
    outcome === null || outcome.runId !== runId
      ? "checking"
      : outcome.result === "ready"
        ? "ready"
        : "unreachable";

  const value = useMemo<WarmupContextValue>(
    () => ({ status, runId, retry }),
    [status, runId, retry]
  );

  return (
    <WarmupContext.Provider value={value}>{children}</WarmupContext.Provider>
  );
}

export function useWarmup() {
  const context = useContext(WarmupContext);
  if (!context) {
    throw new Error("useWarmup must be used within a WarmupProvider");
  }
  return context;
}

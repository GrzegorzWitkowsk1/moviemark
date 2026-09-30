import { config } from "./config";

export type WarmupResult = "ready" | "unreachable";

export const PROBE_TIMEOUT_MS = 15_000;
export const MAX_WAIT_MS = 90_000;
export const BACKOFF_STEPS_MS = [1_000, 2_000, 3_000, 5_000];

const HEALTH_PATH = "/health";

function backoffFor(attempt: number): number {
  const index = Math.min(attempt, BACKOFF_STEPS_MS.length - 1);
  return BACKOFF_STEPS_MS[index];
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted || ms <= 0) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      resolve();
    }

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function probeOnce(signal: AbortSignal, budgetMs: number): Promise<boolean> {
  const timeout = new AbortController();

  const onAbort = () => timeout.abort();
  signal.addEventListener("abort", onAbort, { once: true });

  const timer = setTimeout(
    () => timeout.abort(),
    Math.min(PROBE_TIMEOUT_MS, budgetMs)
  );

  try {
    const response = await fetch(`${config.apiBase}${HEALTH_PATH}`, {
      method: "GET",
      cache: "no-store",
      signal: timeout.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  }
}

export interface WaitForApiOptions {
  signal?: AbortSignal;
  maxWaitMs?: number;
}

export async function waitForApi(
  options: WaitForApiOptions = {}
): Promise<WarmupResult> {
  const { signal: externalSignal, maxWaitMs = MAX_WAIT_MS } = options;

  const controller = new AbortController();

  const forwardAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", forwardAbort, { once: true });
    }
  }

  const startedAt = Date.now();
  let attempt = 0;

  try {
    for (;;) {
      if (controller.signal.aborted) {
        return "unreachable";
      }

      const remaining = startedAt + maxWaitMs - Date.now();
      if (remaining <= 0) {
        return "unreachable";
      }

      if (await probeOnce(controller.signal, remaining)) {
        return "ready";
      }

      if (controller.signal.aborted) {
        return "unreachable";
      }

      const delay = Math.min(
        backoffFor(attempt),
        Math.max(0, startedAt + maxWaitMs - Date.now())
      );
      attempt += 1;

      await sleep(delay, controller.signal);
    }
  } finally {
    externalSignal?.removeEventListener("abort", forwardAbort);
  }
}

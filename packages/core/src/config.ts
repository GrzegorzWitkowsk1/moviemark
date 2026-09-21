export type CoreClient = "web" | "mobile";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CoreConfig {
  apiBase: string;
  client: CoreClient;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  refreshAccessToken: () => Promise<string | null>;
  translate: (key: string) => string;
  translateExists: (key: string) => boolean;
  getLanguage: () => string;
  storage: KeyValueStorage;
}

let current: CoreConfig | null = null;

export function configureCore(config: CoreConfig): void {
  current = config;
}

export function coreConfig(): CoreConfig {
  if (!current) {
    throw new Error(
      "core is not configured. Call configureCore() before using it."
    );
  }
  return current;
}

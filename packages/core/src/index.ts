export { configureCore, coreConfig } from "./config";
export type { CoreConfig, CoreClient, KeyValueStorage } from "./config";

export { apiFetch, refreshTokenOnce } from "./api/client";
export type { ApiFetchOptions } from "./api/client";
export * from "./api/endpoints";

export * from "./tmdb/client";

export * from "./hooks/auth";
export * from "./hooks/collection";
export * from "./hooks/custom";
export * from "./hooks/future";
export * from "./hooks/details";
export * from "./hooks/homeContent";
export * from "./hooks/search";
export * from "./hooks/useDebounce";

export * from "./lib/poster";
export { createQueryClient, queryClient } from "./lib/queryClient";

export { createI18n, resources, STORAGE_KEY, FALLBACK_LANGUAGE } from "./i18n";
export { default as i18n } from "./i18n";

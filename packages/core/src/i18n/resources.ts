import en from "./locales/en-GB.json";
import pl from "./locales/pl-PL.json";

export const resources = {
  en: {
    translation: en,
  },
  pl: {
    translation: pl,
  },
} as const;

export type Resources = typeof resources;

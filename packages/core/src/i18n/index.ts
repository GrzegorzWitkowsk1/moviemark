import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { KeyValueStorage } from "../config";
import { resources } from "./resources";

export const STORAGE_KEY = "moviemark-language";
export const FALLBACK_LANGUAGE = "en";

function getInitialLanguage(storage: KeyValueStorage): string {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pl") {
      return stored;
    }
  } catch {
    // ignore storage availability errors
  }
  return FALLBACK_LANGUAGE;
}

export function createI18n(storage: KeyValueStorage) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getInitialLanguage(storage),
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18n;
}

export { resources };
export default i18n;

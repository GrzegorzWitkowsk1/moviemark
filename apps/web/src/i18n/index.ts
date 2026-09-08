import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

export const STORAGE_KEY = "moviemark-language";
export const FALLBACK_LANGUAGE = "en";

function getInitialLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pl") {
      return stored;
    }
  } catch {
    // ignore storage availability errors
  }
  return FALLBACK_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
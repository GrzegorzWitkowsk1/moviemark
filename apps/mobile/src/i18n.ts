import { createI18n, type KeyValueStorage } from "core";

const memoryStorage: KeyValueStorage = {
  getItem: () => null,
  setItem: () => {},
};

const i18n = createI18n(memoryStorage);

export { STORAGE_KEY, FALLBACK_LANGUAGE } from "core";
export default i18n;

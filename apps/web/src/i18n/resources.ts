import enShared from "@/locales/en-GB.json";
import plShared from "@/locales/pl-PL.json";
import enHome from "@/views/authorized/homePage/locales/en-GB.json";
import plHome from "@/views/authorized/homePage/locales/pl-PL.json";
import enSearch from "@/views/authorized/searchPage/locales/en-GB.json";
import plSearch from "@/views/authorized/searchPage/locales/pl-PL.json";
import enCollection from "@/views/authorized/collectionPage/locales/en-GB.json";
import plCollection from "@/views/authorized/collectionPage/locales/pl-PL.json";
import enWantToWatch from "@/views/authorized/wantToWatchPage/locales/en-GB.json";
import plWantToWatch from "@/views/authorized/wantToWatchPage/locales/pl-PL.json";
import enDetails from "@/views/authorized/detailsPage/locales/en-GB.json";
import plDetails from "@/views/authorized/detailsPage/locales/pl-PL.json";
import enSettings from "@/views/authorized/settingsPage/locales/en-GB.json";
import plSettings from "@/views/authorized/settingsPage/locales/pl-PL.json";

export const resources = {
  en: {
    translation: {
      ...enShared,
      ...enHome,
      ...enSearch,
      ...enCollection,
      ...enWantToWatch,
      ...enDetails,
      ...enSettings,
    },
  },
  pl: {
    translation: {
      ...plShared,
      ...plHome,
      ...plSearch,
      ...plCollection,
      ...plWantToWatch,
      ...plDetails,
      ...plSettings,
    },
  },
} as const;

export type Resources = typeof resources;
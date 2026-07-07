import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import commonFi from "./fi/common.json";
import commonEn from "./en/common.json";
import homeFi from "./fi/home.json";
import homeEn from "./en/home.json";
import bookingFi from "./fi/booking.json";
import bookingEn from "./en/booking.json";
import adminFi from "./fi/admin.json";
import adminEn from "./en/admin.json";

export const SUPPORTED_LANGS = ["fi", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = "fi";

const resources = {
  fi: { common: commonFi, home: homeFi, booking: bookingFi, admin: adminFi },
  en: { common: commonEn, home: homeEn, booking: bookingEn, admin: adminEn },
} as const;

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const url = new URL(window.location.href);
  const q = url.searchParams.get("lang");
  if (q && (SUPPORTED_LANGS as readonly string[]).includes(q)) return q as Lang;
  const stored = window.localStorage.getItem("lang");
  if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) return stored as Lang;
  return DEFAULT_LANG;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectInitialLang(),
    fallbackLng: DEFAULT_LANG,
    defaultNS: "common",
    ns: ["common", "home"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function setLanguage(lang: Lang) {
  void i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("lang", lang);
    document.documentElement.setAttribute("lang", lang);
    const url = new URL(window.location.href);
    if (lang === DEFAULT_LANG) url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    window.history.replaceState({}, "", url.toString());
  }
}

export default i18n;

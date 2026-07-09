import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getPublicSiteContent, type LangText, type SiteContent } from "@/lib/content.functions";

const EMPTY: SiteContent = { site: {}, cards: { pitch: [], area: [], review: [] } };

export function useSiteContent() {
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => getPublicSiteContent(),
    staleTime: 60_000,
    placeholderData: EMPTY,
  });
  return data ?? EMPTY;
}

export function useLang(): "fi" | "en" {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("en") ? "en" : "fi";
}

export function pickLang(v: LangText, lang: "fi" | "en", fallback = ""): string {
  if (!v) return fallback;
  const t = (v as { fi?: string; en?: string })[lang];
  if (typeof t === "string" && t.trim()) return t;
  const fi = (v as { fi?: string }).fi;
  if (typeof fi === "string" && fi.trim()) return fi;
  return fallback;
}

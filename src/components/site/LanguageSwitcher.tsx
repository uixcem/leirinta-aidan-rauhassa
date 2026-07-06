import { useTranslation } from "react-i18next";
import { setLanguage, SUPPORTED_LANGS, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation("common");
  const current = (i18n.language as Lang) ?? "fi";
  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className={cn("flex items-center gap-1 text-[13px]", className)}
    >
      {SUPPORTED_LANGS.map((lang) => {
        const active = current === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "min-h-11 min-w-11 rounded-md px-2 font-semibold uppercase tracking-[0.14em]",
              active
                ? "text-forest underline underline-offset-4 decoration-2 decoration-ochre"
                : "text-stone hover:text-forest",
            )}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}

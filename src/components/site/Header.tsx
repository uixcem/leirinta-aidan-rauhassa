import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { AppButton } from "@/components/ui/AppButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { pickLang, useLang, useSiteContent } from "@/hooks/useSiteContent";


const NAV = [
  { to: "/", key: "nav.home" },
  { to: "/majoitus", key: "nav.accommodation" },
  { to: "/alue", key: "nav.area" },
  { to: "/hinnasto", key: "nav.pricing" },
  { to: "/saapuminen", key: "nav.arrival" },
] as const;

export function Header() {
  const { t } = useTranslation("common");
  const lang = useLang();
  const { site } = useSiteContent();
  const brandName = pickLang((site.brand as { name?: { fi?: string; en?: string } } | undefined)?.name, lang, "Järvenranta");
  const [open, setOpen] = useState(false);


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-birch/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-forest"
          aria-label={t("brand")}
        >
          Järvenranta
        </Link>

        <nav aria-label={t("nav.menu")} className="hidden md:block">
          <ul className="flex items-center gap-6 text-[15px]">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "text-forest" }}
                  inactiveProps={{ className: "text-stone hover:text-forest" }}
                  className="min-h-11 inline-flex items-center transition-colors"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <AppButton asChild variant="primary" size="md">
            <Link to="/varaa">{t("nav.book")}</Link>
          </AppButton>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-forest"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t("nav.close") : t("nav.menu")}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </Container>

      <div
        id="mobile-nav"
        hidden={!open}
        className={cn("md:hidden border-t border-forest/10 bg-birch")}
      >
        <Container className="py-4">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.to} className="border-b border-forest/10 last:border-b-0">
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block min-h-12 py-3 text-[17px] text-forest"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between">
            <LanguageSwitcher />
            <AppButton asChild variant="primary" size="md">
              <Link to="/varaa" onClick={() => setOpen(false)}>
                {t("nav.book")}
              </Link>
            </AppButton>
          </div>
        </Container>
      </div>
    </header>
  );
}

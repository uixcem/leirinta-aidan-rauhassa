import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { pickLang, useLang, useSiteContent } from "@/hooks/useSiteContent";

export function Footer() {
  const { t } = useTranslation("common");
  const lang = useLang();
  const { site } = useSiteContent();
  const brandName = pickLang(
    (site.brand as { name?: { fi?: string; en?: string } } | undefined)?.name,
    lang,
    "Järvenranta",
  );
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-forest/10 bg-birch-deep text-ink">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-forest">{brandName}</p>
          <p className="mt-2 text-sm text-stone">{t("brand.tagline")}</p>
        </div>
        <div>
          <h2 className="eyebrow mb-3">{t("footer.contact")}</h2>
          <address className="not-italic text-[15px] leading-7 text-ink">
            {t("footer.address")}
            <br />
            <a href="tel:+358405550123" className="hover:text-forest">
              {t("footer.phone")}
            </a>
            <br />
            <a href="mailto:varaus@jarvenranta.fi" className="hover:text-forest">
              {t("footer.email")}
            </a>
          </address>
        </div>
        <div>
          <h2 className="eyebrow mb-3">{t("nav.arrival")}</h2>
          <p className="text-[15px] leading-7">{t("footer.hours")}</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <LanguageSwitcher />
          <a href="#" className="text-[15px] text-lake-deep hover:text-forest">
            {t("footer.legal")}
          </a>
        </div>
      </Container>
      <div className="border-t border-forest/10">
        <Container className="flex flex-col gap-2 py-5 text-[13px] text-stone sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.copyright", { year })}</p>
          <p>{t("footer.builtWith")}</p>
        </Container>
      </div>
    </footer>
  );
}

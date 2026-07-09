import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pickLang, useLang, useSiteContent } from "@/hooks/useSiteContent";

type LangText = { fi?: string; en?: string };
type ReviewData = { text?: LangText; name?: LangText; date?: LangText };

const DEFAULTS = ["1", "2", "3"] as const;

export function ReviewsStrip() {
  const { t } = useTranslation("home");
  const lang = useLang();
  const { cards } = useSiteContent();

  const rows =
    cards.review.length > 0
      ? cards.review.slice(0, 3).map((c, i) => {
          const d = c.data as ReviewData;
          const fk = DEFAULTS[i] ?? "1";
          return {
            id: c.id,
            text: pickLang(d.text, lang, t(`reviews.${fk}.text`)),
            name: pickLang(d.name, lang, t(`reviews.${fk}.name`)),
            date: pickLang(d.date, lang, t(`reviews.${fk}.date`)),
          };
        })
      : DEFAULTS.map((k) => ({
          id: k,
          text: t(`reviews.${k}.text`),
          name: t(`reviews.${k}.name`),
          date: t(`reviews.${k}.date`),
        }));

  return (
    <Section tone="forest" ariaLabelledBy="reviews-heading">
      <Container>
        <Eyebrow tone="birch">{t("reviews.eyebrow")}</Eyebrow>
        <h2 id="reviews-heading" className="mt-3 max-w-2xl !text-birch">
          {t("reviews.title")}
        </h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {rows.map((r) => (
            <li key={r.id} className="border-t border-birch/20 pt-6">
              <blockquote className="font-display text-[19px] leading-snug text-birch">
                “{r.text}”
              </blockquote>
              <footer className="mt-4 text-[13px] uppercase tracking-[0.14em] text-birch/70">
                {r.name} · {r.date}
              </footer>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ITEMS = ["1", "2", "3"] as const;

export function ReviewsStrip() {
  const { t } = useTranslation("home");
  return (
    <Section tone="forest" ariaLabelledBy="reviews-heading">
      <Container>
        <Eyebrow tone="birch">{t("reviews.eyebrow")}</Eyebrow>
        <h2 id="reviews-heading" className="mt-3 max-w-2xl !text-birch">
          {t("reviews.title")}
        </h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {ITEMS.map((k) => (
            <li key={k} className="border-t border-birch/20 pt-6">
              <blockquote className="font-display text-[19px] leading-snug text-birch">
                “{t(`reviews.${k}.text`)}”
              </blockquote>
              <footer className="mt-4 text-[13px] uppercase tracking-[0.14em] text-birch/70">
                {t(`reviews.${k}.name`)} · {t(`reviews.${k}.date`)}
              </footer>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

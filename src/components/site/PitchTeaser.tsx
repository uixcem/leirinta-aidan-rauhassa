import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import tent from "@/assets/pitch-tent.jpg";
import caravan from "@/assets/pitch-caravan.jpg";
import cabin from "@/assets/pitch-cabin.jpg";

const CARDS = [
  { key: "tent", img: tent },
  { key: "caravan", img: caravan },
  { key: "cabin", img: cabin },
] as const;

export function PitchTeaser() {
  const { t } = useTranslation("home");
  return (
    <Section tone="birch-deep" ariaLabelledBy="pitch-heading">
      <Container>
        <Eyebrow>{t("pitch.eyebrow")}</Eyebrow>
        <h2 id="pitch-heading" className="mt-3 max-w-xl">
          {t("pitch.title")}
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {CARDS.map(({ key, img }) => (
            <li
              key={key}
              className="group flex flex-col overflow-hidden rounded-xl border border-forest/10 bg-white shadow-[var(--shadow-soft)]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-birch-deep">
                <img
                  src={img}
                  alt={t(`pitch.${key}.imgAlt`)}
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h3 className="text-forest">{t(`pitch.${key}.title`)}</h3>
                <p className="text-[15px] leading-relaxed text-ink/85">
                  {t(`pitch.${key}.body`)}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-ochre-deep">
                  {t(`pitch.${key}.price`)}
                </p>
                <Link
                  to="/majoitus"
                  className="mt-auto inline-flex min-h-11 items-center gap-1 pt-2 text-[15px] font-semibold text-forest"
                >
                  {t("pitch.cta")}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

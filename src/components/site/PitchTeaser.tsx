import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import tent from "@/assets/pitch-tent.jpg";
import caravan from "@/assets/pitch-caravan.jpg";
import cabin from "@/assets/pitch-cabin.jpg";
import { pickLang, useLang, useSiteContent } from "@/hooks/useSiteContent";

const DEFAULT_IMAGES = [tent, caravan, cabin];
const DEFAULT_KEYS = ["tent", "caravan", "cabin"] as const;

type LangText = { fi?: string; en?: string };
type PitchData = { title?: LangText; body?: LangText; price?: LangText };

export function PitchTeaser() {
  const { t } = useTranslation("home");
  const lang = useLang();
  const { cards } = useSiteContent();

  const rows =
    cards.pitch.length > 0
      ? cards.pitch.slice(0, 3).map((c, i) => {
          const d = c.data as PitchData;
          const fallbackKey = DEFAULT_KEYS[i] ?? "tent";
          return {
            id: c.id,
            image: c.image_url && c.image_url.trim() ? c.image_url : DEFAULT_IMAGES[i] ?? tent,
            title: pickLang(d.title, lang, t(`pitch.${fallbackKey}.title`)),
            body: pickLang(d.body, lang, t(`pitch.${fallbackKey}.body`)),
            price: pickLang(d.price, lang, t(`pitch.${fallbackKey}.price`)),
            alt: pickLang(d.title, lang, t(`pitch.${fallbackKey}.imgAlt`)),
          };
        })
      : DEFAULT_KEYS.map((k, i) => ({
          id: k,
          image: DEFAULT_IMAGES[i],
          title: t(`pitch.${k}.title`),
          body: t(`pitch.${k}.body`),
          price: t(`pitch.${k}.price`),
          alt: t(`pitch.${k}.imgAlt`),
        }));

  return (
    <Section tone="birch-deep" ariaLabelledBy="pitch-heading">
      <Container>
        <Eyebrow>{t("pitch.eyebrow")}</Eyebrow>
        <h2 id="pitch-heading" className="mt-3 max-w-xl">
          {t("pitch.title")}
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-forest/10 bg-white shadow-[var(--shadow-soft)]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-birch-deep">
                <img
                  src={r.image}
                  alt={r.alt}
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h3 className="text-forest">{r.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink/85">{r.body}</p>
                <p className="mt-1 text-[14px] font-semibold text-ochre-deep">{r.price}</p>
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

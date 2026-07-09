import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pickLang, useLang, useSiteContent } from "@/hooks/useSiteContent";

type LangText = { fi?: string; en?: string };
type AreaData = { title?: LangText; body?: LangText };

const DEFAULTS = ["1", "2", "3", "4"] as const;

export function AreaHighlights() {
  const { t } = useTranslation("home");
  const lang = useLang();
  const { cards } = useSiteContent();

  const rows =
    cards.area.length > 0
      ? cards.area.map((c, i) => {
          const d = c.data as AreaData;
          const fk = DEFAULTS[i] ?? "1";
          return {
            id: c.id,
            title: pickLang(d.title, lang, t(`area.${fk}.title`)),
            body: pickLang(d.body, lang, t(`area.${fk}.body`)),
          };
        })
      : DEFAULTS.map((k) => ({
          id: k,
          title: t(`area.${k}.title`),
          body: t(`area.${k}.body`),
        }));

  return (
    <Section tone="birch" ariaLabelledBy="area-heading">
      <Container>
        <Eyebrow>{t("area.eyebrow")}</Eyebrow>
        <h2 id="area-heading" className="mt-3 max-w-2xl">
          {t("area.title")}
        </h2>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {rows.map((r, i) => (
            <li key={r.id} className="flex gap-5 border-t border-forest/10 pt-6">
              <span
                aria-hidden
                className="font-display text-2xl font-semibold text-ochre-deep tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-forest">{r.title}</h3>
                <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink/85">
                  {r.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ITEMS = ["1", "2", "3", "4"] as const;

export function AreaHighlights() {
  const { t } = useTranslation("home");
  return (
    <Section tone="birch" ariaLabelledBy="area-heading">
      <Container>
        <Eyebrow>{t("area.eyebrow")}</Eyebrow>
        <h2 id="area-heading" className="mt-3 max-w-2xl">
          {t("area.title")}
        </h2>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {ITEMS.map((k, i) => (
            <li key={k} className="flex gap-5 border-t border-forest/10 pt-6">
              <span
                aria-hidden
                className="font-display text-2xl font-semibold text-ochre-deep tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-forest">{t(`area.${k}.title`)}</h3>
                <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink/85">
                  {t(`area.${k}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

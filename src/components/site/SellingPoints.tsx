import { useTranslation } from "react-i18next";
import { Trees, Flame, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ITEMS = [
  { key: "1", Icon: Trees },
  { key: "2", Icon: Flame },
  { key: "3", Icon: MapPin },
] as const;

export function SellingPoints() {
  const { t } = useTranslation("home");
  return (
    <Section tone="birch" ariaLabelledBy="usp-heading">
      <Container>
        <Eyebrow>{t("usp.eyebrow")}</Eyebrow>
        <h2 id="usp-heading" className="mt-3 max-w-2xl">
          {t("usp.1.title")} · {t("usp.2.title")} · {t("usp.3.title")}
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {ITEMS.map(({ key, Icon }) => (
            <li key={key} className="flex flex-col gap-3">
              <Icon
                aria-hidden
                className="h-8 w-8 text-ochre-deep"
                strokeWidth={1.5}
              />
              <h3 className="text-forest">{t(`usp.${key}.title`)}</h3>
              <p className="prose-body text-[16px] text-ink/85">
                {t(`usp.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

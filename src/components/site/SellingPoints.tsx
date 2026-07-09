import { useTranslation } from "react-i18next";
import { Trees, Flame, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pickLang, useLang, useSiteContent } from "@/hooks/useSiteContent";

type LangText = { fi?: string; en?: string };
type UspValue = {
  eyebrow?: LangText;
  items?: Array<{ title?: LangText; body?: LangText }>;
};

const ICONS = [Trees, Flame, MapPin] as const;

export function SellingPoints() {
  const { t } = useTranslation("home");
  const lang = useLang();
  const { site } = useSiteContent();
  const usp = (site.usp as UspValue | undefined) ?? {};
  const items = usp.items ?? [];

  const item = (i: number) => ({
    title: pickLang(items[i]?.title, lang, t(`usp.${i + 1}.title`)),
    body: pickLang(items[i]?.body, lang, t(`usp.${i + 1}.body`)),
  });
  const one = item(0), two = item(1), three = item(2);

  return (
    <Section tone="birch" ariaLabelledBy="usp-heading">
      <Container>
        <Eyebrow>{pickLang(usp.eyebrow, lang, t("usp.eyebrow"))}</Eyebrow>
        <h2 id="usp-heading" className="mt-3 max-w-2xl">
          {one.title} · {two.title} · {three.title}
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {[one, two, three].map((it, i) => {
            const Icon = ICONS[i];
            return (
              <li key={i} className="flex flex-col gap-3">
                <Icon aria-hidden className="h-8 w-8 text-ochre-deep" strokeWidth={1.5} />
                <h3 className="text-forest">{it.title}</h3>
                <p className="prose-body text-[16px] text-ink/85">{it.body}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

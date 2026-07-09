import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CardsSection } from "@/components/admin/CardsSection";

export const Route = createFileRoute("/_authenticated/admin/sisalto/majoitukset")({
  component: PitchesCms,
});

function PitchesCms() {
  const { t } = useTranslation("admin");
  return (
    <CardsSection
      section="pitch"
      showImage
      title={t("cms.pitches.title")}
      help={t("cms.pitches.help")}
      fields={[
        { key: "title", label: t("cms.cards.title") },
        { key: "body", label: t("cms.cards.body"), multiline: true },
        { key: "price", label: t("cms.cards.price") },
      ]}
    />
  );
}

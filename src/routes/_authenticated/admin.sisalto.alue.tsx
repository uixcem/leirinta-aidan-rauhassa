import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CardsSection } from "@/components/admin/CardsSection";

export const Route = createFileRoute("/_authenticated/admin/sisalto/alue")({
  component: AreaCms,
});

function AreaCms() {
  const { t } = useTranslation("admin");
  return (
    <CardsSection
      section="area"
      showImage={false}
      title={t("cms.area.title")}
      help={t("cms.area.help")}
      fields={[
        { key: "title", label: t("cms.cards.title") },
        { key: "body", label: t("cms.cards.body"), multiline: true },
      ]}
    />
  );
}

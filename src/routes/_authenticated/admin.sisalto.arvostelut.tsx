import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CardsSection } from "@/components/admin/CardsSection";

export const Route = createFileRoute("/_authenticated/admin/sisalto/arvostelut")({
  component: ReviewsCms,
});

function ReviewsCms() {
  const { t } = useTranslation("admin");
  return (
    <CardsSection
      section="review"
      showImage={false}
      title={t("cms.reviews.title2")}
      help={t("cms.reviews.help")}
      fields={[
        { key: "text", label: t("cms.reviews.text"), multiline: true },
        { key: "name", label: t("cms.reviews.name") },
        { key: "date", label: t("cms.reviews.date") },
      ]}
    />
  );
}

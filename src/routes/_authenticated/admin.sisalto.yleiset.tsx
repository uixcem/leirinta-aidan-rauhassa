import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { adminGetSiteContent, adminUpsertSiteContent } from "@/lib/content.functions";
import { BilingualField, CmsPageHeader, SaveBar } from "@/components/admin/CmsBits";

export const Route = createFileRoute("/_authenticated/admin/sisalto/yleiset")({
  component: GeneralCms,
});

type LangText = { fi?: string; en?: string };
type BrandValue = { name?: LangText };

function GeneralCms() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-site-content"],
    queryFn: () => adminGetSiteContent(),
  });
  const [brand, setBrand] = useState<BrandValue>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (data) setBrand((data.brand as BrandValue) ?? {});
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      adminUpsertSiteContent({ data: { key: "brand", value: brand as Record<string, unknown> } }),
    onSuccess: () => {
      setMsg(t("cms.saved"));
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin-site-content"] });
      qc.invalidateQueries({ queryKey: ["site-content"] });
      setTimeout(() => setMsg(null), 4000);
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="space-y-6">
      <CmsPageHeader title={t("cms.general.title")} help={t("cms.general.help")} />
      <BilingualField
        label={t("cms.general.brand")}
        value={brand.name}
        onChange={(v) => setBrand({ ...brand, name: v })}
      />
      <p className="text-[14px] text-stone">
        Alatunnisteen yhteystiedot muokataan välilehdellä <strong>Asetukset → Yritys</strong>.
      </p>
      <SaveBar
        onSave={() => save.mutate()}
        saving={save.isPending}
        savedMessage={msg}
        errorMessage={err}
      />
    </div>
  );
}

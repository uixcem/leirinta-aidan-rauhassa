import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { AppButton } from "@/components/ui/AppButton";
import { Field } from "@/components/ui/Field";
import { getCompanySettings, saveCompanySettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/asetukset")({
  component: SettingsPage,
});

type Settings = {
  company_name: string;
  address_line: string;
  postal_code: string;
  city: string;
  country: string;
  business_id: string;
  vat_rate: number;
  iban: string;
  bic: string;
  phone: string;
  email: string;
  website: string;
  invoice_prefix: string;
  payment_terms_days: number;
};

const empty: Settings = {
  company_name: "",
  address_line: "",
  postal_code: "",
  city: "",
  country: "Suomi",
  business_id: "",
  vat_rate: 14,
  iban: "",
  bic: "",
  phone: "",
  email: "",
  website: "",
  invoice_prefix: "JR",
  payment_terms_days: 14,
};

function SettingsPage() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const getFn = useServerFn(getCompanySettings);
  const saveFn = useServerFn(saveCompanySettings);
  const q = useQuery({ queryKey: ["admin", "company"], queryFn: () => getFn() });
  const [s, setS] = useState<Settings>(empty);

  useEffect(() => {
    if (q.data) setS({ ...empty, ...q.data });
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "company"] }),
  });

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  if (q.isLoading) return <div className="h-40 animate-pulse rounded-xl bg-white" />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="max-w-3xl space-y-8"
    >
      <div className="rounded-xl border border-forest/10 bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-forest">{t("settings.company")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            wrapperClassName="md:col-span-2"
            label={t("settings.companyName")}
            value={s.company_name}
            onChange={(e) => set("company_name", e.target.value)}
          />
          <Field
            wrapperClassName="md:col-span-2"
            label={t("settings.address")}
            value={s.address_line}
            onChange={(e) => set("address_line", e.target.value)}
          />
          <Field
            label={t("settings.postalCode")}
            value={s.postal_code}
            onChange={(e) => set("postal_code", e.target.value)}
          />
          <Field label={t("settings.city")} value={s.city} onChange={(e) => set("city", e.target.value)} />
          <Field label={t("settings.country")} value={s.country} onChange={(e) => set("country", e.target.value)} />
          <Field
            label={t("settings.businessId")}
            value={s.business_id}
            onChange={(e) => set("business_id", e.target.value)}
          />
          <Field label="Puhelin" value={s.phone} onChange={(e) => set("phone", e.target.value)} />
          <Field label="Email" type="email" value={s.email} onChange={(e) => set("email", e.target.value)} />
          <Field
            wrapperClassName="md:col-span-2"
            label={t("settings.website")}
            value={s.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-forest/10 bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-forest">{t("settings.invoice")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label={t("settings.invoicePrefix")}
            value={s.invoice_prefix}
            onChange={(e) => set("invoice_prefix", e.target.value)}
          />
          <Field
            label={t("settings.paymentTerms")}
            type="number"
            min={0}
            value={s.payment_terms_days}
            onChange={(e) => set("payment_terms_days", Number(e.target.value))}
          />
          <Field
            label={t("settings.vatRate")}
            type="number"
            step="0.1"
            min={0}
            value={s.vat_rate}
            onChange={(e) => set("vat_rate", Number(e.target.value))}
          />
          <Field label={t("settings.iban")} value={s.iban} onChange={(e) => set("iban", e.target.value)} />
          <Field label={t("settings.bic")} value={s.bic} onChange={(e) => set("bic", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <AppButton type="submit" size="lg" disabled={save.isPending}>
          {save.isPending ? "…" : t("settings.save")}
        </AppButton>
      </div>
      {save.isSuccess ? (
        <p className="text-right text-[13px] text-forest">{t("settings.saved")}</p>
      ) : null}
    </form>
  );
}

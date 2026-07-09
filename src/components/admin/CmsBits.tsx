import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type LangValue = { fi?: string; en?: string };

export function BilingualField({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string;
  value: LangValue | undefined;
  onChange: (v: LangValue) => void;
  multiline?: boolean;
  hint?: string;
}) {
  const { t } = useTranslation("admin");
  const [tab, setTab] = useState<"fi" | "en">("fi");
  const v = value ?? {};

  return (
    <div className="rounded-lg border border-forest/15 bg-white p-4">
      <label className="block text-[15px] font-semibold text-forest">{label}</label>
      {hint && <p className="mt-1 text-[13px] text-stone">{hint}</p>}
      <div className="mt-3 inline-flex overflow-hidden rounded-md border border-forest/20">
        {(["fi", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={cn(
              "min-h-10 px-4 text-[14px] font-medium",
              tab === l ? "bg-forest text-birch" : "bg-white text-stone",
            )}
          >
            {t(l === "fi" ? "cms.langFi" : "cms.langEn")}
          </button>
        ))}
      </div>
      {multiline ? (
        <textarea
          rows={4}
          value={v[tab] ?? ""}
          onChange={(e) => onChange({ ...v, [tab]: e.target.value })}
          className="mt-3 block min-h-28 w-full resize-y rounded-md border border-forest/20 bg-white px-3 py-3 text-[16px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-forest"
        />
      ) : (
        <input
          type="text"
          value={v[tab] ?? ""}
          onChange={(e) => onChange({ ...v, [tab]: e.target.value })}
          className="mt-3 block w-full rounded-md border border-forest/20 bg-white px-3 py-3 text-[16px] text-ink focus:outline-none focus:ring-2 focus:ring-forest"
        />
      )}

    </div>
  );
}

export function SaveBar({
  onSave,
  saving,
  savedMessage,
  errorMessage,
  extra,
}: {
  onSave: () => void;
  saving: boolean;
  savedMessage: string | null;
  errorMessage: string | null;
  extra?: ReactNode;
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-forest/15 bg-white/95 px-4 py-4 backdrop-blur">
      <div className="min-h-6 text-[14px]" aria-live="polite">
        {savedMessage && <span className="text-forest">✓ {savedMessage}</span>}
        {errorMessage && <span className="text-red-700">{errorMessage}</span>}
      </div>
      <div className="flex items-center gap-3">
        {extra}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex min-h-12 items-center rounded-md bg-forest px-6 text-[16px] font-semibold text-birch hover:bg-forest-deep disabled:opacity-60"
        >
          {saving ? t("cms.saving") : t("cms.save")}
        </button>
      </div>
    </div>
  );
}

export function CmsPageHeader({ title, help }: { title: string; help: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-forest">{title}</h2>
      <p className="mt-2 max-w-2xl text-[15px] text-ink/80">{help}</p>
    </div>
  );
}

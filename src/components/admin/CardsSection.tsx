import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  adminDeleteCard,
  adminListCards,
  adminUpsertCard,
  type ContentCard,
} from "@/lib/content.functions";
import { BilingualField, CmsPageHeader } from "@/components/admin/CmsBits";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { useState } from "react";

type Section = "pitch" | "area" | "review";

type LangText = { fi?: string; en?: string };

type CardData = {
  title?: LangText;
  body?: LangText;
  price?: LangText;
  text?: LangText;
  name?: LangText;
  date?: LangText;
};

export function CardsSection({
  section,
  fields,
  showImage,
  title,
  help,
}: {
  section: Section;
  fields: Array<{ key: keyof CardData; label: string; multiline?: boolean }>;
  showImage: boolean;
  title: string;
  help: string;
}) {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const { data: cards } = useQuery({
    queryKey: ["admin-cards", section],
    queryFn: () => adminListCards({ data: { section } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-cards", section] });
    qc.invalidateQueries({ queryKey: ["site-content"] });
  };

  const upsert = useMutation({
    mutationFn: (c: Partial<ContentCard>) =>
      adminUpsertCard({
        data: {
          id: c.id,
          section,
          sort_order: c.sort_order ?? 99,
          is_visible: c.is_visible ?? true,
          image_url: c.image_url ?? null,
          data: (c.data as Record<string, unknown>) ?? {},
        },
      }),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCard({ data: { id } }),
    onSuccess: invalidate,
  });

  const addNew = () => {
    upsert.mutate({
      section,
      sort_order: (cards?.length ?? 0) + 1,
      is_visible: true,
      image_url: null,
      data: {},
    });
  };

  return (
    <div>
      <CmsPageHeader title={title} help={help} />
      <div className="space-y-6">
        {(cards ?? []).map((c) => (
          <CardEditor
            key={c.id}
            card={c}
            fields={fields}
            showImage={showImage}
            onSave={(patch) => upsert.mutate({ ...c, ...patch })}
            onDelete={() => {
              if (confirm(t("cms.cards.confirmDelete"))) del.mutate(c.id);
            }}
            saving={upsert.isPending}
          />
        ))}
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={addNew}
          className="inline-flex min-h-12 items-center rounded-md border-2 border-dashed border-forest/40 bg-white px-6 text-[16px] font-semibold text-forest hover:bg-birch-deep"
        >
          + {t("cms.cards.new")}
        </button>
      </div>
    </div>
  );
}

function CardEditor({
  card,
  fields,
  showImage,
  onSave,
  onDelete,
  saving,
}: {
  card: ContentCard;
  fields: Array<{ key: keyof CardData; label: string; multiline?: boolean }>;
  showImage: boolean;
  onSave: (patch: Partial<ContentCard>) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation("admin");
  const [local, setLocal] = useState<ContentCard>(card);
  const [msg, setMsg] = useState<string | null>(null);
  const dirty = JSON.stringify(local) !== JSON.stringify(card);

  const patchData = (k: keyof CardData, v: LangText) =>
    setLocal({ ...local, data: { ...(local.data as CardData), [k]: v } as Record<string, unknown> });

  return (
    <div className="rounded-xl border border-forest/15 bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-[15px] text-forest">
          <input
            type="checkbox"
            checked={local.is_visible}
            onChange={(e) => setLocal({ ...local, is_visible: e.target.checked })}
            className="h-5 w-5"
          />
          {t("cms.cards.visible")}
        </label>
        <label className="inline-flex items-center gap-2 text-[14px] text-stone">
          {t("cms.cards.sort")}
          <input
            type="number"
            value={local.sort_order}
            onChange={(e) => setLocal({ ...local, sort_order: Number(e.target.value) })}
            className="w-20 rounded-md border border-forest/20 px-2 py-1 text-center"
          />
        </label>
      </div>

      {showImage && (
        <div className="mb-4">
          <MediaUpload
            kind="image"
            accept="image/*"
            label={t("cms.cards.image")}
            value={local.image_url}
            onChange={(url) => setLocal({ ...local, image_url: url })}
          />
        </div>
      )}

      <div className="space-y-3">
        {fields.map((f) => (
          <BilingualField
            key={f.key}
            label={f.label}
            multiline={f.multiline}
            value={(local.data as CardData)[f.key]}
            onChange={(v) => patchData(f.key, v)}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDelete}
          className="min-h-11 rounded-md border border-red-300 px-4 text-[14px] text-red-700 hover:bg-red-50"
        >
          {t("cms.cards.delete")}
        </button>
        <div className="flex items-center gap-3">
          {msg && <span className="text-[14px] text-forest">✓ {msg}</span>}
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => {
              onSave(local);
              setMsg(t("cms.saved"));
              setTimeout(() => setMsg(null), 3000);
            }}
            className="inline-flex min-h-11 items-center rounded-md bg-forest px-5 text-[15px] font-semibold text-birch hover:bg-forest-deep disabled:opacity-50"
          >
            {saving ? t("cms.saving") : t("cms.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

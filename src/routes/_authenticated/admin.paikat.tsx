import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { AppButton } from "@/components/ui/AppButton";
import { Field } from "@/components/ui/Field";
import { deletePitch, listAllPitches, upsertPitch } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/paikat")({
  component: PitchesPage,
});

type PitchType = "tent" | "motorhome" | "caravan" | "cabin";
type Pitch = {
  id: string;
  name: string;
  pitch_type: PitchType;
  capacity: number;
  price_per_night: number;
  has_electricity: boolean;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

const empty: Pitch = {
  id: "",
  name: "",
  pitch_type: "tent",
  capacity: 2,
  price_per_night: 25,
  has_electricity: false,
  description: "",
  is_active: true,
  sort_order: 0,
};

function PitchesPage() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const list = useServerFn(listAllPitches);
  const save = useServerFn(upsertPitch);
  const del = useServerFn(deletePitch);
  const q = useQuery({ queryKey: ["admin", "pitches-all"], queryFn: () => list() });
  const [editing, setEditing] = useState<Pitch | null>(null);

  const saveMut = useMutation({
    mutationFn: (p: Pitch) =>
      save({
        data: {
          ...(p.id ? { id: p.id } : {}),
          name: p.name,
          pitch_type: p.pitch_type,
          capacity: p.capacity,
          price_per_night: p.price_per_night,
          has_electricity: p.has_electricity,
          description: p.description || null,
          is_active: p.is_active,
          sort_order: p.sort_order,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pitches-all"] });
      setEditing(null);
    },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pitches-all"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-forest">{t("dashboard.pitches")}</h2>
        <AppButton onClick={() => setEditing({ ...empty })}>{t("pitches.new")}</AppButton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-forest/10 bg-white shadow-[var(--shadow-soft)]">
        {q.isLoading ? (
          <div className="h-40 animate-pulse bg-birch-deep" />
        ) : (
          <table className="w-full text-[14px]">
            <thead className="bg-birch-deep/50 text-left text-[12px] uppercase tracking-wider text-stone">
              <tr>
                <th className="px-4 py-3">{t("pitches.name")}</th>
                <th className="px-4 py-3">{t("pitches.type")}</th>
                <th className="px-4 py-3">{t("pitches.capacity")}</th>
                <th className="px-4 py-3">{t("pitches.price")}</th>
                <th className="px-4 py-3">{t("pitches.electricity")}</th>
                <th className="px-4 py-3">{t("pitches.active")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {((q.data ?? []) as Pitch[]).map((p) => (
                <tr key={p.id} className="hover:bg-birch/40">
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3">{p.pitch_type}</td>
                  <td className="px-4 py-3">{p.capacity}</td>
                  <td className="px-4 py-3">{Number(p.price_per_night).toFixed(2)} €</td>
                  <td className="px-4 py-3">{p.has_electricity ? "✓" : "—"}</td>
                  <td className="px-4 py-3">{p.is_active ? "✓" : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded-md border border-forest/20 px-3 py-1.5 text-[12px] text-forest hover:bg-birch"
                      >
                        {t("pitches.edit")}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t("pitches.confirmDelete"))) delMut.mutate(p.id);
                        }}
                        className="rounded-md border border-full/40 px-3 py-1.5 text-[12px] text-full hover:bg-full/10"
                      >
                        {t("pitches.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing ? (
        <PitchForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => saveMut.mutate(p)}
          saving={saveMut.isPending}
        />
      ) : null}
    </div>
  );
}

function PitchForm({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: Pitch;
  onClose: () => void;
  onSave: (p: Pitch) => void;
  saving: boolean;
}) {
  const { t } = useTranslation("admin");
  const [p, setP] = useState<Pitch>(initial);
  const set = <K extends keyof Pitch>(k: K, v: Pitch[K]) => setP((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(p);
        }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
      >
        <h2 className="text-forest">{p.id ? t("pitches.edit") : t("pitches.new")}</h2>
        <div className="mt-4 space-y-4">
          <Field label={t("pitches.name")} value={p.name} onChange={(e) => set("name", e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone">
                {t("pitches.type")}
              </label>
              <select
                value={p.pitch_type}
                onChange={(e) => set("pitch_type", e.target.value as PitchType)}
                className="min-h-11 rounded-md border border-forest/20 bg-white px-3 text-[15px]"
              >
                <option value="tent">Teltta</option>
                <option value="motorhome">Matkailuauto</option>
                <option value="caravan">Matkailuvaunu</option>
                <option value="cabin">Mökki</option>
              </select>
            </div>
            <Field
              label={t("pitches.capacity")}
              type="number"
              min={1}
              max={20}
              value={p.capacity}
              onChange={(e) => set("capacity", Number(e.target.value))}
            />
            <Field
              label={t("pitches.price")}
              type="number"
              step="0.01"
              min={0}
              value={p.price_per_night}
              onChange={(e) => set("price_per_night", Number(e.target.value))}
            />
            <Field
              label={t("pitches.sortOrder")}
              type="number"
              min={0}
              value={p.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone">
              {t("pitches.description")}
            </label>
            <textarea
              value={p.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="rounded-md border border-forest/20 bg-white p-3 text-[15px]"
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={p.has_electricity}
                onChange={(e) => set("has_electricity", e.target.checked)}
              />
              {t("pitches.electricity")}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={p.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              {t("pitches.active")}
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <AppButton type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </AppButton>
          <AppButton type="submit" disabled={saving}>
            {saving ? "…" : t("pitches.save")}
          </AppButton>
        </div>
      </form>
    </div>
  );
}

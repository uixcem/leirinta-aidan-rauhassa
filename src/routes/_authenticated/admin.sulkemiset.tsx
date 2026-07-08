import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { AppButton } from "@/components/ui/AppButton";
import { Field } from "@/components/ui/Field";
import { createClosure, deleteClosure, listAllPitches, listClosures } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/sulkemiset")({
  component: ClosuresPage,
});

function ClosuresPage() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const listFn = useServerFn(listClosures);
  const pitchesFn = useServerFn(listAllPitches);
  const createFn = useServerFn(createClosure);
  const delFn = useServerFn(deleteClosure);

  const closures = useQuery({ queryKey: ["admin", "closures"], queryFn: () => listFn() });
  const pitches = useQuery({ queryKey: ["admin", "pitches-all"], queryFn: () => pitchesFn() });

  const [pitchId, setPitchId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: { pitch_id: pitchId, starts_on: start, ends_on: end, reason: reason || null },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "closures"] });
      setPitchId("");
      setStart("");
      setEnd("");
      setReason("");
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "closures"] }),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="rounded-xl border border-forest/10 bg-white p-6 shadow-[var(--shadow-soft)]"
      >
        <h2 className="text-forest">{t("closures.new")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone">
              {t("calendar.pitch")}
            </label>
            <select
              required
              value={pitchId}
              onChange={(e) => setPitchId(e.target.value)}
              className="min-h-11 rounded-md border border-forest/20 bg-white px-3 text-[15px]"
            >
              <option value="">—</option>
              {(pitches.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Field
            label={t("closures.starts")}
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Field
            label={t("closures.ends")}
            type="date"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
          <Field
            label={t("closures.reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <AppButton type="submit" disabled={create.isPending}>
            {create.isPending ? "…" : t("closures.add")}
          </AppButton>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-forest/10 bg-white shadow-[var(--shadow-soft)]">
        {closures.isLoading ? (
          <div className="h-40 animate-pulse bg-birch-deep" />
        ) : (closures.data ?? []).length === 0 ? (
          <p className="p-8 text-center text-stone">{t("closures.empty")}</p>
        ) : (
          <table className="w-full text-[14px]">
            <thead className="bg-birch-deep/50 text-left text-[12px] uppercase tracking-wider text-stone">
              <tr>
                <th className="px-4 py-3">{t("calendar.pitch")}</th>
                <th className="px-4 py-3">{t("closures.starts")}</th>
                <th className="px-4 py-3">{t("closures.ends")}</th>
                <th className="px-4 py-3">{t("closures.reason")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {(closures.data ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-birch/40">
                  <td className="px-4 py-3">
                    {(c as { pitch?: { name?: string } }).pitch?.name}
                  </td>
                  <td className="px-4 py-3">{c.starts_on}</td>
                  <td className="px-4 py-3">{c.ends_on}</td>
                  <td className="px-4 py-3 text-stone">{c.reason ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => del.mutate(c.id)}
                      className="rounded-md border border-full/40 px-3 py-1.5 text-[12px] text-full hover:bg-full/10"
                    >
                      {t("pitches.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

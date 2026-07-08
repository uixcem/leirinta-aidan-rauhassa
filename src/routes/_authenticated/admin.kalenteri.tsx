import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { getCalendarMonth } from "@/lib/admin.functions";
import { AppButton } from "@/components/ui/AppButton";

export const Route = createFileRoute("/_authenticated/admin/kalenteri")({
  component: CalendarPage,
});

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function CalendarPage() {
  const { t } = useTranslation("admin");
  const fn = useServerFn(getCalendarMonth);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const month = monthKey(cursor);

  const q = useQuery({
    queryKey: ["admin", "calendar", month],
    queryFn: () => fn({ data: { month } }),
  });

  const days = useMemo(() => {
    if (!q.data) return [];
    return Array.from({ length: q.data.daysInMonth }, (_, i) => i + 1);
  }, [q.data]);

  const cellStatus = (pitchId: string, day: number) => {
    if (!q.data) return null;
    const iso = `${month}-${String(day).padStart(2, "0")}`;
    const booking = q.data.bookings.find(
      (b) => b.pitch_id === pitchId && b.check_in <= iso && iso < b.check_out,
    );
    if (booking)
      return { kind: "booking" as const, label: booking.guest_name, ref: booking.booking_reference };
    const closure = q.data.closures.find(
      (c) => c.pitch_id === pitchId && c.starts_on <= iso && iso < c.ends_on,
    );
    if (closure) return { kind: "closure" as const, label: closure.reason ?? "Suljettu" };
    return null;
  };

  const shift = (delta: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AppButton variant="ghost" onClick={() => shift(-1)}>
          ←
        </AppButton>
        <h2 className="min-w-[140px] text-center text-forest">
          {cursor.toLocaleDateString("fi-FI", { month: "long", year: "numeric" })}
        </h2>
        <AppButton variant="ghost" onClick={() => shift(1)}>
          →
        </AppButton>
        <div className="ml-auto flex gap-3 text-[12px]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-forest" /> {t("calendar.booked")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-full/70" /> {t("calendar.closed")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border border-forest/20 bg-white" />{" "}
            {t("calendar.free")}
          </span>
        </div>
      </div>

      {q.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      ) : !q.data || q.data.pitches.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-stone">{t("calendar.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-forest/10 bg-white shadow-[var(--shadow-soft)]">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[140px] border-b border-r border-forest/10 bg-white px-3 py-2 text-left">
                  {t("calendar.pitch")}
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className="border-b border-forest/10 bg-birch-deep/30 px-1 py-2 text-center font-semibold text-stone"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.data.pitches.map((p) => (
                <tr key={p.id}>
                  <td className="sticky left-0 z-10 border-b border-r border-forest/10 bg-white px-3 py-2 font-semibold text-ink">
                    {p.name}
                    <div className="text-[11px] font-normal text-stone">{p.pitch_type}</div>
                  </td>
                  {days.map((d) => {
                    const s = cellStatus(p.id, d);
                    return (
                      <td
                        key={d}
                        title={s ? `${s.label}${"ref" in s ? " · " + s.ref : ""}` : ""}
                        className={
                          "h-8 min-w-[24px] border-b border-r border-forest/5 text-center " +
                          (s?.kind === "booking"
                            ? "bg-forest text-white"
                            : s?.kind === "closure"
                              ? "bg-full/60"
                              : "bg-white")
                        }
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

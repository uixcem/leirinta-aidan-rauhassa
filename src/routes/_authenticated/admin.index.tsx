import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { getDashboardStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-forest/10 bg-white p-5 shadow-[var(--shadow-soft)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none text-forest">{value}</p>
      {hint ? <p className="mt-1 text-[13px] text-stone">{hint}</p> : null}
    </div>
  );
}

function DashboardPage() {
  const { t } = useTranslation("admin");
  const fn = useServerFn(getDashboardStats);
  const q = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fn() });

  if (q.isLoading) return <div className="h-40 animate-pulse rounded-xl bg-white" />;
  if (!q.data) return null;
  const s = q.data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.arrivalsToday")} value={s.arrivalsToday.length} />
        <StatCard label={t("stats.departuresToday")} value={s.departuresToday.length} />
        <StatCard label={t("stats.currentlyStaying")} value={s.currentlyStaying} />
        <StatCard
          label={t("stats.occupancyMonth")}
          value={`${s.occupancyMonth}%`}
          hint={t("stats.activePitches", { n: s.activePitches })}
        />
        <StatCard
          label={t("stats.revenueMonth")}
          value={`${s.revenueMonth.toFixed(0)} €`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard title={t("stats.arrivalsToday")} empty={t("stats.none")}>
          {s.arrivalsToday.map((b) => (
            <li key={b.id} className="flex justify-between border-b border-forest/5 py-2 last:border-b-0">
              <span>{b.guest_name}</span>
              <span className="text-[13px] text-stone">
                {(b as { pitch?: { name?: string } }).pitch?.name} · {b.booking_reference}
              </span>
            </li>
          ))}
        </ListCard>
        <ListCard title={t("stats.departuresToday")} empty={t("stats.none")}>
          {s.departuresToday.map((b) => (
            <li key={b.id} className="flex justify-between border-b border-forest/5 py-2 last:border-b-0">
              <span>{b.guest_name}</span>
              <span className="text-[13px] text-stone">
                {(b as { pitch?: { name?: string } }).pitch?.name} · {b.booking_reference}
              </span>
            </li>
          ))}
        </ListCard>
      </div>

      <div className="rounded-xl border border-forest/10 bg-white p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <h2 className="text-forest">{t("stats.upcoming")}</h2>
          <Link to="/admin/varaukset" className="text-[13px] font-semibold text-forest underline">
            {t("stats.viewAll")}
          </Link>
        </div>
        <ul className="mt-4">
          {s.upcoming.length === 0 ? (
            <li className="py-4 text-center text-stone">{t("stats.none")}</li>
          ) : (
            s.upcoming.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-forest/5 py-3 last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-ink">{b.guest_name}</p>
                  <p className="text-[13px] text-stone">
                    {b.check_in} → {b.check_out} ·{" "}
                    {(b as { pitch?: { name?: string } }).pitch?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[13px] text-stone">{b.booking_reference}</p>
                  <p className="font-semibold text-forest">{Number(b.total_price).toFixed(0)} €</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function ListCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="rounded-xl border border-forest/10 bg-white p-5 shadow-[var(--shadow-soft)]">
      <h3 className="text-forest">{title}</h3>
      <ul className="mt-3">{hasContent ? children : <li className="py-4 text-center text-stone">{empty}</li>}</ul>
    </div>
  );
}

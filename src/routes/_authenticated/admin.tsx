import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { AppButton } from "@/components/ui/AppButton";
import { supabase } from "@/integrations/supabase/client";
import { listBookings, updateBookingStatus } from "@/lib/admin.functions";

const STATUSES = ["pending", "confirmed", "checked_in", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Ylläpito — Järvenranta" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
  errorComponent: ({ error, reset }) => (
    <Container className="py-16"><p className="text-full">{error.message}</p><AppButton onClick={reset}>Retry</AppButton></Container>
  ),
  notFoundComponent: () => <Container className="py-16">Ei löytynyt</Container>,
});

function AdminPage() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const list = useServerFn(listBookings);
  const upd = useServerFn(updateBookingStatus);

  const q = useQuery({ queryKey: ["admin", "bookings"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: Status }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("dashboard.title")}</p>
          <h1>{t("dashboard.bookings")}</h1>
        </div>
        <AppButton variant="ghost" onClick={signOut}>
          {t("dashboard.signOut")}
        </AppButton>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-forest/10 bg-white shadow-[var(--shadow-soft)]">
        {q.isLoading ? (
          <div className="h-40 animate-pulse bg-birch-deep" />
        ) : !q.data || q.data.length === 0 ? (
          <p className="p-8 text-center text-stone">{t("bookings.empty")}</p>
        ) : (
          <table className="w-full text-[14px]">
            <thead className="bg-birch-deep/50 text-left text-[12px] uppercase tracking-wider text-stone">
              <tr>
                <th className="px-4 py-3">{t("bookings.col.reference")}</th>
                <th className="px-4 py-3">{t("bookings.col.dates")}</th>
                <th className="px-4 py-3">{t("bookings.col.pitch")}</th>
                <th className="px-4 py-3">{t("bookings.col.guest")}</th>
                <th className="px-4 py-3">{t("bookings.col.total")}</th>
                <th className="px-4 py-3">{t("bookings.col.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {q.data.map((b) => (
                <tr key={b.id} className="hover:bg-birch/40">
                  <td className="px-4 py-3 font-mono text-[13px]">{b.booking_reference}</td>
                  <td className="px-4 py-3">
                    {b.check_in} → {b.check_out}
                    <div className="text-[12px] text-stone">{b.nights} yötä</div>
                  </td>
                  <td className="px-4 py-3">
                    {b.pitch?.name}
                    <div className="text-[12px] text-stone">{b.pitch?.pitch_type}</div>
                  </td>
                  <td className="px-4 py-3">
                    {b.guest_name}
                    <div className="text-[12px] text-stone">{b.guest_email}</div>
                    <div className="text-[12px] text-stone">{b.guest_phone}</div>
                  </td>
                  <td className="px-4 py-3">{Number(b.total_price)} €</td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) =>
                        mut.mutate({ id: b.id, status: e.target.value as Status })
                      }
                      className="min-h-9 rounded-md border border-forest/20 bg-white px-2 text-[13px]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`status.${s}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { AppButton } from "@/components/ui/AppButton";
import { Field } from "@/components/ui/Field";
import {
  listBookings,
  updateBookingStatus,
  updateBookingNotes,
  getInvoicePdf,
} from "@/lib/admin.functions";

const STATUSES = ["pending", "confirmed", "checked_in", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export const Route = createFileRoute("/_authenticated/admin/varaukset")({
  component: BookingsPage,
});

type Booking = {
  id: string;
  booking_reference: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  vehicle_plate: string | null;
  special_requests: string | null;
  admin_notes: string | null;
  status: Status;
  total_price: number;
  nights: number;
  created_at: string;
  pitch: { id: string; name: string; pitch_type: string; price_per_night: number } | null;
};

function downloadBase64(base64: string, filename: string, mime: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function BookingsPage() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const list = useServerFn(listBookings);
  const upd = useServerFn(updateBookingStatus);
  const invoice = useServerFn(getInvoicePdf);

  const q = useQuery({ queryKey: ["admin", "bookings"], queryFn: () => list() });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const mut = useMutation({
    mutationFn: (v: { id: string; status: Status }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  const invMut = useMutation({
    mutationFn: (id: string) => invoice({ data: { id } }),
    onSuccess: (r) => downloadBase64(r.base64, r.filename, "application/pdf"),
  });

  const filtered = useMemo(() => {
    const data = (q.data ?? []) as unknown as Booking[];
    const term = search.trim().toLowerCase();
    return data.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!term) return true;
      return [b.booking_reference, b.guest_name, b.guest_email, b.guest_phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [q.data, search, statusFilter]);

  const exportCsv = () => {
    const rows = [
      ["Varaus", "Check-in", "Check-out", "Yöt", "Paikka", "Vieras", "Email", "Puhelin", "Tila", "Yhteensä"],
      ...filtered.map((b) => [
        b.booking_reference,
        b.check_in,
        b.check_out,
        String(b.nights),
        b.pitch?.name ?? "",
        b.guest_name,
        b.guest_email,
        b.guest_phone,
        b.status,
        String(b.total_price),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `varaukset-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label={t("bookings.search")}
          placeholder={t("bookings.searchPh") ?? ""}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          wrapperClassName="flex-1 min-w-[220px]"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone">
            {t("bookings.col.status")}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
            className="min-h-11 rounded-md border border-forest/20 bg-white px-3 text-[15px]"
          >
            <option value="all">{t("bookings.all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <AppButton variant="ghost" onClick={exportCsv}>
          {t("bookings.exportCsv")}
        </AppButton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-forest/10 bg-white shadow-[var(--shadow-soft)]">
        {q.isLoading ? (
          <div className="h-40 animate-pulse bg-birch-deep" />
        ) : filtered.length === 0 ? (
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filtered.map((b) => (
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
                  <td className="px-4 py-3">{Number(b.total_price).toFixed(0)} €</td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => mut.mutate({ id: b.id, status: e.target.value as Status })}
                      className="min-h-9 rounded-md border border-forest/20 bg-white px-2 text-[13px]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`status.${s}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelected(b)}
                        className="rounded-md border border-forest/20 px-3 py-1.5 text-[12px] font-semibold text-forest hover:bg-birch"
                      >
                        {t("bookings.view")}
                      </button>
                      <button
                        onClick={() => invMut.mutate(b.id)}
                        disabled={invMut.isPending}
                        className="rounded-md bg-forest px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {invMut.isPending && invMut.variables === b.id
                          ? "…"
                          : t("bookings.invoice")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <BookingModal booking={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function BookingModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const saveNotes = useServerFn(updateBookingNotes);
  const invoice = useServerFn(getInvoicePdf);
  const [notes, setNotes] = useState(booking.admin_notes ?? "");

  const notesMut = useMutation({
    mutationFn: () => saveNotes({ data: { id: booking.id, admin_notes: notes } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  const invMut = useMutation({
    mutationFn: () => invoice({ data: { id: booking.id } }),
    onSuccess: (r) => downloadBase64(r.base64, r.filename, "application/pdf"),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{booking.booking_reference}</p>
            <h2 className="text-forest">{booking.guest_name}</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-stone hover:text-ink">
            ×
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone">
              {t("bookings.col.dates")}
            </dt>
            <dd>
              {booking.check_in} → {booking.check_out} ({booking.nights} yötä)
            </dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone">
              {t("bookings.col.pitch")}
            </dt>
            <dd>
              {booking.pitch?.name} ({booking.pitch?.pitch_type})
            </dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone">
              {t("bookings.guests")}
            </dt>
            <dd>
              {booking.adults} aikuista, {booking.children} lasta
            </dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone">
              {t("bookings.col.total")}
            </dt>
            <dd className="font-semibold text-forest">
              {Number(booking.total_price).toFixed(2)} €
            </dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone">Email</dt>
            <dd>{booking.guest_email}</dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone">Puhelin</dt>
            <dd>{booking.guest_phone}</dd>
          </div>
          {booking.vehicle_plate ? (
            <div>
              <dt className="text-[12px] uppercase tracking-wider text-stone">
                {t("bookings.plate")}
              </dt>
              <dd>{booking.vehicle_plate}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone">
              {t("bookings.col.status")}
            </dt>
            <dd>{t(`status.${booking.status}`)}</dd>
          </div>
        </dl>

        {booking.special_requests ? (
          <div className="mt-4 rounded-md bg-birch p-3 text-[14px]">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-stone">
              {t("bookings.requests")}
            </p>
            <p>{booking.special_requests}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone">
            {t("bookings.adminNotes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-md border border-forest/20 p-3 text-[14px]"
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <AppButton variant="ghost" onClick={() => invMut.mutate()} disabled={invMut.isPending}>
            {invMut.isPending ? "…" : t("bookings.invoice")}
          </AppButton>
          <AppButton onClick={() => notesMut.mutate()} disabled={notesMut.isPending}>
            {notesMut.isPending ? "…" : t("bookings.saveNotes")}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

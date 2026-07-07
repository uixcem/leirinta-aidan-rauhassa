import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Container } from "@/components/ui/Container";
import { AppButton } from "@/components/ui/AppButton";
import { Field } from "@/components/ui/Field";
import { searchAvailability, createBooking } from "@/lib/booking.functions";
import { cn } from "@/lib/utils";

type StayType = "tent" | "motorhome" | "caravan" | "cabin";
const STAY_TYPES: readonly StayType[] = ["tent", "motorhome", "caravan", "cabin"];

type Search = {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  stayType?: StayType;
};

function isoDate(offset = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const Route = createFileRoute("/varaa")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    checkIn: typeof s.checkIn === "string" ? s.checkIn : undefined,
    checkOut: typeof s.checkOut === "string" ? s.checkOut : undefined,
    adults: typeof s.adults === "number" ? s.adults : undefined,
    children: typeof s.children === "number" ? s.children : undefined,
    stayType:
      typeof s.stayType === "string" && (STAY_TYPES as readonly string[]).includes(s.stayType)
        ? (s.stayType as StayType)
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Varaa — Järvenranta Camping" },
      { name: "description", content: "Tarkista vapaat paikat ja varaa suoraan." },
    ],
  }),
  component: BookPage,
  errorComponent: ({ error, reset }) => (
    <Container className="py-16 text-center">
      <h1>Virhe</h1>
      <p className="mt-2 text-stone">{error.message}</p>
      <AppButton className="mt-6" onClick={reset}>Yritä uudelleen</AppButton>
    </Container>
  ),
  notFoundComponent: () => <Container className="py-16">Ei löytynyt</Container>,
});

function BookPage() {
  const { t } = useTranslation("booking");
  const search = Route.useSearch();
  const navigate = useNavigate();

  const checkIn = search.checkIn || isoDate(1);
  const checkOut = search.checkOut || isoDate(3);
  const adults = search.adults ?? 2;
  const children = search.children ?? 0;

  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut + "T00:00:00Z").getTime() -
        new Date(checkIn + "T00:00:00Z").getTime()) /
        86400000,
    ),
  );

  const searchFn = useServerFn(searchAvailability);
  const availQuery = useQuery({
    queryKey: ["availability", checkIn, checkOut, search.stayType ?? "any"],
    queryFn: () =>
      searchFn({ data: { checkIn, checkOut, stayType: search.stayType } }),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPitch = availQuery.data?.find((p) => p.pitch_id === selectedId) ?? null;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("title")}</p>
          <h1 className="mt-1">{t("results.title")}</h1>
          <p className="mt-2 text-[15px] text-stone">
            {t("summary.dates", { nights, checkIn, checkOut })} · {t("summary.guests", { adults, children })}
          </p>
        </div>
        <Link
          to="/"
          className="text-[14px] font-medium text-forest underline underline-offset-4 hover:text-forest-deep"
        >
          ← {t("search.editSearch")}
        </Link>
      </div>

      {selectedPitch ? (
        <BookingForm
          pitch={selectedPitch}
          nights={nights}
          checkIn={checkIn}
          checkOut={checkOut}
          adults={adults}
          childrenCount={children}
          onBack={() => setSelectedId(null)}
          onSuccess={(ref, email) =>
            navigate({ to: "/varaa/kiitos", search: { ref, email } })
          }
        />
      ) : (
        <ResultsList
          loading={availQuery.isLoading}
          rows={availQuery.data ?? []}
          nights={nights}
          onSelect={setSelectedId}
        />
      )}
    </Container>
  );
}

type PitchRow = {
  pitch_id: string;
  name: string;
  pitch_type: StayType;
  capacity: number;
  price_per_night: number;
  has_electricity: boolean;
  description: string | null;
};

function ResultsList({
  loading,
  rows,
  nights,
  onSelect,
}: {
  loading: boolean;
  rows: PitchRow[];
  nights: number;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("booking");
  if (loading) {
    return (
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-birch-deep" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-forest/10 bg-white p-8 text-center">
        <h2 className="text-forest">{t("results.empty.title")}</h2>
        <p className="mt-2 text-stone">{t("results.empty.body")}</p>
      </div>
    );
  }
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
      {rows.map((p) => {
        const total = Number(p.price_per_night) * nights;
        return (
          <li
            key={p.pitch_id}
            className="flex flex-col rounded-xl border border-forest/10 bg-white p-5 shadow-[var(--shadow-soft)]"
          >
            <p className="eyebrow">{t(`type.${p.pitch_type}`)}</p>
            <h3 className="mt-1 text-forest">{p.name}</h3>
            {p.description ? (
              <p className="mt-2 text-[14px] text-stone">{p.description}</p>
            ) : null}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink/70">
              <li>{t("results.capacity", { capacity: p.capacity })}</li>
              {p.has_electricity ? <li>{t("results.electricity")}</li> : null}
            </ul>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[13px] text-stone">
                  {t("results.pricePerNight", { price: Number(p.price_per_night) })}
                </p>
                <p className="font-display text-lg font-semibold text-forest">
                  {t("results.totalPrice", { price: total })}
                </p>
              </div>
              <AppButton onClick={() => onSelect(p.pitch_id)}>
                {t("results.select")}
              </AppButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BookingForm({
  pitch,
  nights,
  checkIn,
  checkOut,
  adults,
  childrenCount,
  onBack,
  onSuccess,
}: {
  pitch: PitchRow;
  nights: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenCount: number;
  onBack: () => void;
  onSuccess: (ref: string, email: string) => void;
}) {
  const { t } = useTranslation("booking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [requests, setRequests] = useState("");
  const total = Number(pitch.price_per_night) * nights;

  const createFn = useServerFn(createBooking);
  type CreateInput = Parameters<typeof createBooking>[0] extends { data: infer D } ? D : never;
  const mutation = useMutation({
    mutationFn: (data: CreateInput) => createFn({ data }),
    onSuccess: (_res) => onSuccess(_res.bookingReference, email.toLowerCase()),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      pitchId: pitch.pitch_id,
      checkIn,
      checkOut,
      adults,
      children: childrenCount,
      guestName: name.trim(),
      guestEmail: email.trim(),
      guestPhone: phone.trim(),
      vehiclePlate: plate.trim() || null,
      specialRequests: requests.trim() || null,
    });
  };

  const errorMsg = mutation.error
    ? (mutation.error as Error).message.includes("PITCH_UNAVAILABLE")
      ? t("error.unavailable")
      : t("error.generic")
    : null;

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <div className="rounded-xl border border-forest/10 bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-forest">{t("form.title")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label={t("form.name")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            wrapperClassName="sm:col-span-2"
            autoComplete="name"
          />
          <Field
            label={t("form.email")}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Field
            label={t("form.phone")}
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <Field
            label={t("form.plate")}
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            hint={t("form.plateHelp")}
            wrapperClassName="sm:col-span-2"
          />
          <label className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone">
              {t("form.requests")}
            </span>
            <textarea
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              rows={3}
              maxLength={1000}
              className="rounded-md border border-forest/20 bg-white px-3 py-2 text-[15px] text-ink focus:border-forest"
            />
          </label>
        </div>

        {errorMsg ? (
          <p className="mt-4 rounded-md bg-full/10 p-3 text-[14px] font-medium text-full">
            {errorMsg}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 rounded-md px-4 text-[14px] font-medium text-forest hover:bg-birch-deep"
          >
            ← {t("form.back")}
          </button>
          <AppButton type="submit" size="lg" disabled={mutation.isPending} className="ml-auto">
            {mutation.isPending ? t("form.submitting") : t("form.submit")}
          </AppButton>
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-forest/10 bg-birch-deep/60 p-6">
        <p className="eyebrow">{t("form.selected")}</p>
        <h3 className="mt-1 text-forest">{pitch.name}</h3>
        <p className="mt-1 text-[14px] text-stone">{t(`type.${pitch.pitch_type}`)}</p>
        <dl className="mt-5 space-y-2 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-stone">{t("thanks.dates")}</dt>
            <dd className="text-ink">{checkIn} → {checkOut}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{t("thanks.guests")}</dt>
            <dd className="text-ink">{adults} + {childrenCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">Yötä</dt>
            <dd className="text-ink">{nights}</dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-forest/15 pt-4">
          <p className="text-[13px] text-stone">{t("form.total")}</p>
          <p className="font-display text-2xl font-semibold text-forest">{total} €</p>
          <p className="mt-2 text-[12px] text-stone">{t("form.payNote")}</p>
        </div>
      </aside>
    </form>
  );
}

// prevent unused warning in future refactors
export { cn };

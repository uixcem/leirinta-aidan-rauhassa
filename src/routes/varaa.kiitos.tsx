import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { AppButton } from "@/components/ui/AppButton";
import { getBookingByReference } from "@/lib/booking.functions";
import { CheckCircle2, Printer } from "lucide-react";

type Search = { ref?: string; email?: string };

export const Route = createFileRoute("/varaa/kiitos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({ meta: [{ title: "Kiitos varauksesta — Järvenranta Camping" }, { name: "robots", content: "noindex" }] }),
  component: ThanksPage,
  errorComponent: ({ error, reset }) => (
    <Container className="py-16 text-center">
      <p className="text-stone">{error.message}</p>
      <AppButton className="mt-6" onClick={reset}>Yritä uudelleen</AppButton>
    </Container>
  ),
  notFoundComponent: () => <Container className="py-16">Ei löytynyt</Container>,
});

function ThanksPage() {
  const { t } = useTranslation("booking");
  const { ref, email } = Route.useSearch();
  const navigate = useNavigate();
  const lookup = useServerFn(getBookingByReference);

  useEffect(() => {
    if (!ref || !email) void navigate({ to: "/" });
  }, [ref, email, navigate]);

  const q = useQuery({
    queryKey: ["booking", ref, email],
    queryFn: () => lookup({ data: { reference: ref!, email: email! } }),
    enabled: !!ref && !!email,
  });

  const b = q.data;

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-forest/15 bg-white p-8 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-9 w-9 shrink-0 text-forest" strokeWidth={1.75} />
            <div>
              <h1 className="text-forest">{t("thanks.title")}</h1>
              <p className="mt-2 text-stone">{t("thanks.body")}</p>
            </div>
          </div>

          {q.isLoading ? (
            <div className="mt-8 h-40 animate-pulse rounded-lg bg-birch-deep" />
          ) : b ? (
            <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-forest/10 pt-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone">
                  {t("thanks.reference")}
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-forest">
                  {b.booking_reference}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-stone">{t("thanks.pitch")}</dt>
                <dd className="text-ink">
                  {b.pitch?.name} · {t(`type.${b.pitch?.pitch_type ?? "tent"}`)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-stone">{t("thanks.dates")}</dt>
                <dd className="text-ink">
                  {b.check_in} → {b.check_out} · {b.nights} yötä
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-stone">{t("thanks.guests")}</dt>
                <dd className="text-ink">
                  {b.adults} aikuista, {b.children} lasta
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-stone">{t("thanks.total")}</dt>
                <dd className="font-display text-lg font-semibold text-forest">
                  {Number(b.total_price)} €
                </dd>
              </div>
            </dl>
          ) : null}

          <p className="mt-6 rounded-md bg-birch-deep/60 p-4 text-[14px] text-ink/80">
            {t("thanks.payNote")}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <AppButton variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> {t("thanks.print")}
            </AppButton>
            <AppButton asChild variant="ghost">
              <Link to="/">{t("thanks.home")}</Link>
            </AppButton>
          </div>
        </div>
      </div>
    </Container>
  );
}

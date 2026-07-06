import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { Field } from "@/components/ui/Field";
import { AppButton } from "@/components/ui/AppButton";

function isoTomorrow(offset = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function AvailabilityQuickCheck() {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const today = useMemo(() => isoTomorrow(0), []);
  const [checkIn, setCheckIn] = useState(isoTomorrow(1));
  const [checkOut, setCheckOut] = useState(isoTomorrow(3));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void navigate({
      to: "/varaa",
      search: { checkIn, checkOut, adults, children },
    });
  };

  return (
    <Container className="relative z-10 -mt-16 sm:-mt-20">
      <form
        id="quick-check"
        onSubmit={onSubmit}
        aria-label={t("quick.title")}
        className="rounded-xl border border-forest/10 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7"
      >
        <h2 className="font-display text-xl font-semibold text-forest">
          {t("quick.title")}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Field
            label={t("quick.checkIn")}
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
          <Field
            label={t("quick.checkOut")}
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
          <Field
            label={t("quick.adults")}
            type="number"
            min={1}
            max={12}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          />
          <Field
            label={t("quick.children")}
            type="number"
            min={0}
            max={10}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
          />
          <AppButton type="submit" size="lg" className="w-full lg:w-auto">
            {t("quick.submit")}
          </AppButton>
        </div>
        <p className="mt-4 text-[13px] text-stone">{t("quick.note")}</p>
      </form>
    </Container>
  );
}

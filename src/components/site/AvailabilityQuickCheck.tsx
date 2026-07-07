import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Tent, Caravan, Truck, Home } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Field } from "@/components/ui/Field";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/utils";

function isoTomorrow(offset = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const STAY_TYPES = ["tent", "motorhome", "caravan", "cabin"] as const;
export type StayType = (typeof STAY_TYPES)[number];

const STAY_ICONS: Record<StayType, typeof Tent> = {
  tent: Tent,
  motorhome: Caravan,
  caravan: Truck,
  cabin: Home,
};

export function AvailabilityQuickCheck() {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const today = useMemo(() => isoTomorrow(0), []);
  const [checkIn, setCheckIn] = useState(isoTomorrow(1));
  const [checkOut, setCheckOut] = useState(isoTomorrow(3));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [stayType, setStayType] = useState<StayType>("tent");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void navigate({
      to: "/varaa",
      search: { checkIn, checkOut, adults, children, stayType },
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

        <fieldset className="mt-5">
          <legend className="text-[13px] font-semibold uppercase tracking-[0.06em] text-stone">
            {t("quick.stayType.legend")}
          </legend>
          <div
            role="radiogroup"
            aria-label={t("quick.stayType.legend")}
            className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {STAY_TYPES.map((type) => {
              const Icon = STAY_ICONS[type];
              const selected = stayType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setStayType(type)}
                  className={cn(
                    "flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-[13px] font-medium transition-colors",
                    selected
                      ? "border-forest bg-forest text-birch shadow-[var(--shadow-soft)]"
                      : "border-forest/15 bg-birch/40 text-ink/80 hover:border-forest/40 hover:bg-birch",
                  )}
                >
                  <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                  <span>{t(`quick.stayType.${type}`)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

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

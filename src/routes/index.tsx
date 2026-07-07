import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/site/Hero";
import { AvailabilityQuickCheck } from "@/components/site/AvailabilityQuickCheck";
import { SellingPoints } from "@/components/site/SellingPoints";
import { PitchTeaser } from "@/components/site/PitchTeaser";
import { AreaHighlights } from "@/components/site/AreaHighlights";
import { ReviewsStrip } from "@/components/site/ReviewsStrip";

type StayType = "tent" | "motorhome" | "caravan" | "cabin";
type QuickCheckSearch = {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  stayType?: StayType;
};

const STAY_TYPES: readonly StayType[] = ["tent", "motorhome", "caravan", "cabin"];

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): QuickCheckSearch => ({
    checkIn: typeof s.checkIn === "string" ? s.checkIn : undefined,
    checkOut: typeof s.checkOut === "string" ? s.checkOut : undefined,
    adults: typeof s.adults === "number" ? s.adults : undefined,
    children: typeof s.children === "number" ? s.children : undefined,
    stayType:
      typeof s.stayType === "string" && (STAY_TYPES as readonly string[]).includes(s.stayType)
        ? (s.stayType as StayType)
        : undefined,
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <AvailabilityQuickCheck />
      <SellingPoints />
      <PitchTeaser />
      <AreaHighlights />
      <ReviewsStrip />
    </>
  );
}

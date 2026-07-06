import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  tone = "birch",
  id,
  ariaLabelledBy,
}: {
  children: ReactNode;
  className?: string;
  tone?: "birch" | "birch-deep" | "forest";
  id?: string;
  ariaLabelledBy?: string;
}) {
  const bg =
    tone === "forest"
      ? "bg-forest text-birch"
      : tone === "birch-deep"
        ? "bg-birch-deep text-ink"
        : "bg-birch text-ink";
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn("py-16 sm:py-24", bg, className)}
    >
      {children}
    </section>
  );
}

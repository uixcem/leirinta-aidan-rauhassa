import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  tone = "ochre",
}: {
  children: ReactNode;
  className?: string;
  tone?: "ochre" | "birch";
}) {
  return (
    <p
      className={cn(
        "eyebrow",
        tone === "birch" ? "!text-birch/80" : undefined,
        className,
      )}
    >
      {children}
    </p>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const Component = As as React.ElementType;
  return (
    <Component className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </Component>
  );
}

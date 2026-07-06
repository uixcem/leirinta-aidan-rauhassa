import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const appButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-colors disabled:opacity-50 disabled:pointer-events-none rounded-md",
  {
    variants: {
      variant: {
        primary: "bg-forest text-birch hover:bg-forest-deep",
        secondary:
          "bg-birch text-forest border border-forest/20 hover:bg-birch-deep",
        ghost: "text-forest hover:bg-birch-deep",
        accent: "bg-ochre text-ink hover:brightness-95",
      },
      size: {
        md: "min-h-11 px-5 text-[15px]",
        lg: "min-h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof appButtonVariants> {
  asChild?: boolean;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(appButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
AppButton.displayName = "AppButton";

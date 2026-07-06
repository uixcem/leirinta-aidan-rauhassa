import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export function Field({
  label,
  hint,
  error,
  id,
  wrapperClassName,
  className,
  ...props
}: FieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-11 rounded-md border border-forest/20 bg-white px-3 text-[15px] text-ink placeholder:text-stone",
          "focus:border-forest",
          error && "border-full",
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-[13px] text-stone">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-[13px] font-medium text-full">
          {error}
        </p>
      ) : null}
    </div>
  );
}

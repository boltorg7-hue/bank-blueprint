import * as React from "react";

import { cn } from "@/lib/utils";
import { currencySymbol, parseAmountInput } from "@/lib/format/currency";
import { BRAND } from "@/config/brand";

/**
 * Numeric money field (PROMPT 01 §22).
 * - mobile numeric keypad
 * - tabular figures
 * - currency adornment
 * - reports the parsed decimal value; never performs arithmetic
 */
export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> {
  value: string;
  onValueChange: (raw: string, parsed: number | null) => void;
  currency?: string;
  /** Overrides the currency adornment (e.g. a non-ISO unit such as USDT). */
  unitLabel?: string | undefined;
  invalid?: boolean;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onValueChange,
      currency = BRAND.locale.currency,
      unitLabel,
      invalid,
      className,
      ...props
    },
    ref,
  ) => {
    const symbol = unitLabel ?? currencySymbol(currency);


    return (
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-md border bg-surface px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          invalid ? "border-danger" : "border-input",
          className,
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            const raw = event.target.value;
            onValueChange(raw, parseAmountInput(raw));
          }}
          className="text-amount min-w-0 flex-1 bg-transparent outline-none placeholder:font-normal placeholder:text-muted-foreground"
          placeholder="0,00"
          {...props}
        />
        <span aria-hidden="true" className="text-heading-sm text-muted-foreground">
          {symbol}
        </span>
      </div>
    );
  },
);
MoneyInput.displayName = "MoneyInput";

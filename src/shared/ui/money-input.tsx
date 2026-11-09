import { CURRENCY_INFO, type CurrencyCode } from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

/**
 * An amount field with the currency symbol inside it ("₹ 12,000",
 * "AED 4,500"). Text input with a decimal keypad on phones; the form's Zod
 * schema parses what's typed (parseAmount).
 */
export function MoneyInput({
  currency,
  wrapperClassName,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type" | "inputMode"> & {
  currency: CurrencyCode;
  /** Classes for the wrapper (grid placement). */
  wrapperClassName?: string;
}) {
  const { symbol } = CURRENCY_INFO[currency];
  return (
    <div className={cn("relative", wrapperClassName)}>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
      >
        {symbol}
      </span>
      <Input
        inputMode="decimal"
        placeholder="0"
        {...props}
        className={cn("text-right tabular-nums", className)}
        // Room for the symbol, however long it is ("₹" vs "AED").
        style={{ ...style, paddingLeft: `calc(0.9rem + ${symbol.length}ch)` }}
      />
    </div>
  );
}

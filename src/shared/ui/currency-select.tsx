"use client";

import {
  CURRENCIES,
  currencyLabel,
  type CurrencyCode,
} from "@/shared/lib/currency";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";

/**
 * Currency picker. With `defaultOption`, an empty first choice means "use the
 * default" (e.g. "Use my default (INR)").
 */
export function CurrencySelect({
  value,
  onChange,
  defaultOption,
  ...props
}: Omit<React.ComponentProps<typeof NativeSelect>, "value" | "onChange"> & {
  value: CurrencyCode | "";
  onChange: (value: CurrencyCode | "") => void;
  defaultOption?: string;
}) {
  return (
    <NativeSelect
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode | "")}
    >
      {defaultOption && (
        <NativeSelectOption value="">{defaultOption}</NativeSelectOption>
      )}
      {CURRENCIES.map((code) => (
        <NativeSelectOption key={code} value={code}>
          {currencyLabel(code)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

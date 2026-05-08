import * as React from "react"
import { Input } from "@/components/ui/input"

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string | number
  onValueChange: (value: string) => void
  allowNegative?: boolean
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, allowNegative = false, ...props }, ref) => {
    // Format for display
    let displayValue = ""
    if (value !== undefined && value !== null && value !== "") {
      const strValue = String(value)
      if (strValue === "-") {
        displayValue = "-"
      } else {
        const num = Number(strValue)
        displayValue = isNaN(num) ? strValue : num.toLocaleString("id-ID")
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value
      
      if (allowNegative) {
        rawValue = rawValue.replace(/[^0-9-]/g, "").replace(/(?!^)-/g, "")
      } else {
        rawValue = rawValue.replace(/\D/g, "")
      }

      onValueChange(rawValue)
    }

    return (
      <Input
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        inputMode="numeric"
        className={className}
        {...props}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }

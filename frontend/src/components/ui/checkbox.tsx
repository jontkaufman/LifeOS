"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

function Checkbox({ className, checked, onCheckedChange, disabled, id }: CheckboxProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center justify-center cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked ?? false}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="size-4 shrink-0 cursor-pointer rounded-sm accent-primary"
      />
    </label>
  )
}

export { Checkbox }
export type { CheckboxProps }

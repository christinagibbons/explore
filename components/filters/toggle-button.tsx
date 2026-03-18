"use client"

import { cn } from "@/lib/utils"

export interface ToggleButtonProps {
  /** Display text for the toggle chip. */
  label: string
  /** Whether this chip is currently active/selected. */
  isSelected: boolean
  /** Callback fired when the chip is clicked. */
  onClick: () => void
}

/**
 * A single toggle chip used inside filter groups.
 * Renders as a small pill-shaped button that toggles between
 * a selected (filled) and unselected (outlined) state.
 */
export function ToggleButton({ label, isSelected, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded border transition-colors",
        isSelected
          ? "bg-slate-500 text-white border-slate-500 dark:bg-slate-600 dark:border-slate-600"
          : "bg-background text-muted-foreground border-border hover:border-muted-foreground/50"
      )}
    >
      {label}
    </button>
  )
}

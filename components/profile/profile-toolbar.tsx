"use client"

import type React from "react"
import { useProfileContext } from "@/components/profile/profile-context"
import { cn } from "@/lib/utils"

const ReportsIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 2C2.44772 2 2 2.44772 2 3V13.5C2 14.0523 2.44772 14.5 3 14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5V3C14.5 2.44772 14.0523 2 13.5 2H3ZM9 5H7.5V12H9V5ZM6 8H4.5V12H6V8ZM10.5 9.5H12V12H10.5V9.5Z"
      fill="currentColor"
    />
  </svg>
)

export function ProfileToolbar() {
  const { visibleModules, toggleModule } = useProfileContext()

  const ToggleBtn = ({
    active,
    onClick,
    icon,
    label,
  }: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-md transition-colors px-[0] h-10 w-10 gap-1",
        active
          ? "bg-foreground/90 text-background dark:bg-white/90 dark:text-sidebar"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  )

  return (
    <div className="w-16 flex flex-col bg-sidebar border-l border-border/20 z-20 shrink-0 items-center gap-3 py-3">
      <ToggleBtn
        active={visibleModules.reports}
        onClick={() => toggleModule("reports")}
        icon={<ReportsIcon className="w-4 h-4" />}
        label="Reports"
      />
    </div>
  )
}

"use client"

import type React from "react"
import { useProfileContext } from "@/components/profile/profile-context"
import { cn } from "@/lib/utils"

const ClipsIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4.62552 9.87441C4.70589 9.95479 4.8149 9.99994 4.92856 9.99994C4.9951 9.99994 5.06073 9.98446 5.12026 9.95473L10.263 7.38332C10.3342 7.34773 10.3941 7.29302 10.436 7.22531C10.4778 7.15759 10.5 7.07957 10.5 6.99996C10.5 6.92036 10.4778 6.84233 10.436 6.77462C10.3941 6.70691 10.3342 6.6522 10.263 6.61661L5.12026 4.0452C5.05492 4.01252 4.98231 3.99709 4.90932 4.00037C4.83633 4.00365 4.7654 4.02554 4.70325 4.06395C4.6411 4.10236 4.58981 4.15602 4.55423 4.21983C4.51866 4.28365 4.49999 4.3555 4.5 4.42856V9.57137C4.5 9.68503 4.54515 9.79404 4.62552 9.87441Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.11101 1.17971C4.26216 0.410543 5.61553 0 7 0C8.85652 0 10.637 0.737498 11.9497 2.05025C13.2625 3.36301 14 5.14348 14 7C14 8.38447 13.5895 9.73785 12.8203 10.889C12.0511 12.0401 10.9579 12.9373 9.67879 13.4672C8.3997 13.997 6.99224 14.1356 5.63437 13.8655C4.2765 13.5954 3.02922 12.9287 2.05026 11.9497C1.07129 10.9708 0.404603 9.7235 0.134506 8.36563C-0.13559 7.00776 0.00303292 5.6003 0.532846 4.32122C1.06266 3.04213 1.95987 1.94888 3.11101 1.17971ZM10.3334 2.01118C9.34673 1.35189 8.18669 1 7 1C5.4087 1 3.88258 1.63214 2.75736 2.75736C1.63214 3.88258 1 5.4087 1 7C1 8.18669 1.3519 9.34673 2.01119 10.3334C2.67047 11.3201 3.60755 12.0892 4.7039 12.5433C5.80026 12.9974 7.00666 13.1162 8.17054 12.8847C9.33443 12.6532 10.4035 12.0818 11.2426 11.2426C12.0818 10.4035 12.6532 9.33443 12.8847 8.17054C13.1162 7.00666 12.9974 5.80026 12.5433 4.7039C12.0892 3.60754 11.3201 2.67047 10.3334 2.01118Z"
      fill="currentColor"
    />
  </svg>
)

const EventsIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 0.5C3 0.223858 3.22386 0 3.5 0H4.5C4.77614 0 5 0.223858 5 0.5V1H9V0.5C9 0.223858 9.22386 0 9.5 0H10.5C10.7761 0 11 0.223858 11 0.5V1H12.5C13.3284 1 14 1.67157 14 2.5V12.5C14 13.3284 13.3284 14 12.5 14H1.5C0.671573 14 0 13.3284 0 12.5V2.5C0 1.67157 0.671573 1 1.5 1H3V0.5ZM1 5V12.5C1 12.7761 1.22386 13 1.5 13H12.5C12.7761 13 13 12.7761 13 12.5V5H1ZM13 4V2.5C13 2.22386 12.7761 2 12.5 2H1.5C1.22386 2 1 2.22386 1 2.5V4H13Z"
      fill="currentColor"
    />
  </svg>
)

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
        active={visibleModules.clips}
        onClick={() => toggleModule("clips")}
        icon={<ClipsIcon className="w-4 h-4" />}
        label="Clips"
      />
      <ToggleBtn
        active={visibleModules.events}
        onClick={() => toggleModule("events")}
        icon={<EventsIcon className="w-4 h-4" />}
        label="Events"
      />
      <ToggleBtn
        active={visibleModules.reports}
        onClick={() => toggleModule("reports")}
        icon={<ReportsIcon className="w-4 h-4" />}
        label="Reports"
      />
    </div>
  )
}

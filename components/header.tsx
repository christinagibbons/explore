"use client"
import { Icon } from "@/components/icon"
import { Button } from "@/components/button"
import { GlobalSearch } from "@/components/global-search"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { useExploreContextOptional } from "@/lib/explore-context"

const FilterToggleIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2 2.25C2 2.11193 2.11193 2 2.25 2H13.75C13.8881 2 14 2.11193 14 2.25V3.34315C14 4.53662 13.5259 5.68121 12.682 6.52513L10 9.20711V13.75C10 13.8881 9.88807 14 9.75 14H6.25C6.11193 14 6 13.8881 6 13.75V9.20711L3.31802 6.52513C2.47411 5.68121 2 4.53662 2 3.34315V2.25ZM3 3V3.34315C3 4.2714 3.36875 5.16164 4.02513 5.81802L7 8.79289V13H9V8.79289L11.9749 5.81802C12.6313 5.16164 13 4.2714 13 3.34315V3H3Z" fill="currentColor"/>
  </svg>
)

interface HeaderProps {
  className?: string
  title?: string
  icon?: React.ReactNode
  onShareClick?: () => void
  onDownloadClick?: () => void
  showBack?: boolean
  onBackClick?: () => void
  /** When true, shows the filters toggle button (for explore page) */
  showFiltersToggle?: boolean
}

export function Header({
  className,
  title = "Content Title",
  icon,
  onShareClick,
  onDownloadClick,
  showBack,
  onBackClick,
  showFiltersToggle,
}: HeaderProps) {
  const exploreContext = useExploreContextOptional()
  
  return (
    <header className={cn("bg-sidebar border-b-0 border-border px-4 py-3 font-sans border-none", className)}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button onClick={onBackClick} className="p-1 hover:bg-muted rounded transition-colors -ml-1">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          ) : icon ? (
            <span className="flex items-center text-muted-foreground">{icon}</span>
          ) : (
            <Icon name="moduleGrid" className="w-5 h-5 text-muted-foreground" />
          )}

          <span className="text-foreground font-medium">{title}</span>
        </div>

        {/* Filters toggle button - shown on explore page */}
        {showFiltersToggle && exploreContext && (
          <button
            onClick={exploreContext.toggleFilters}
            className={cn(
              "relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium",
              exploreContext.showFilters
                ? "bg-foreground/90 text-background dark:bg-white/90 dark:text-sidebar"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label={exploreContext.showFilters ? "Hide filters" : "Show filters"}
          >
            <FilterToggleIcon className="w-4 h-4" />
            <span>Filters</span>
            {!exploreContext.showFilters && exploreContext.activeFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold leading-none bg-blue-600 text-white rounded-full">
                {exploreContext.activeFilterCount}
              </span>
            )}
          </button>
        )}

        <div className="flex-1 px-4">
          <GlobalSearch />
        </div>

        {/* Action Buttons - hidden for now */}
      </div>
    </header>
  )
}

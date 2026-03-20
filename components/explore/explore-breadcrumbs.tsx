"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useExploreContextOptional, type BreadcrumbAnchor } from "@/lib/explore-context"

interface ExploreBreadcrumbsProps {
  className?: string
  onNavigate?: (anchor: BreadcrumbAnchor, index: number) => void
}

export function ExploreBreadcrumbs({ className, onNavigate }: ExploreBreadcrumbsProps) {
  const context = useExploreContextOptional()
  
  if (!context) return null
  
  const { breadcrumbs, navigateToBreadcrumb } = context

  const handleClick = (anchor: BreadcrumbAnchor, index: number) => {
    // Don't do anything if clicking the current (last) breadcrumb
    if (index === breadcrumbs.length - 1) return
    
    navigateToBreadcrumb(index)
    onNavigate?.(anchor, index)
  }

  if (breadcrumbs.length === 0) return null

  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={cn("flex items-center", className)}
    >
      <ol className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((anchor, index) => {
          const isLast = index === breadcrumbs.length - 1
          const isClickable = !isLast && breadcrumbs.length > 1

          return (
            <li key={`${anchor.type}-${anchor.id || index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 mx-0.5" />
              )}
              <button
                onClick={() => handleClick(anchor, index)}
                disabled={!isClickable}
                className={cn(
                  "font-medium transition-colors",
                  isLast 
                    ? "text-foreground cursor-default" 
                    : "text-muted-foreground hover:text-primary cursor-pointer"
                )}
              >
                {anchor.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

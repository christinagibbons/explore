"use client"

/**
 * Explore Breadcrumbs Component
 * 
 * Displays clickable breadcrumb trail for explore navigation.
 * Breadcrumbs represent context (anchor) transitions only.
 * 
 * BREADCRUMB RULES:
 * - Update on anchor changes only (collection -> entity -> content)
 * - Ignore filters and scope changes
 * - Use minimal meaningful hierarchy
 */

import { useRouter } from "next/navigation"
import { Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBreadcrumbContextOptional, type BreadcrumbAnchor } from "@/lib/breadcrumb-context"

interface ExploreBreadcrumbsProps {
  className?: string
  // Optional callback when a breadcrumb is clicked
  onNavigate?: (anchor: BreadcrumbAnchor, index: number) => void
}

export function ExploreBreadcrumbs({ className, onNavigate }: ExploreBreadcrumbsProps) {
  const router = useRouter()
  const context = useBreadcrumbContextOptional()

  if (!context) return null

  const { breadcrumbs, navigateTo } = context

  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) return null

  const handleClick = (anchor: BreadcrumbAnchor, index: number) => {
    // Don't navigate if clicking the current (last) breadcrumb
    if (index === breadcrumbs.length - 1) return

    // Navigate in context
    navigateTo(index)
    
    // Callback for parent component
    onNavigate?.(anchor, index)

    // Navigate to the route
    router.push(anchor.href)
  }

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      {breadcrumbs.map((anchor, index) => {
        const isLast = index === breadcrumbs.length - 1
        const isFirst = index === 0

        return (
          <div key={`${anchor.specificType}-${anchor.id || index}`} className="flex items-center gap-1">
            {/* Separator (not before first item) */}
            {!isFirst && (
              <span className="text-muted-foreground/60 shrink-0">/</span>
            )}

            {/* Breadcrumb item */}
            <button
              onClick={() => handleClick(anchor, index)}
              disabled={isLast}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors",
                isLast
                  ? "text-foreground font-medium cursor-default"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {/* Show home icon for first collection */}
              {isFirst && anchor.anchorType === "collection" && (
                <Home className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate max-w-[150px]">{anchor.label}</span>
            </button>
          </div>
        )
      })}
    </nav>
  )
}

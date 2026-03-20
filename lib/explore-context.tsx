"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type ExploreVersion = "v1" | "v2" | "v3"

export const EXPLORE_VERSION_LABELS: Record<ExploreVersion, string> = {
  v1: "V1 - Preview Module Breadcrumbs",
  v2: "V2 - Navigate to Full Profiles",
  v3: "V3 - Breadcrumbs + Scope Bar",
}

// Entity types for the explore experience
export type EntityType = "clips" | "games" | "teams" | "athletes"

// Breadcrumb anchor types
export type AnchorType = "explore" | "athlete" | "team" | "game" | "clip"

export interface BreadcrumbAnchor {
  type: AnchorType
  id?: string
  label: string
  entityType?: EntityType // The tab context when this anchor was created
}

// Scope represents the current frame/boundaries of the experience
export interface ExploreScope {
  entityType: EntityType
  season: string
  competition?: string // Optional: e.g., "NFL", "NCAA"
}

interface ExploreContextValue {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  toggleFilters: () => void
  activeFilterCount: number
  setActiveFilterCount: (count: number) => void
  exploreVersion: ExploreVersion
  setExploreVersion: (version: ExploreVersion) => void
  // New: Breadcrumb navigation
  breadcrumbs: BreadcrumbAnchor[]
  pushBreadcrumb: (anchor: BreadcrumbAnchor) => void
  popBreadcrumb: () => void
  navigateToBreadcrumb: (index: number) => BreadcrumbAnchor[]
  clearBreadcrumbs: () => void
  // New: Scope management
  scope: ExploreScope
  setScope: (scope: Partial<ExploreScope>) => void
  updateEntityType: (entityType: EntityType) => void
  updateSeason: (season: string) => void
}

const ExploreContext = createContext<ExploreContextValue | null>(null)

const DEFAULT_SCOPE: ExploreScope = {
  entityType: "clips",
  season: "2023",
}

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [showFilters, setShowFilters] = useState(true)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [exploreVersion, setExploreVersion] = useState<ExploreVersion>("v3")
  
  // Breadcrumb state - starts with Explore as root
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbAnchor[]>([
    { type: "explore", label: "Explore" }
  ])
  
  // Scope state
  const [scope, setScopeState] = useState<ExploreScope>(DEFAULT_SCOPE)

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev)
  }, [])

  // Push a new anchor to the breadcrumb trail
  const pushBreadcrumb = useCallback((anchor: BreadcrumbAnchor) => {
    setBreadcrumbs((prev) => {
      // Don't add duplicate consecutive anchors (check type, id, and label)
      const last = prev[prev.length - 1]
      if (last && last.type === anchor.type && last.id === anchor.id && last.label === anchor.label) {
        return prev
      }
      return [...prev, { ...anchor, entityType: anchor.entityType || scope.entityType }]
    })
  }, [scope.entityType])

  // Pop the last anchor from breadcrumb trail
  const popBreadcrumb = useCallback(() => {
    setBreadcrumbs((prev) => {
      if (prev.length <= 1) return prev // Keep at least the root "Explore"
      return prev.slice(0, -1)
    })
  }, [])

  // Navigate to a specific breadcrumb index, returning removed anchors
  const navigateToBreadcrumb = useCallback((index: number) => {
    let removed: BreadcrumbAnchor[] = []
    setBreadcrumbs((prev) => {
      if (index < 0 || index >= prev.length) return prev
      removed = prev.slice(index + 1)
      return prev.slice(0, index + 1)
    })
    return removed
  }, [])

  // Clear breadcrumbs back to root
  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([{ type: "explore", label: "Explore" }])
  }, [])

  // Update scope
  const setScope = useCallback((newScope: Partial<ExploreScope>) => {
    setScopeState((prev) => ({ ...prev, ...newScope }))
  }, [])

  // Update entity type (when switching tabs) - only updates scope, caller handles breadcrumbs
  const updateEntityType = useCallback((entityType: EntityType) => {
    setScopeState((prev) => ({ ...prev, entityType }))
    // Reset breadcrumbs to just "Explore" root when switching entity types
    setBreadcrumbs([{ type: "explore", label: "Explore" }])
  }, [])

  // Update season
  const updateSeason = useCallback((season: string) => {
    setScopeState((prev) => ({ ...prev, season }))
  }, [])

  return (
    <ExploreContext.Provider
      value={{
        showFilters,
        setShowFilters,
        toggleFilters,
        activeFilterCount,
        setActiveFilterCount,
        exploreVersion,
        setExploreVersion,
        breadcrumbs,
        pushBreadcrumb,
        popBreadcrumb,
        navigateToBreadcrumb,
        clearBreadcrumbs,
        scope,
        setScope,
        updateEntityType,
        updateSeason,
      }}
    >
      {children}
    </ExploreContext.Provider>
  )
}

export function useExploreContext() {
  const context = useContext(ExploreContext)
  if (!context) {
    throw new Error("useExploreContext must be used within an ExploreProvider")
  }
  return context
}

// Hook that returns null if not in explore context (for conditional usage in header)
export function useExploreContextOptional() {
  return useContext(ExploreContext)
}

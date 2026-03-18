"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type ExploreVersion = "v1" | "v2" | "v3"

export const EXPLORE_VERSION_LABELS: Record<ExploreVersion, string> = {
  v1: "V1 - Preview Module Breadcrumbs",
  v2: "V2 - New Contexts",
  v3: "V3 - Everything is a module",
}

interface ExploreContextValue {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  toggleFilters: () => void
  activeFilterCount: number
  setActiveFilterCount: (count: number) => void
  exploreVersion: ExploreVersion
  setExploreVersion: (version: ExploreVersion) => void
}

const ExploreContext = createContext<ExploreContextValue | null>(null)

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [showFilters, setShowFilters] = useState(true)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [exploreVersion, setExploreVersion] = useState<ExploreVersion>("v1")

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev)
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

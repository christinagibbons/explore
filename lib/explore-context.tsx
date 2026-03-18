"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface ExploreContextValue {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  toggleFilters: () => void
  activeFilterCount: number
  setActiveFilterCount: (count: number) => void
}

const ExploreContext = createContext<ExploreContextValue | null>(null)

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [showFilters, setShowFilters] = useState(true)
  const [activeFilterCount, setActiveFilterCount] = useState(0)

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

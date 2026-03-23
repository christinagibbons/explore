"use client"

/**
 * Breadcrumb Context for Explore Navigation
 * 
 * BREADCRUMB RULES:
 * - Update on anchor changes only (collection, entity, content anchors)
 * - Ignore filters and scope changes (season, sorting, refinements)
 * - Use minimal meaningful hierarchy when no navigation path exists
 * 
 * ANCHOR TYPES:
 * - Collection: Result sets (Athletes, Teams, Competitions, Games, Clips, Search)
 * - Entity: Full-page profiles (athlete, team, competition)
 * - Content: Full-page content views (game, playlist, clip)
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

// Anchor types in the explore experience
export type AnchorType = "collection" | "entity" | "content"

// Collection types for the initial anchor
export type CollectionType = "athletes" | "teams" | "games" | "clips" | "competitions" | "search"

// Entity/Content specific types
export type EntityContentType = "athlete" | "team" | "game" | "clip" | "playlist" | "competition"

export interface BreadcrumbAnchor {
  // The type of anchor
  anchorType: AnchorType
  // Specific type within the anchor category
  specificType: CollectionType | EntityContentType
  // Display label for the breadcrumb
  label: string
  // Unique identifier (optional for collections)
  id?: string
  // Route to navigate to
  href: string
}

interface BreadcrumbContextValue {
  // Current breadcrumb trail
  breadcrumbs: BreadcrumbAnchor[]
  // Whether the context has been hydrated from storage
  isHydrated: boolean
  // Set a new collection anchor (resets the trail)
  setCollectionAnchor: (collection: CollectionType, label?: string) => void
  // Push an entity or content anchor (adds to trail)
  pushAnchor: (anchor: Omit<BreadcrumbAnchor, "href"> & { href?: string }) => void
  // Navigate to a specific breadcrumb index (removes items after it)
  navigateTo: (index: number) => BreadcrumbAnchor | null
  // Clear all breadcrumbs
  clearBreadcrumbs: () => void
  // Get the current anchor
  currentAnchor: BreadcrumbAnchor | null
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

const STORAGE_KEY = "explore-breadcrumbs"

// Helper to generate href for different anchor types
function generateHref(anchor: Omit<BreadcrumbAnchor, "href">): string {
  const { anchorType, specificType, id } = anchor
  
  if (anchorType === "collection") {
    return "/explore"
  }
  
  if (anchorType === "entity") {
    switch (specificType) {
      case "athlete":
        return `/athletes/${id}`
      case "team":
        return `/teams/${id}`
      default:
        return "/explore"
    }
  }
  
  if (anchorType === "content") {
    switch (specificType) {
      case "game":
        return `/games/${id}`
      case "clip":
        return `/clips/${id}`
      default:
        return "/explore"
    }
  }
  
  return "/explore"
}

// Collection label mapping
const COLLECTION_LABELS: Record<CollectionType, string> = {
  athletes: "Athletes",
  teams: "Teams",
  games: "Games",
  clips: "Clips",
  competitions: "Competitions",
  search: "Search",
}

// Helper to save breadcrumbs to sessionStorage
function saveBreadcrumbs(breadcrumbs: BreadcrumbAnchor[]) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(breadcrumbs))
    } catch (e) {
      // Silently fail
    }
  }
}

// Helper to load breadcrumbs from sessionStorage
function loadBreadcrumbs(): BreadcrumbAnchor[] {
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      // Silently fail
    }
  }
  return []
}

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbAnchor[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const stored = loadBreadcrumbs()
    if (stored.length > 0) {
      setBreadcrumbs(stored)
    }
    setIsHydrated(true)
  }, [])

  // Save to sessionStorage whenever breadcrumbs change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveBreadcrumbs(breadcrumbs)
    }
  }, [breadcrumbs, isHydrated])

  // Set collection anchor - this resets the breadcrumb trail to just the collection
  const setCollectionAnchor = useCallback((collection: CollectionType, label?: string) => {
    const anchor: BreadcrumbAnchor = {
      anchorType: "collection",
      specificType: collection,
      label: label || COLLECTION_LABELS[collection],
      href: "/explore",
    }
    setBreadcrumbs([anchor])
  }, [])

  // Push a new anchor to the trail
  const pushAnchor = useCallback((anchor: Omit<BreadcrumbAnchor, "href"> & { href?: string }) => {
    const fullAnchor: BreadcrumbAnchor = {
      ...anchor,
      href: anchor.href || generateHref(anchor),
    }
    
    setBreadcrumbs(prev => {
      // Don't add duplicate consecutive anchors
      const last = prev[prev.length - 1]
      if (last && last.specificType === fullAnchor.specificType && last.id === fullAnchor.id) {
        return prev
      }
      return [...prev, fullAnchor]
    })
  }, [])

  // Navigate to a specific breadcrumb (returns the anchor and trims the trail)
  const navigateTo = useCallback((index: number): BreadcrumbAnchor | null => {
    let target: BreadcrumbAnchor | null = null
    setBreadcrumbs(prev => {
      if (index < 0 || index >= prev.length) return prev
      target = prev[index]
      return prev.slice(0, index + 1)
    })
    return target
  }, [])

  // Clear all breadcrumbs
  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([])
  }, [])

  // Get current anchor
  const currentAnchor = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null

  return (
    <BreadcrumbContext.Provider
      value={{
        breadcrumbs,
        isHydrated,
        setCollectionAnchor,
        pushAnchor,
        navigateTo,
        clearBreadcrumbs,
        currentAnchor,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error("useBreadcrumbContext must be used within a BreadcrumbProvider")
  }
  return context
}

// Optional hook that returns null if not in context
export function useBreadcrumbContextOptional() {
  return useContext(BreadcrumbContext)
}

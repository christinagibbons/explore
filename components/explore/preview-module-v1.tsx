"use client"

/**
 * PreviewModuleV1 - Preview Module with Back/Forward Navigation
 * 
 * Navigation uses browser-style back/forward chevrons instead of breadcrumbs.
 * Clicking through game -> team -> athlete builds up history that can be
 * navigated with back/forward buttons.
 */

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import type { PlayData } from "@/lib/mock-datasets"
import type { Athlete } from "@/types/athlete"
import type { Game } from "@/types/game"
import type { Team } from "@/lib/sports-data"

// Import the individual preview components from the main preview module
import { PreviewModule } from "@/components/preview-module"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreviewItemType = "game" | "team" | "athlete" | "clip"

export interface BreadcrumbItem {
  type: PreviewItemType
  label: string
  data: PlayData | Game | Team | (Athlete & { id?: string })
}

interface PreviewModuleV1Props {
  play?: PlayData
  game?: Game
  team?: Team
  athlete?: Athlete & { id?: string }
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Hierarchy helpers
// ---------------------------------------------------------------------------

const HIERARCHY_ORDER: Record<PreviewItemType, number> = {
  game: 0,
  team: 1,
  athlete: 2,
  clip: 3,
}

/**
 * Check if navigation from one type to another is valid according to hierarchy.
 * We allow drilling down (higher to lower in hierarchy) or lateral moves for clip<->athlete.
 */
export function isValidNavigation(from: PreviewItemType, to: PreviewItemType): boolean {
  // Clip and Athlete can navigate to each other (lateral)
  if ((from === "clip" && to === "athlete") || (from === "athlete" && to === "clip")) {
    return true
  }
  // Otherwise, can only drill down (from higher to lower)
  return HIERARCHY_ORDER[from] < HIERARCHY_ORDER[to]
}

/**
 * Get a display label for a breadcrumb item
 */
function getBreadcrumbLabel(item: BreadcrumbItem): string {
  switch (item.type) {
    case "clip":
      return `Clip ${(item.data as PlayData).playNumber}`
    case "game":
      return (item.data as Game).name || "Game"
    case "team":
      return (item.data as Team).name || "Team"
    case "athlete":
      return (item.data as Athlete).name || "Athlete"
    default:
      return item.label
  }
}

/**
 * Get icon name for item type
 */
function getItemIcon(type: PreviewItemType): string {
  switch (type) {
    case "game": return "calendar"
    case "team": return "team"
    case "athlete": return "user"
    case "clip": return "play"
    default: return "file"
  }
}

// ---------------------------------------------------------------------------
// Navigation Header Component with Back/Forward Chevrons
// ---------------------------------------------------------------------------

interface NavigationHeaderProps {
  currentItem: BreadcrumbItem | null
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  onClose: () => void
}

function NavigationHeader({ currentItem, canGoBack, canGoForward, onBack, onForward, onClose }: NavigationHeaderProps) {
  const hasNavigation = canGoBack || canGoForward

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0 gap-2">
      {/* Left side: Navigation chevrons + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Back/Forward chevrons - only show if there's any navigation history */}
        {hasNavigation && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              disabled={!canGoBack}
              className={cn(
                "h-7 w-7 shrink-0",
                canGoBack 
                  ? "text-muted-foreground hover:text-foreground" 
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onForward}
              disabled={!canGoForward}
              className={cn(
                "h-7 w-7 shrink-0",
                canGoForward 
                  ? "text-muted-foreground hover:text-foreground" 
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              <Icon name="chevronRight" className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Current item title */}
        <span className="text-sm font-semibold text-foreground truncate">
          {currentItem ? getBreadcrumbLabel(currentItem) : "Preview"}
        </span>
      </div>
      
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
      >
        <Icon name="close" className="w-4 h-4" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PreviewModuleV1 - Main Component with Back/Forward Navigation
// ---------------------------------------------------------------------------

export function PreviewModuleV1({ 
  play, 
  game, 
  team, 
  athlete, 
  onClose,
}: PreviewModuleV1Props) {
  // Back history stack - items we can go back to
  const [backStack, setBackStack] = useState<BreadcrumbItem[]>([])
  
  // Forward history stack - items we can go forward to (populated when going back)
  const [forwardStack, setForwardStack] = useState<BreadcrumbItem[]>([])

  // Current preview state - what's currently being shown
  const [currentPreview, setCurrentPreview] = useState<{
    type: PreviewItemType
    data: PlayData | Game | Team | (Athlete & { id?: string })
  } | null>(() => {
    if (game) return { type: "game", data: game }
    if (team) return { type: "team", data: team }
    if (athlete) return { type: "athlete", data: athlete }
    if (play) return { type: "clip", data: play }
    return null
  })

  // Reset navigation when the root item changes from parent
  const rootItemKey = useMemo(() => {
    if (game) return `game-${game.id}`
    if (team) return `team-${team.id}`
    if (athlete) return `athlete-${athlete.id || athlete.name}`
    if (play) return `clip-${play.id}`
    return null
  }, [game, team, athlete, play])

  // When root item changes, reset stacks and set current preview
  useMemo(() => {
    if (game) {
      setCurrentPreview({ type: "game", data: game })
      setBackStack([])
      setForwardStack([])
    } else if (team) {
      setCurrentPreview({ type: "team", data: team })
      setBackStack([])
      setForwardStack([])
    } else if (athlete) {
      setCurrentPreview({ type: "athlete", data: athlete })
      setBackStack([])
      setForwardStack([])
    } else if (play) {
      setCurrentPreview({ type: "clip", data: play })
      setBackStack([])
      setForwardStack([])
    }
  }, [rootItemKey])

  // Navigate to a new item (drill down) - clears forward stack
  const navigateTo = useCallback((type: PreviewItemType, data: PlayData | Game | Team | (Athlete & { id?: string }), label: string) => {
    const newItem = { type, label, data }
    
    // Push current item to back stack before navigating
    if (currentPreview) {
      const currentItem: BreadcrumbItem = {
        type: currentPreview.type,
        label: getBreadcrumbLabel({ type: currentPreview.type, label: "", data: currentPreview.data }),
        data: currentPreview.data
      }
      setBackStack(prev => [...prev, currentItem])
    }
    
    // Clear forward stack when navigating to new item
    setForwardStack([])
    setCurrentPreview({ type, data })
  }, [currentPreview])

  // Navigate back one step
  const handleBack = useCallback(() => {
    if (backStack.length === 0) {
      onClose()
      return
    }
    
    // Pop from back stack
    const newBackStack = [...backStack]
    const previousItem = newBackStack.pop()!
    setBackStack(newBackStack)
    
    // Push current item to forward stack
    if (currentPreview) {
      const currentItem: BreadcrumbItem = {
        type: currentPreview.type,
        label: getBreadcrumbLabel({ type: currentPreview.type, label: "", data: currentPreview.data }),
        data: currentPreview.data
      }
      setForwardStack(prev => [...prev, currentItem])
    }
    
    setCurrentPreview({ type: previousItem.type, data: previousItem.data })
  }, [backStack, currentPreview, onClose])

  // Navigate forward one step
  const handleForward = useCallback(() => {
    if (forwardStack.length === 0) return
    
    // Pop from forward stack
    const newForwardStack = [...forwardStack]
    const nextItem = newForwardStack.pop()!
    setForwardStack(newForwardStack)
    
    // Push current item to back stack
    if (currentPreview) {
      const currentItem: BreadcrumbItem = {
        type: currentPreview.type,
        label: getBreadcrumbLabel({ type: currentPreview.type, label: "", data: currentPreview.data }),
        data: currentPreview.data
      }
      setBackStack(prev => [...prev, currentItem])
    }
    
    setCurrentPreview({ type: nextItem.type, data: nextItem.data })
  }, [forwardStack, currentPreview])

  // Handle navigation callbacks from child previews
  const handleNavigateToTeam = useCallback((teamData: Team) => {
    navigateTo("team", teamData, teamData.name || "Team")
  }, [navigateTo])

  const handleNavigateToAthlete = useCallback((athleteData: Athlete & { id?: string }) => {
    navigateTo("athlete", athleteData, athleteData.name || "Athlete")
  }, [navigateTo])

  const handleNavigateToGame = useCallback((gameData: Game) => {
    navigateTo("game", gameData, gameData.name || "Game")
  }, [navigateTo])

  const handleNavigateToClip = useCallback((playData: PlayData) => {
    navigateTo("clip", playData, `Clip ${playData.playNumber}`)
  }, [navigateTo])

  if (!currentPreview) return null

  // Render the appropriate preview based on current state
  // We pass a dummy onClose that does nothing since we handle closing in our header
  const renderPreview = () => {
    switch (currentPreview.type) {
      case "game":
        return (
          <PreviewModule
            game={currentPreview.data as Game}
            onClose={() => {}} // Handled by our header
            onNavigateToTeam={handleNavigateToTeam}
            hideHeader
          />
        )
      case "team":
        return (
          <PreviewModule
            team={currentPreview.data as Team}
            onClose={() => {}} // Handled by our header
            onNavigateToAthlete={handleNavigateToAthlete}
            onNavigateToGame={handleNavigateToGame}
            hideHeader
          />
        )
      case "athlete":
        return (
          <PreviewModule
            athlete={currentPreview.data as Athlete & { id?: string }}
            onClose={() => {}} // Handled by our header
            onNavigateToTeam={handleNavigateToTeam}
            hideHeader
          />
        )
      case "clip":
        return (
          <PreviewModule
            play={currentPreview.data as PlayData}
            onClose={() => {}} // Handled by our header
            onNavigateToAthlete={handleNavigateToAthlete}
            hideHeader
          />
        )
      default:
        return null
    }
  }

  // Get current item for display
  const currentItem = useMemo((): BreadcrumbItem | null => {
    if (!currentPreview) return null
    return {
      type: currentPreview.type,
      label: getBreadcrumbLabel({ type: currentPreview.type, label: "", data: currentPreview.data }),
      data: currentPreview.data
    }
  }, [currentPreview])

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden">
      {/* Navigation Header with Back/Forward Chevrons */}
      <NavigationHeader
        currentItem={currentItem}
        canGoBack={backStack.length > 0}
        canGoForward={forwardStack.length > 0}
        onBack={handleBack}
        onForward={handleForward}
        onClose={onClose}
      />
      
      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {renderPreview()}
      </div>
    </div>
  )
}

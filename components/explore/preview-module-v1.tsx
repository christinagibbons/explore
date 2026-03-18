"use client"

/**
 * PreviewModuleV1 - Preview Module with Breadcrumb Navigation
 * 
 * Hierarchy (top to bottom):
 * 1. Game (highest)
 * 2. Team (within Game)
 * 3. Athlete (within Team)
 * 4. Clip (lowest, but can link to Athletes)
 * 
 * Valid navigation trails:
 * - Clip -> Athlete (Clip / Athlete)
 * - Game -> Team (Game / Team)
 * - Game -> Team -> Athlete (Game / Team / Athlete)
 * - Athlete -> Clip (Athlete / Clip)
 * 
 * Invalid trails (hierarchy violations):
 * - Team / Game, Athlete / Team, Athlete / Game
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import type { PlayData } from "@/lib/mock-datasets"
import type { Athlete } from "@/types/athlete"
import type { Game } from "@/types/game"
import type { Team } from "@/lib/sports-data"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
// Breadcrumb Header Component
// ---------------------------------------------------------------------------

interface BreadcrumbHeaderProps {
  items: BreadcrumbItem[]
  onNavigate: (index: number) => void
  onBack: () => void
  onClose: () => void
}

function BreadcrumbHeader({ items, onNavigate, onBack, onClose }: BreadcrumbHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  
  // Check if breadcrumbs need truncation
  useEffect(() => {
    const checkTruncation = () => {
      if (containerRef.current) {
        const container = containerRef.current
        setIsTruncated(container.scrollWidth > container.clientWidth)
      }
    }
    
    checkTruncation()
    const resizeObserver = new ResizeObserver(checkTruncation)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [items])

  const hasBreadcrumbs = items.length > 1
  const currentItem = items[items.length - 1]

  // Full breadcrumb trail for tooltip
  const fullTrail = items.map(item => getBreadcrumbLabel(item)).join(" / ")

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0 gap-2">
      {/* Left side: Back button + Breadcrumbs */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {/* Back button - only show when we have history */}
        {hasBreadcrumbs && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Icon name="chevronLeft" className="w-4 h-4" />
          </Button>
        )}
        
        {/* Breadcrumbs or Title */}
        {hasBreadcrumbs ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  ref={containerRef}
                  className="flex items-center gap-1 min-w-0 overflow-hidden"
                >
                  {isTruncated ? (
                    // Truncated view: show ellipsis + last 2 items
                    <>
                      <span className="text-muted-foreground text-sm">...</span>
                      <Icon name="chevronRight" className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                      {items.slice(-2).map((item, idx) => {
                        const actualIndex = items.length - 2 + idx
                        const isLast = idx === 1
                        return (
                          <div key={`${item.type}-${actualIndex}`} className="flex items-center gap-1 shrink-0">
                            {idx > 0 && (
                              <Icon name="chevronRight" className="w-3 h-3 text-muted-foreground/60" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onNavigate(actualIndex)
                              }}
                              className={cn(
                                "text-sm px-1.5 py-0.5 rounded transition-colors truncate max-w-[100px]",
                                isLast
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                              disabled={isLast}
                            >
                              {getBreadcrumbLabel(item)}
                            </button>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    // Full view: show all breadcrumbs
                    items.map((item, index) => {
                      const isLast = index === items.length - 1
                      return (
                        <div key={`${item.type}-${index}`} className="flex items-center gap-1 shrink-0">
                          {index > 0 && (
                            <Icon name="chevronRight" className="w-3 h-3 text-muted-foreground/60" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onNavigate(index)
                            }}
                            className={cn(
                              "text-sm px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px]",
                              isLast
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            disabled={isLast}
                          >
                            {getBreadcrumbLabel(item)}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </TooltipTrigger>
              {isTruncated && (
                <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                  <p className="text-xs">{fullTrail}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ) : (
          // No breadcrumbs - show current item title
          <span className="text-sm font-semibold text-foreground truncate">
            {currentItem ? getBreadcrumbLabel(currentItem) : "Preview"}
          </span>
        )}
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
// PreviewModuleV1 - Main Component with Breadcrumb State
// ---------------------------------------------------------------------------

export function PreviewModuleV1({ 
  play, 
  game, 
  team, 
  athlete, 
  onClose,
}: PreviewModuleV1Props) {
  // Breadcrumb stack - tracks navigation history
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>(() => {
    // Initialize with the current item
    if (game) return [{ type: "game", label: game.name || "Game", data: game }]
    if (team) return [{ type: "team", label: team.name || "Team", data: team }]
    if (athlete) return [{ type: "athlete", label: athlete.name || "Athlete", data: athlete }]
    if (play) return [{ type: "clip", label: `Clip ${play.playNumber}`, data: play }]
    return []
  })

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

  // Reset breadcrumbs when the root item changes from parent
  const rootItemKey = useMemo(() => {
    if (game) return `game-${game.id}`
    if (team) return `team-${team.id}`
    if (athlete) return `athlete-${athlete.id || athlete.name}`
    if (play) return `clip-${play.id}`
    return null
  }, [game, team, athlete, play])

  // When root item changes, reset the breadcrumb stack
  useMemo(() => {
    if (game) {
      setBreadcrumbs([{ type: "game", label: game.name || "Game", data: game }])
      setCurrentPreview({ type: "game", data: game })
    } else if (team) {
      setBreadcrumbs([{ type: "team", label: team.name || "Team", data: team }])
      setCurrentPreview({ type: "team", data: team })
    } else if (athlete) {
      setBreadcrumbs([{ type: "athlete", label: athlete.name || "Athlete", data: athlete }])
      setCurrentPreview({ type: "athlete", data: athlete })
    } else if (play) {
      setBreadcrumbs([{ type: "clip", label: `Clip ${play.playNumber}`, data: play }])
      setCurrentPreview({ type: "clip", data: play })
    }
  }, [rootItemKey])

  // Navigate to a new item (drill down)
  const navigateTo = useCallback((type: PreviewItemType, data: PlayData | Game | Team | (Athlete & { id?: string }), label: string) => {
    const currentType = currentPreview?.type
    if (currentType && !isValidNavigation(currentType, type)) {
      // Invalid navigation - reset breadcrumbs to just the new item
      setBreadcrumbs([{ type, label, data }])
    } else {
      // Valid navigation - add to breadcrumb trail
      setBreadcrumbs(prev => [...prev, { type, label, data }])
    }
    setCurrentPreview({ type, data })
  }, [currentPreview])

  // Navigate back one step
  const handleBack = useCallback(() => {
    if (breadcrumbs.length <= 1) {
      onClose()
      return
    }
    const newBreadcrumbs = breadcrumbs.slice(0, -1)
    const lastItem = newBreadcrumbs[newBreadcrumbs.length - 1]
    setBreadcrumbs(newBreadcrumbs)
    setCurrentPreview({ type: lastItem.type, data: lastItem.data })
  }, [breadcrumbs, onClose])

  // Navigate to a specific breadcrumb index
  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index >= breadcrumbs.length - 1) return // Already at this item
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    const targetItem = newBreadcrumbs[index]
    setBreadcrumbs(newBreadcrumbs)
    setCurrentPreview({ type: targetItem.type, data: targetItem.data })
  }, [breadcrumbs])

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

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden">
      {/* Integrated Breadcrumb Header */}
      <BreadcrumbHeader
        items={breadcrumbs}
        onNavigate={handleBreadcrumbClick}
        onBack={handleBack}
        onClose={onClose}
      />
      
      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {renderPreview()}
      </div>
    </div>
  )
}

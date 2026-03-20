"use client"

import { cn } from "@/lib/utils"
import { useExploreContextOptional, type EntityType } from "@/lib/explore-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

// Map entity types to display labels
const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  clips: "Clips",
  games: "Games",
  teams: "Teams",
  athletes: "Athletes",
}

// Available seasons
const AVAILABLE_SEASONS = [
  "2023",
  "2022",
  "2021",
  "2020",
]

interface ExploreScopeBarProps {
  className?: string
}

export function ExploreScopeBar({ className }: ExploreScopeBarProps) {
  const context = useExploreContextOptional()
  
  if (!context) return null
  
  const { scope, updateSeason } = context

  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border/50",
        className
      )}
    >
      {/* Entity type indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {ENTITY_TYPE_LABELS[scope.entityType]}
        </span>
        
        <span className="text-muted-foreground/60">{"·"}</span>
        
        {/* Season selector */}
        <Select value={scope.season} onValueChange={updateSeason}>
          <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-0 focus:ring-offset-0">
            <span>Season {scope.season}</span>
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_SEASONS.map((season) => (
              <SelectItem key={season} value={season}>
                Season {season}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Optional: Competition/Level indicator */}
        {scope.competition && (
          <>
            <span className="text-muted-foreground/60">{"·"}</span>
            <span className="text-sm text-muted-foreground">
              {scope.competition}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

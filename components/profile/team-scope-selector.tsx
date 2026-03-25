"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Check, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBreadcrumbContext } from "@/lib/breadcrumb-context"
import { sportsData } from "@/lib/sports-data"
import type { Athlete } from "@/types/athlete"

// Get team full name from abbreviation
function getTeamName(abbreviation: string): string {
  // Search through all leagues and conferences
  for (const league of Object.values(sportsData)) {
    for (const conference of league.conferences) {
      if (conference.subdivisions) {
        for (const subdivision of conference.subdivisions) {
          const team = subdivision.teams.find(t => t.abbreviation === abbreviation)
          if (team) return team.name
        }
      }
      const team = conference.teams.find(t => t.abbreviation === abbreviation)
      if (team) return team.name
    }
  }
  return abbreviation
}

interface TeamScopeSelectorProps {
  athlete: Athlete & { id: string }
  selectedTeam: string | null // null means "All Teams" (for multi-team) or current team (for single)
  onSelectTeam: (team: string | null) => void
}

export function TeamScopeSelector({ athlete, selectedTeam, onSelectTeam }: TeamScopeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { breadcrumbs } = useBreadcrumbContext()
  
  // Get all teams this athlete has played for
  const allTeams = useMemo(() => {
    if (!athlete.teamHistory || athlete.teamHistory.length === 0) {
      // Single team athlete - return just current team
      return [{ team: athlete.team, seasons: ["Current"] }]
    }
    return athlete.teamHistory
  }, [athlete])
  
  // Check if athlete has multiple teams
  const hasMultipleTeams = allTeams.length > 1
  
  // Find team from breadcrumb navigation (if user came through a team)
  const teamFromBreadcrumb = useMemo(() => {
    // Look for a team anchor in the breadcrumb trail
    const teamAnchor = breadcrumbs.find(b => b.specificType === "team")
    if (teamAnchor && teamAnchor.id) {
      // Check if this team is in the athlete's history
      const matchingTeam = allTeams.find(t => {
        // Match by team abbreviation (ID might be full team ID like "team-nyg")
        const teamAbbr = teamAnchor.id?.replace("team-", "").toUpperCase()
        return t.team === teamAbbr || t.team.toLowerCase() === teamAnchor.id?.toLowerCase()
      })
      return matchingTeam?.team || null
    }
    return null
  }, [breadcrumbs, allTeams])
  
  // Set default team based on breadcrumb on mount
  useEffect(() => {
    if (hasMultipleTeams && selectedTeam === null && teamFromBreadcrumb) {
      onSelectTeam(teamFromBreadcrumb)
    }
  }, [hasMultipleTeams, selectedTeam, teamFromBreadcrumb, onSelectTeam])
  
  // Get display label
  const displayLabel = useMemo(() => {
    if (hasMultipleTeams) {
      return selectedTeam ? getTeamName(selectedTeam) : "All Teams"
    }
    return getTeamName(athlete.team)
  }, [hasMultipleTeams, selectedTeam, athlete.team])
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
          "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
          isOpen && "bg-muted text-foreground"
        )}
      >
        <Users className="w-3.5 h-3.5" />
        <span>{displayLabel}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-1 z-50 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
            {hasMultipleTeams && (
              <>
                {/* All Teams option - only for multi-team athletes */}
                <button
                  onClick={() => {
                    onSelectTeam(null)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                    selectedTeam === null && "bg-primary/10"
                  )}
                >
                  <span className={cn(
                    "font-medium",
                    selectedTeam === null ? "text-primary" : "text-foreground"
                  )}>
                    All Teams
                  </span>
                  {selectedTeam === null && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
                
                <div className="h-px bg-border" />
              </>
            )}
            
            {/* Individual teams */}
            {allTeams.map((entry) => {
              const isSelected = hasMultipleTeams 
                ? selectedTeam === entry.team 
                : true // Single team is always "selected"
              
              return (
                <button
                  key={entry.team}
                  onClick={() => {
                    if (hasMultipleTeams) {
                      onSelectTeam(entry.team)
                    }
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                    isSelected && "bg-primary/10"
                  )}
                >
                  <div className="flex flex-col items-start">
                    <span className={cn(
                      "font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {getTeamName(entry.team)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.seasons.length === 1 
                        ? entry.seasons[0]
                        : `${entry.seasons[0]}-${entry.seasons[entry.seasons.length - 1]}`
                      }
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

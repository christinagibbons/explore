"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { sportsData, type League, type Team, type Conference } from "@/lib/sports-data"
import type { GameLeague } from "@/types/game"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TeamsModuleProps {
  selectedLeagues: GameLeague[]
  selectedSeason: string | null
  onClickTeam?: (team: Team) => void
  activeTeamId?: string
}

// Map GameLeague to sports-data League
const leagueMapping: Record<GameLeague, League> = {
  NFL: "NFL",
  College: "NCAA (FBS)",
  HighSchool: "HighSchool",
}

// Display names for leagues
const leagueDisplayNames: Record<League, string> = {
  NFL: "NFL",
  "NCAA (FBS)": "College",
  HighSchool: "High School",
}

// ---------------------------------------------------------------------------
// Team Tile Component
// ---------------------------------------------------------------------------
function TeamTile({ 
  team, 
  onClick, 
  isActive 
}: { 
  team: Team
  onClick?: () => void
  isActive?: boolean
}) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer",
        isActive 
          ? "bg-primary/10 ring-1 ring-primary" 
          : "bg-muted/30 hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: team.logoColor }}
      >
        {team.abbreviation}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
        <p className="text-xs text-muted-foreground">{team.abbreviation}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Division Section Component (for NFL subdivisions)
// ---------------------------------------------------------------------------
function DivisionSection({ 
  division, 
  onClickTeam,
  activeTeamId,
}: { 
  division: Conference
  onClickTeam?: (team: Team) => void
  activeTeamId?: string
}) {
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {division.name}
      </h5>
      <div className="grid grid-cols-4 gap-2">
        {division.teams.map((team) => (
          <TeamTile 
            key={team.id} 
            team={team} 
            onClick={() => onClickTeam?.(team)}
            isActive={activeTeamId === team.id}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Conference Section Component
// ---------------------------------------------------------------------------
function ConferenceSection({
  conference,
  defaultExpanded = true,
  onClickTeam,
  activeTeamId,
}: {
  conference: Conference
  defaultExpanded?: boolean
  onClickTeam?: (team: Team) => void
  activeTeamId?: string
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Count total teams in conference (including subdivisions)
  const totalTeams = useMemo(() => {
    if (conference.subdivisions && conference.subdivisions.length > 0) {
      return conference.subdivisions.reduce((sum, sub) => sum + sub.teams.length, 0)
    }
    return conference.teams.length
  }, [conference])

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2 hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{conference.name}</span>
          <span className="text-sm text-muted-foreground">({totalTeams})</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 pl-2">
          {/* Render subdivisions if they exist (NFL pattern) */}
          {conference.subdivisions && conference.subdivisions.length > 0 ? (
            conference.subdivisions.map((subdivision) => (
              <DivisionSection
                key={subdivision.id}
                division={subdivision}
                onClickTeam={onClickTeam}
                activeTeamId={activeTeamId}
              />
            ))
          ) : (
            /* Render teams directly (College/HS pattern) */
            conference.teams.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {conference.teams.map((team) => (
                  <TeamTile 
                    key={team.id} 
                    team={team} 
                    onClick={() => onClickTeam?.(team)}
                    isActive={activeTeamId === team.id}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// League Section Component
// ---------------------------------------------------------------------------
function LeagueSection({
  league,
  conferences,
  onClickTeam,
  activeTeamId,
}: {
  league: League
  conferences: Conference[]
  onClickTeam?: (team: Team) => void
  activeTeamId?: string
}) {
  // Count total teams across all conferences
  const totalTeams = useMemo(() => {
    return conferences.reduce((sum, conf) => {
      if (conf.subdivisions && conf.subdivisions.length > 0) {
        return sum + conf.subdivisions.reduce((subSum, sub) => subSum + sub.teams.length, 0)
      }
      return sum + conf.teams.length
    }, 0)
  }, [conferences])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-foreground">{leagueDisplayNames[league]}</h3>
        <span className="text-sm text-muted-foreground">({totalTeams} teams)</span>
      </div>
      <div className="space-y-4">
        {conferences.map((conference) => (
          <ConferenceSection
            key={conference.id}
            conference={conference}
            onClickTeam={onClickTeam}
            activeTeamId={activeTeamId}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main TeamsModule Component
// ---------------------------------------------------------------------------
export function TeamsModule({ selectedLeagues, selectedSeason, onClickTeam, activeTeamId }: TeamsModuleProps) {
  // Get leagues to display based on filter
  const leaguesToShow = useMemo(() => {
    if (selectedLeagues.length === 0) {
      return Object.keys(sportsData) as League[]
    }
    return selectedLeagues.map((gl) => leagueMapping[gl])
  }, [selectedLeagues])

  // Calculate total teams across all visible leagues
  const totalTeams = useMemo(() => {
    return leaguesToShow.reduce((sum, league) => {
      const data = sportsData[league]
      return (
        sum +
        data.conferences.reduce((confSum, conf) => {
          if (conf.subdivisions && conf.subdivisions.length > 0) {
            return confSum + conf.subdivisions.reduce((subSum, sub) => subSum + sub.teams.length, 0)
          }
          return confSum + conf.teams.length
        }, 0)
      )
    }, 0)
  }, [leaguesToShow])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with count */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">All Teams</span>
        <span className="text-sm text-muted-foreground">({totalTeams})</span>
      </div>

      {/* Teams List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-8">
          {leaguesToShow.map((league) => (
            <LeagueSection
              key={league}
              league={league}
              conferences={sportsData[league].conferences}
              onClickTeam={onClickTeam}
              activeTeamId={activeTeamId}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground shrink-0">
        Showing {totalTeams} teams across {leaguesToShow.length} league{leaguesToShow.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}

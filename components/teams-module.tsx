"use client"

import { useState, useMemo } from "react"
import { Search, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { sportsData, type League, type Team, type Conference } from "@/lib/sports-data"
import type { GameLeague } from "@/types/game"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TeamsModuleProps {
  selectedLeagues: GameLeague[]
  selectedSeason: string | null
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
function TeamTile({ team }: { team: Team }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
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
function DivisionSection({ division, searchQuery }: { division: Conference; searchQuery: string }) {
  const filteredTeams = division.teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filteredTeams.length === 0) return null

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {division.name}
      </h5>
      <div className="grid grid-cols-4 gap-2">
        {filteredTeams.map((team) => (
          <TeamTile key={team.id} team={team} />
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
  searchQuery,
  defaultExpanded = true,
}: {
  conference: Conference
  searchQuery: string
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Count total teams in conference (including subdivisions)
  const totalTeams = useMemo(() => {
    if (conference.subdivisions && conference.subdivisions.length > 0) {
      return conference.subdivisions.reduce((sum, sub) => sum + sub.teams.length, 0)
    }
    return conference.teams.length
  }, [conference])

  // Filter teams based on search
  const hasMatchingTeams = useMemo(() => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    
    if (conference.subdivisions && conference.subdivisions.length > 0) {
      return conference.subdivisions.some((sub) =>
        sub.teams.some(
          (team) =>
            team.name.toLowerCase().includes(query) ||
            team.abbreviation.toLowerCase().includes(query)
        )
      )
    }
    
    return conference.teams.some(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.abbreviation.toLowerCase().includes(query)
    )
  }, [conference, searchQuery])

  if (!hasMatchingTeams) return null

  const filteredDirectTeams = conference.teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                searchQuery={searchQuery}
              />
            ))
          ) : (
            /* Render teams directly (College/HS pattern) */
            filteredDirectTeams.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {filteredDirectTeams.map((team) => (
                  <TeamTile key={team.id} team={team} />
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
  searchQuery,
}: {
  league: League
  conferences: Conference[]
  searchQuery: string
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

  // Check if any teams match the search
  const hasMatchingTeams = useMemo(() => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    
    return conferences.some((conf) => {
      if (conf.subdivisions && conf.subdivisions.length > 0) {
        return conf.subdivisions.some((sub) =>
          sub.teams.some(
            (team) =>
              team.name.toLowerCase().includes(query) ||
              team.abbreviation.toLowerCase().includes(query)
          )
        )
      }
      return conf.teams.some(
        (team) =>
          team.name.toLowerCase().includes(query) ||
          team.abbreviation.toLowerCase().includes(query)
      )
    })
  }, [conferences, searchQuery])

  if (!hasMatchingTeams) return null

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
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main TeamsModule Component
// ---------------------------------------------------------------------------
export function TeamsModule({ selectedLeagues, selectedSeason }: TeamsModuleProps) {
  const [searchQuery, setSearchQuery] = useState("")

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

  // Count filtered teams for footer
  const filteredTeamCount = useMemo(() => {
    if (!searchQuery) return totalTeams
    
    const query = searchQuery.toLowerCase()
    return leaguesToShow.reduce((sum, league) => {
      const data = sportsData[league]
      return (
        sum +
        data.conferences.reduce((confSum, conf) => {
          if (conf.subdivisions && conf.subdivisions.length > 0) {
            return (
              confSum +
              conf.subdivisions.reduce(
                (subSum, sub) =>
                  subSum +
                  sub.teams.filter(
                    (team) =>
                      team.name.toLowerCase().includes(query) ||
                      team.abbreviation.toLowerCase().includes(query)
                  ).length,
                0
              )
            )
          }
          return (
            confSum +
            conf.teams.filter(
              (team) =>
                team.name.toLowerCase().includes(query) ||
                team.abbreviation.toLowerCase().includes(query)
            ).length
          )
        }, 0)
      )
    }, 0)
  }, [leaguesToShow, searchQuery, totalTeams])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with count and search */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">All Teams</span>
          <span className="text-sm text-muted-foreground">({totalTeams})</span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-8">
          {leaguesToShow.map((league) => (
            <LeagueSection
              key={league}
              league={league}
              conferences={sportsData[league].conferences}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground shrink-0">
        Showing {filteredTeamCount} teams across {leaguesToShow.length} league{leaguesToShow.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}

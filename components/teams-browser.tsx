"use client"

import { useState, useMemo } from "react"
import { sportsData, type League, type Team, type Conference } from "@/lib/sports-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"

interface TeamsFilterState {
  leagues: Set<League>
  conferences: Set<string>
}

interface TeamsBrowserProps {
  onSelectTeam?: (team: Team) => void
  filters?: TeamsFilterState
}

// Get all teams from a conference, including subdivisions
function getTeamsFromConference(conference: Conference): Team[] {
  const teams = [...conference.teams]
  if (conference.subdivisions) {
    conference.subdivisions.forEach((sub) => {
      teams.push(...getTeamsFromConference(sub))
    })
  }
  return teams
}

// Get total count of teams in a conference
function getConferenceTeamCount(conference: Conference): number {
  return getTeamsFromConference(conference).length
}

export function TeamsBrowser({ onSelectTeam, filters }: TeamsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)

  const allLeagues = Object.keys(sportsData) as League[]
  
  // Filter visible leagues based on sidebar filter
  const leagues = useMemo(() => {
    if (!filters?.leagues || filters.leagues.size === 0) return allLeagues
    return allLeagues.filter((league) => filters.leagues.has(league))
  }, [allLeagues, filters?.leagues])

  // Build filtered data structure with all leagues
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    
    return leagues.map((league) => {
      const data = sportsData[league]
      
      // Filter by conference if any conference filters are active
      let conferencesToShow = data.conferences
      if (filters?.conferences && filters.conferences.size > 0) {
        conferencesToShow = data.conferences.filter((conf) => filters.conferences.has(conf.id))
      }
      
      // Apply search filter
      const filteredConferences = query
        ? conferencesToShow
            .map((conference) => {
              if (conference.subdivisions) {
                const filteredSubs = conference.subdivisions
                  .map((sub) => ({
                    ...sub,
                    teams: sub.teams.filter(
                      (team) =>
                        team.name.toLowerCase().includes(query) ||
                        team.abbreviation.toLowerCase().includes(query)
                    ),
                  }))
                  .filter((sub) => sub.teams.length > 0)

                return filteredSubs.length > 0
                  ? { ...conference, subdivisions: filteredSubs, teams: [] }
                  : null
              }

              const filteredTeams = conference.teams.filter(
                (team) =>
                  team.name.toLowerCase().includes(query) ||
                  team.abbreviation.toLowerCase().includes(query)
              )
              return filteredTeams.length > 0
                ? { ...conference, teams: filteredTeams }
                : null
            })
            .filter(Boolean) as Conference[]
        : conferencesToShow
      
      const teamCount = filteredConferences.reduce(
        (sum, conf) => sum + getConferenceTeamCount(conf),
        0
      )
      
      return {
        league,
        conferences: filteredConferences,
        teamCount,
      }
    }).filter((d) => d.teamCount > 0)
  }, [leagues, searchQuery, filters?.conferences])

  // Count total teams across all visible leagues
  const totalTeamCount = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + d.teamCount, 0)
  }, [filteredData])

  const renderTeamCard = (team: Team) => (
    <button
      key={team.id}
      onClick={() => onSelectTeam?.(team)}
      onMouseEnter={() => setHoveredTeam(team.id)}
      onMouseLeave={() => setHoveredTeam(null)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card transition-all duration-150",
        "hover:border-[#0273e3]/50 hover:bg-[#0273e3]/5",
        hoveredTeam === team.id && "border-[#0273e3]/50 bg-[#0273e3]/5"
      )}
    >
      {/* Team logo placeholder */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: team.logoColor }}
      >
        {team.abbreviation.slice(0, 3)}
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-medium text-foreground truncate w-full text-left">
          {team.name}
        </span>
        <span className="text-xs text-muted-foreground">{team.abbreviation}</span>
      </div>
    </button>
  )

  const getLeagueLabel = (league: League) => {
    if (league === "NCAA (FBS)") return "College"
    if (league === "High School") return "High School"
    return league
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with search */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">All Teams</span>
          <span className="text-xs text-muted-foreground">({totalTeamCount})</span>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0273e3]/50 focus:border-[#0273e3]"
          />
        </div>
      </div>

      {/* Teams list grouped by league */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Icon name="search" className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No teams found{searchQuery && ` matching "${searchQuery}"`}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredData.map(({ league, conferences, teamCount }) => (
                <div key={league}>
                  {/* League header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                    <h2 className="text-sm font-semibold text-foreground">{getLeagueLabel(league)}</h2>
                    <span className="text-xs text-muted-foreground">({teamCount} teams)</span>
                  </div>
                  
                  {/* Conferences within league */}
                  <Accordion 
                    type="multiple" 
                    defaultValue={conferences.map((c) => `${league}-${c.id}`)} 
                    className="space-y-1"
                  >
                    {conferences.map((conference) => (
                      <AccordionItem 
                        key={`${league}-${conference.id}`} 
                        value={`${league}-${conference.id}`} 
                        className="border-none"
                      >
                        <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{conference.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({getConferenceTeamCount(conference)})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          {conference.subdivisions && conference.subdivisions.length > 0 ? (
                            <div className="space-y-3 pl-2">
                              {conference.subdivisions.map((division) => (
                                <div key={division.id}>
                                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                                    {division.name}
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                    {division.teams.map(renderTeamCard)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pl-2">
                              {conference.teams.map(renderTeamCard)}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with total count */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Showing {totalTeamCount} teams across {filteredData.length} league{filteredData.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}

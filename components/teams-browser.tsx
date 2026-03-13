"use client"

import { useState, useMemo } from "react"
import { sportsData, type League, type Team, type Conference } from "@/lib/sports-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"

interface TeamsBrowserProps {
  onSelectTeam?: (team: Team) => void
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

export function TeamsBrowser({ onSelectTeam }: TeamsBrowserProps) {
  const [activeLeague, setActiveLeague] = useState<League>("NFL")
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)

  const leagues = Object.keys(sportsData) as League[]

  // Filter teams based on search query
  const filteredConferences = useMemo(() => {
    const data = sportsData[activeLeague]
    if (!searchQuery.trim()) return data.conferences

    const query = searchQuery.toLowerCase()
    return data.conferences
      .map((conference) => {
        // For NFL with subdivisions
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

        // For conferences without subdivisions
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
  }, [activeLeague, searchQuery])

  // Count total teams for each league
  const leagueCounts = useMemo(() => {
    const counts: Record<League, number> = {} as Record<League, number>
    leagues.forEach((league) => {
      counts[league] = sportsData[league].conferences.reduce(
        (sum, conf) => sum + getConferenceTeamCount(conf),
        0
      )
    })
    return counts
  }, [leagues])

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

  const renderConference = (conference: Conference) => {
    // Handle NFL-style conferences with subdivisions (divisions)
    if (conference.subdivisions && conference.subdivisions.length > 0) {
      return (
        <AccordionItem key={conference.id} value={conference.id} className="border-none">
          <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{conference.name}</span>
              <span className="text-xs text-muted-foreground">
                ({getConferenceTeamCount(conference)} teams)
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
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
          </AccordionContent>
        </AccordionItem>
      )
    }

    // Handle flat conferences (college, high school)
    return (
      <AccordionItem key={conference.id} value={conference.id} className="border-none">
        <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{conference.name}</span>
            <span className="text-xs text-muted-foreground">
              ({conference.teams.length} teams)
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pl-2">
            {conference.teams.map(renderTeamCard)}
          </div>
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with league tabs and search */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/50">
        {/* League tabs */}
        <div className="flex items-center gap-1">
          {leagues.map((league) => (
            <button
              key={league}
              onClick={() => {
                setActiveLeague(league)
                setSearchQuery("")
              }}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeLeague === league
                  ? "bg-[#0273e3] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {league === "NCAA (FBS)" ? "College" : league === "High School" ? "HS" : league}
              <span className="ml-1.5 text-xs opacity-70">({leagueCounts[league]})</span>
            </button>
          ))}
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

      {/* Teams list */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredConferences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Icon name="search" className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No teams found matching "{searchQuery}"</p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={filteredConferences.map((c) => c.id)} className="space-y-1">
              {filteredConferences.map(renderConference)}
            </Accordion>
          )}
        </div>
      </ScrollArea>

      {/* Footer with total count */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          {leagueCounts[activeLeague]} teams in {activeLeague}
        </p>
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { getAthletesForTeam } from "@/lib/mock-teams"
import { Search } from "lucide-react"
import type { Team } from "@/lib/sports-data"
import type { Athlete } from "@/types/athlete"

interface RosterListModuleProps {
  team: Team
  onClickAthlete?: (athlete: Athlete & { id: string }) => void
}

export function RosterListModule({ team, onClickAthlete }: RosterListModuleProps) {
  const [search, setSearch] = useState("")
  const [positionFilter, setPositionFilter] = useState<string>("All")
  
  const athletes = useMemo(() => getAthletesForTeam(team.id), [team.id])
  
  // Get unique positions
  const positions = useMemo(() => {
    const posSet = new Set(athletes.map(a => a.position))
    return ["All", ...Array.from(posSet).sort()]
  }, [athletes])
  
  // Filter athletes
  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(search.toLowerCase())
      const matchesPosition = positionFilter === "All" || athlete.position === positionFilter
      return matchesSearch && matchesPosition
    })
  }, [athletes, search, positionFilter])
  
  // Group by position
  const groupedAthletes = useMemo(() => {
    if (positionFilter !== "All") {
      return { [positionFilter]: filteredAthletes }
    }
    const groups: Record<string, typeof filteredAthletes> = {}
    const posOrder = ["QB", "RB", "WR", "TE", "OL", "DL", "DE", "DT", "LB", "CB", "S", "K", "P"]
    filteredAthletes.forEach(athlete => {
      if (!groups[athlete.position]) groups[athlete.position] = []
      groups[athlete.position].push(athlete)
    })
    // Sort groups by position priority
    const sorted: Record<string, typeof filteredAthletes> = {}
    posOrder.forEach(pos => { if (groups[pos]) sorted[pos] = groups[pos] })
    Object.keys(groups).forEach(pos => { if (!sorted[pos]) sorted[pos] = groups[pos] })
    return sorted
  }, [filteredAthletes, positionFilter])

  return (
    <div className="h-full flex flex-col bg-background rounded-r-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground mb-3">Roster</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        
        {/* Position Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {positions.slice(0, 8).map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                positionFilter === pos
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
      
      {/* Roster List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedAthletes).map(([position, players]) => (
          <div key={position}>
            {positionFilter === "All" && (
              <div className="px-4 py-2 bg-muted/30 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{position}</span>
                <span className="text-xs text-muted-foreground ml-2">({players.length})</span>
              </div>
            )}
            {players.map((athlete) => (
              <button
                key={athlete.id}
                onClick={() => onClickAthlete?.(athlete as Athlete & { id: string })}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/50"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {athlete.jersey_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{athlete.name}</p>
                  <p className="text-xs text-muted-foreground">{athlete.position} · {athlete.height} · {athlete.weight} lbs</p>
                </div>
              </button>
            ))}
          </div>
        ))}
        
        {filteredAthletes.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No players found
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-muted/30 shrink-0">
        <span className="text-xs text-muted-foreground">{filteredAthletes.length} players</span>
      </div>
    </div>
  )
}

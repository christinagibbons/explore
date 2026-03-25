"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { athletes } from "@/lib/athletes-data"
import type { Athlete } from "@/types/athlete"
import type { GameLeague } from "@/types/game"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AthletesModuleProps {
  selectedLeagues: GameLeague[]
  selectedSeason: string | null
  onClickAthlete?: (athlete: Athlete & { id: string }) => void
  activeAthleteId?: string
}

type SortField = "name" | "position" | "team" | "jersey_number" | "college"
type SortDirection = "asc" | "desc"

// ---------------------------------------------------------------------------
// League mapping for athletes
// ---------------------------------------------------------------------------

const LEAGUE_MAP: Record<string, GameLeague> = {
  NFL: "NFL",
  College: "College",
  "High School": "High School",
}

// ---------------------------------------------------------------------------
// AthletesModule Component
// ---------------------------------------------------------------------------

export function AthletesModule({
  selectedLeagues,
  selectedSeason,
  onClickAthlete,
  activeAthleteId,
}: AthletesModuleProps) {
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Filter athletes by selected leagues and search query
  const filteredAthletes = useMemo(() => {
    let result = [...athletes]

    // Filter by leagues if any are selected
    if (selectedLeagues.length > 0) {
      result = result.filter((athlete) => {
        const athleteLeague = LEAGUE_MAP[athlete.league]
        return athleteLeague && selectedLeagues.includes(athleteLeague)
      })
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      
      // Handle null/undefined
      if (aVal == null) aVal = ""
      if (bVal == null) bVal = ""

      // Convert to strings for comparison
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })

    return result
  }, [selectedLeagues, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="chevron-down" className="w-3 h-3 opacity-0 group-hover:opacity-50" />
    }
    return sortDirection === "asc" ? (
      <Icon name="chevron-up" className="w-3 h-3" />
    ) : (
      <Icon name="chevron-down" className="w-3 h-3" />
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with count */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">All Athletes</span>
        <span className="text-sm text-muted-foreground">({filteredAthletes.length})</span>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead
                className="w-[200px] cursor-pointer select-none group"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className="w-[80px] cursor-pointer select-none group"
                onClick={() => handleSort("position")}
              >
                <div className="flex items-center gap-1">
                  Pos
                  <SortIcon field="position" />
                </div>
              </TableHead>
              <TableHead
                className="w-[100px] cursor-pointer select-none group"
                onClick={() => handleSort("team")}
              >
                <div className="flex items-center gap-1">
                  Team
                  <SortIcon field="team" />
                </div>
              </TableHead>
              <TableHead
                className="w-[60px] cursor-pointer select-none group"
                onClick={() => handleSort("jersey_number")}
              >
                <div className="flex items-center gap-1">
                  #
                  <SortIcon field="jersey_number" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none group"
                onClick={() => handleSort("college")}
              >
                <div className="flex items-center gap-1">
                  College
                  <SortIcon field="college" />
                </div>
              </TableHead>
              <TableHead className="w-[100px]">League</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAthletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No athletes found
                </TableCell>
              </TableRow>
            ) : (
              filteredAthletes.map((athlete) => (
                <TableRow
                  key={athlete.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    activeAthleteId === athlete.id
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onClickAthlete?.(athlete)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {athlete.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="truncate">{athlete.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded bg-muted text-xs font-medium">
                      {athlete.position}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{athlete.team}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {athlete.jersey_number}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">
                    {athlete.college || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        athlete.league === "NFL"
                          ? "bg-blue-500/20 text-blue-400"
                          : athlete.league === "College"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {athlete.league}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground shrink-0">
        Showing {filteredAthletes.length} athlete{filteredAthletes.length !== 1 ? "s" : ""}
        {selectedLeagues.length > 0 && ` in ${selectedLeagues.join(", ")}`}
      </div>
    </div>
  )
}

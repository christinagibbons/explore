"use client"

import { useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockGames } from "@/lib/mock-games"
import type { GameLeague } from "@/types/game"
import { FilterRow } from "@/components/filters/filter-row"
import { ToggleButton } from "@/components/filters/toggle-button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GamesFiltersModuleProps {
  selectedLeagues: GameLeague[]
  selectedSeason: string | null
  onLeagueToggle: (league: GameLeague) => void
  onSeasonChange: (season: string | null) => void
  onClear: () => void
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function GamesFiltersModule({
  selectedLeagues,
  selectedSeason,
  onLeagueToggle,
  onSeasonChange,
  onClear,
}: GamesFiltersModuleProps) {
  // Calculate active filter count
  const activeFilterCount = selectedLeagues.length + (selectedSeason ? 1 : 0)

  // Get unique seasons from games
  const seasons = useMemo(() => {
    const seasonSet = new Set(mockGames.map((g) => g.season))
    return Array.from(seasonSet).sort((a, b) => b.localeCompare(a))
  }, [])

  // Get game counts by league (considering season filter)
  const leagueCounts = useMemo(() => {
    let filtered = mockGames
    if (selectedSeason) {
      filtered = filtered.filter((g) => g.season === selectedSeason)
    }
    return {
      NFL: filtered.filter((g) => g.league === "NFL").length,
      College: filtered.filter((g) => g.league === "College").length,
      HighSchool: filtered.filter((g) => g.league === "HighSchool").length,
    }
  }, [selectedSeason])

  const leagues: { league: GameLeague; label: string }[] = [
    { league: "NFL", label: "NFL" },
    { league: "College", label: "College" },
    { league: "HighSchool", label: "High School" },
  ]

  // Check if all leagues are selected (for the FilterRow circle)
  const allLeaguesSelected = leagues.every(({ league }) => selectedLeagues.includes(league))
  const hasLeagueSelected = selectedLeagues.length > 0

  // Toggle all leagues at once
  const handleToggleAllLeagues = () => {
    if (hasLeagueSelected) {
      // Clear all leagues
      leagues.forEach(({ league }) => {
        if (selectedLeagues.includes(league)) {
          onLeagueToggle(league)
        }
      })
    } else {
      // Select all leagues
      leagues.forEach(({ league }) => {
        if (!selectedLeagues.includes(league)) {
          onLeagueToggle(league)
        }
      })
    }
  }

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Sections — using Accordion like FiltersModule */}
      <ScrollArea className="flex-1 overflow-hidden">
        <Accordion
          type="multiple"
          defaultValue={["season", "league"]}
          className="px-4"
        >
          {/* Season Section */}
          <AccordionItem value="season" className="border-b border-border">
            <AccordionTrigger className="py-3 hover:no-underline text-sm font-semibold text-foreground [&>svg]:text-muted-foreground">
              Season
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSeasonChange(null)}
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        selectedSeason
                          ? "border-blue-600 bg-blue-600"
                          : "border-muted-foreground/40 bg-background hover:border-muted-foreground/60"
                      }`}
                    >
                      {selectedSeason && (
                        <div className="w-1.5 h-1.5 rounded-full bg-background" />
                      )}
                    </button>
                    <span className="text-sm text-foreground">Season</span>
                  </div>
                </div>
                <Select
                  value={selectedSeason || "all"}
                  onValueChange={(value) => onSeasonChange(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full h-9 text-sm border-border text-muted-foreground">
                    <SelectValue placeholder="All Seasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {seasons.map((season) => (
                      <SelectItem key={season} value={season}>
                        {season} Season
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* League Section */}
          <AccordionItem value="league" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline text-sm font-semibold text-foreground [&>svg]:text-muted-foreground">
              League
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleAllLeagues}
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        hasLeagueSelected
                          ? "border-blue-600 bg-blue-600"
                          : "border-muted-foreground/40 bg-background hover:border-muted-foreground/60"
                      }`}
                    >
                      {hasLeagueSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-background" />
                      )}
                    </button>
                    <span className="text-sm text-foreground">League</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {leagues.map(({ league, label }) => (
                    <ToggleButton
                      key={league}
                      label={`${label} (${leagueCounts[league]})`}
                      isSelected={selectedLeagues.includes(league)}
                      onClick={() => onLeagueToggle(league)}
                    />
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  )
}

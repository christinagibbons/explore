"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { sportsData, type League } from "@/lib/sports-data"
import { cn } from "@/lib/utils"

export interface TeamsFilterState {
  leagues: Set<League>
  conferences: Set<string>
}

interface TeamsFiltersModuleProps {
  filters: TeamsFilterState
  onToggleLeague: (league: League) => void
  onToggleConference: (conferenceId: string) => void
  onClear: () => void
  activeFilterCount: number
}

export function TeamsFiltersModule({
  filters,
  onToggleLeague,
  onToggleConference,
  onClear,
  activeFilterCount,
}: TeamsFiltersModuleProps) {
  const leagues = Object.keys(sportsData) as League[]

  // Get all conferences for each league
  const conferencesByLeague = leagues.reduce((acc, league) => {
    acc[league] = sportsData[league].conferences.map((conf) => ({
      id: conf.id,
      name: conf.name,
    }))
    return acc
  }, {} as Record<League, { id: string; name: string }[]>)

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

      {/* Filter Sections */}
      <ScrollArea className="flex-1 overflow-hidden">
        <Accordion
          type="multiple"
          defaultValue={["league", "conference"]}
          className="px-4"
        >
          {/* League Filter */}
          <AccordionItem value="league" className="border-b border-border">
            <AccordionTrigger className="py-3 hover:no-underline text-sm font-semibold text-foreground [&>svg]:text-muted-foreground">
              League
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2">
              {leagues.map((league) => {
                const isSelected = filters.leagues.has(league)
                const displayName = league === "NCAA (FBS)" ? "College (FBS)" : league === "High School" ? "High School" : league
                return (
                  <label
                    key={league}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                      isSelected ? "bg-[#0273e3]/10" : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleLeague(league)}
                      className="data-[state=checked]:bg-[#0273e3] data-[state=checked]:border-[#0273e3]"
                    />
                    <span className="text-sm text-foreground">{displayName}</span>
                  </label>
                )
              })}
            </AccordionContent>
          </AccordionItem>

          {/* Conference Filter */}
          <AccordionItem value="conference" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline text-sm font-semibold text-foreground [&>svg]:text-muted-foreground">
              Conference / Region
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              {leagues.map((league) => {
                const conferences = conferencesByLeague[league]
                const displayLeagueName = league === "NCAA (FBS)" ? "College" : league === "High School" ? "HS" : league
                return (
                  <div key={league}>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                      {displayLeagueName}
                    </h4>
                    <div className="space-y-1">
                      {conferences.map((conf) => {
                        const isSelected = filters.conferences.has(conf.id)
                        return (
                          <label
                            key={conf.id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer transition-colors",
                              isSelected ? "bg-[#0273e3]/10" : "hover:bg-muted/50"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => onToggleConference(conf.id)}
                              className="data-[state=checked]:bg-[#0273e3] data-[state=checked]:border-[#0273e3]"
                            />
                            <span className="text-sm text-foreground">{conf.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  )
}

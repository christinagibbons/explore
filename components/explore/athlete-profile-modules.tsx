"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/icon"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTeamForAthlete } from "@/lib/mock-teams"
import type { Athlete } from "@/types/athlete"
import type { Team } from "@/lib/sports-data"
import type { ClipData } from "@/types/library"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

const TEAM_FULL_NAMES: Record<string, string> = {
  BAL: "Baltimore Ravens", BUF: "Buffalo Bills", KC: "Kansas City Chiefs",
  DET: "Detroit Lions", CIN: "Cincinnati Bengals", HOU: "Houston Texans",
  SF: "San Francisco 49ers", PHI: "Philadelphia Eagles", MIN: "Minnesota Vikings",
  MIA: "Miami Dolphins", DAL: "Dallas Cowboys", LAR: "Los Angeles Rams",
  NYJ: "New York Jets", ATL: "Atlanta Falcons", LV: "Las Vegas Raiders",
  CLE: "Cleveland Browns", NYG: "New York Giants", PIT: "Pittsburgh Steelers",
  DEN: "Denver Broncos", IND: "Indianapolis Colts", NE: "New England Patriots",
  TB: "Tampa Bay Buccaneers", JAX: "Jacksonville Jaguars", LAC: "Los Angeles Chargers",
  CHI: "Chicago Bears", GB: "Green Bay Packers",
  UGA: "Georgia Bulldogs", TEX: "Texas Longhorns", OSU: "Ohio State Buckeyes",
  ORE: "Oregon Ducks", ALA: "Alabama Crimson Tide", MICH: "Michigan Wolverines",
  PSU: "Penn State Nittany Lions", MIAMI: "Miami Hurricanes", CLEM: "Clemson Tigers",
  LSU: "LSU Tigers",
  MDM: "Mater Dei Monarchs", SJB: "St. John Bosco Braves", IMG: "IMG Academy Ascenders",
  SLC: "Southlake Carroll Dragons", NSM: "North Shore Mustangs", STA: "St. Thomas Aquinas Raiders",
  DLS: "De La Salle Spartans", BUFD: "Buford Wolves", KATY: "Katy Tigers",
  DUN: "Duncanville Panthers",
}

const SEASONS = ["2025/26", "2024/25", "2023/24", "2022/23", "2021/22"]

// Mock clips for athlete
const MOCK_ATHLETE_CLIPS: ClipData[] = [
  { id: "clip-1", playNumber: 1, odk: "O", quarter: 1, down: 1, distance: 10, yardLine: "25", hash: "M", yards: 15, result: "Complete", gainLoss: "Gn", game: "vs Ravens" },
  { id: "clip-2", playNumber: 2, odk: "O", quarter: 1, down: 2, distance: 5, yardLine: "40", hash: "L", yards: 8, result: "Rush", gainLoss: "Gn", game: "vs Ravens" },
  { id: "clip-3", playNumber: 3, odk: "O", quarter: 2, down: 1, distance: 10, yardLine: "32", hash: "R", yards: 32, result: "TD", gainLoss: "Gn", game: "vs Steelers" },
  { id: "clip-4", playNumber: 4, odk: "O", quarter: 3, down: 3, distance: 7, yardLine: "45", hash: "M", yards: 12, result: "Complete", gainLoss: "Gn", game: "vs Browns" },
  { id: "clip-5", playNumber: 5, odk: "O", quarter: 4, down: 1, distance: 10, yardLine: "20", hash: "L", yards: -2, result: "Sack", gainLoss: "Ls", game: "vs Bengals" },
  { id: "clip-6", playNumber: 6, odk: "O", quarter: 4, down: 2, distance: 12, yardLine: "18", hash: "M", yards: 18, result: "TD", gainLoss: "Gn", game: "vs Bengals" },
]

/** Return position-relevant stats for an athlete */
function getKeyStatsForAthlete(athlete: Athlete): { label: string; value: string; secondary?: string; note?: string }[] {
  const s = athlete.stats
  const pos = athlete.position

  if (pos === "QB") {
    return [
      { label: "Pass Yards", value: s.passing_yards.toLocaleString(), secondary: `/ ${s.passing_tds} TDs`, note: "Season total" },
      { label: "Passer Rating", value: ((s.passing_tds / Math.max(s.passing_yards / 250, 1)) * 30 + 65).toFixed(1), note: "Estimated" },
      { label: "Rush Yards", value: s.rushing_yards.toLocaleString(), secondary: `/ ${s.rushing_tds} TDs`, note: "Dual threat" },
      { label: "Total TDs", value: (s.passing_tds + s.rushing_tds).toString(), note: "Pass + Rush" },
      { label: "YPG", value: (s.passing_yards / 17).toFixed(1), note: "Yards per game avg" },
      { label: "Comp %", value: (58 + (hashString(athlete.name) % 12)).toFixed(1) + "%", note: "Estimated" },
    ]
  }

  if (pos === "RB") {
    return [
      { label: "Rush Yards", value: s.rushing_yards.toLocaleString(), secondary: `/ ${s.rushing_tds} TDs`, note: "Season total" },
      { label: "YPC", value: (s.rushing_yards / Math.max((s.rushing_yards / 4.5), 1)).toFixed(1), note: "Yards per carry" },
      { label: "Rec Yards", value: s.receiving_yards.toLocaleString(), secondary: `/ ${s.receiving_tds} TDs`, note: "Receiving" },
      { label: "Total TDs", value: (s.rushing_tds + s.receiving_tds).toString(), note: "Rush + Rec" },
      { label: "Scrimmage", value: (s.rushing_yards + s.receiving_yards).toLocaleString(), note: "Total yards" },
      { label: "Rush YPG", value: (s.rushing_yards / 17).toFixed(1), note: "Yards per game avg" },
    ]
  }

  if (pos === "WR" || pos === "TE") {
    return [
      { label: "Rec Yards", value: s.receiving_yards.toLocaleString(), secondary: `/ ${s.receiving_tds} TDs`, note: "Season total" },
      { label: "Rec/Game", value: ((s.receiving_yards / 12) / 17).toFixed(1), note: "Receptions avg" },
      { label: "YPR", value: (s.receiving_yards / Math.max(s.receiving_yards / 12, 1)).toFixed(1), note: "Yards per reception" },
      { label: "Total TDs", value: (s.receiving_tds + s.rushing_tds).toString(), note: "All touchdowns" },
      { label: "Rec YPG", value: (s.receiving_yards / 17).toFixed(1), note: "Yards per game avg" },
      { label: "Targets", value: Math.floor(s.receiving_yards / 8).toString(), note: "Estimated" },
    ]
  }

  // Defensive positions
  if (["DE", "DT", "LB", "CB", "S"].includes(pos)) {
    return [
      { label: "Tackles", value: s.tackles.toString(), note: "Season total" },
      { label: "Sacks", value: s.sacks.toFixed(1), note: "Season total" },
      { label: "TFL", value: Math.floor(s.tackles * 0.15).toString(), note: "Tackles for loss" },
      { label: "QB Hits", value: Math.floor(s.sacks * 2.5).toString(), note: "Estimated" },
      { label: "PD", value: Math.floor(hashString(athlete.name) % 12 + 3).toString(), note: "Passes defended" },
      { label: "INT", value: Math.floor(hashString(athlete.name) % 4).toString(), note: "Interceptions" },
    ]
  }

  // Default
  return [
    { label: "Games", value: "17", note: "Season" },
    { label: "Starts", value: "17", note: "Season" },
  ]
}

// ---------------------------------------------------------------------------
// Module Components
// ---------------------------------------------------------------------------

interface ModuleContainerProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function ModuleContainer({ title, children, action, className }: ModuleContainerProps) {
  return (
    <div className={cn("bg-background rounded-xl border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Athlete Overview Module
// ---------------------------------------------------------------------------

interface AthleteOverviewModuleProps {
  athlete: Athlete & { id?: string }
  onNavigateToTeam?: (team: Team) => void
}

export function AthleteOverviewModule({ athlete, onNavigateToTeam }: AthleteOverviewModuleProps) {
  const teamName = TEAM_FULL_NAMES[athlete.team] || athlete.team
  const teamInfo = useMemo(() => getTeamForAthlete(athlete.id || ""), [athlete.id])
  
  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      {/* Header with athlete info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
            {athlete.name.split(" ").map((n) => n[0]).join("")}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground mb-1">{athlete.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {teamInfo ? (
                <button 
                  onClick={() => onNavigateToTeam?.(teamInfo)}
                  className="text-primary font-medium hover:underline"
                >
                  {teamName}
                </button>
              ) : (
                <span className="text-primary font-medium">{teamName}</span>
              )}
              <span className="text-border">{"·"}</span>
              <span>{athlete.position}</span>
              <span className="text-border">{"·"}</span>
              <span>#{athlete.jersey_number}</span>
            </div>
            
            {/* Quick stats row */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-muted-foreground">{athlete.height}</span>
              <span className="text-muted-foreground">{athlete.weight} lbs</span>
              <span className="text-muted-foreground">{athlete.college}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Identity details */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Height</p>
            <p className="text-sm font-medium text-foreground">{athlete.height}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Weight</p>
            <p className="text-sm font-medium text-foreground">{athlete.weight} lbs</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">College</p>
            <p className="text-sm font-medium text-foreground">{athlete.college}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">League</p>
            <p className="text-sm font-medium text-foreground">{athlete.league}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Athlete Stats Module
// ---------------------------------------------------------------------------

interface AthleteStatsModuleProps {
  athlete: Athlete & { id?: string }
  selectedSeason: string
  onSeasonChange: (season: string) => void
}

export function AthleteStatsModule({ athlete, selectedSeason, onSeasonChange }: AthleteStatsModuleProps) {
  const keyStats = useMemo(() => getKeyStatsForAthlete(athlete), [athlete])
  
  return (
    <ModuleContainer 
      title="Key Stats"
      action={
        <Select value={selectedSeason} onValueChange={onSeasonChange}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map((season) => (
              <SelectItem key={season} value={season} className="text-xs">
                {season}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {keyStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border p-3 bg-muted/20">
            <p className="text-xs font-semibold text-primary mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              {stat.secondary && (
                <span className="text-xs text-muted-foreground">{stat.secondary}</span>
              )}
            </div>
            {stat.note && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.note}</p>
            )}
          </div>
        ))}
      </div>
    </ModuleContainer>
  )
}

// ---------------------------------------------------------------------------
// Athlete Video Module (Clips Grid)
// ---------------------------------------------------------------------------

interface AthleteVideoModuleProps {
  athlete: Athlete & { id?: string }
  selectedSeason: string
  onClickClip?: (clip: ClipData) => void
  activeClipId?: string | null
}

export function AthleteVideoModule({ athlete, selectedSeason, onClickClip, activeClipId }: AthleteVideoModuleProps) {
  // In a real app, this would filter clips by athlete and season
  const clips = MOCK_ATHLETE_CLIPS
  
  return (
    <ModuleContainer 
      title="Video"
      action={
        <span className="text-xs text-muted-foreground">{clips.length} clips</span>
      }
    >
      <div className="space-y-1">
        {clips.map((clip) => (
          <button
            key={clip.id}
            onClick={() => onClickClip?.(clip)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
              activeClipId === clip.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded flex items-center justify-center shrink-0",
              activeClipId === clip.id ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              <Icon name="play" className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                activeClipId === clip.id ? "text-primary-foreground" : "text-foreground"
              )}>
                Play #{clip.playNumber} - {clip.result}
              </p>
              <p className={cn(
                "text-xs truncate",
                activeClipId === clip.id ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                Q{clip.quarter} · {clip.down}&{clip.distance} · {clip.yards > 0 ? "+" : ""}{clip.yards} yds · {clip.game}
              </p>
            </div>
          </button>
        ))}
      </div>
      
      {clips.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No clips available for {selectedSeason}
        </div>
      )}
    </ModuleContainer>
  )
}

// ---------------------------------------------------------------------------
// Athlete Reports Module
// ---------------------------------------------------------------------------

interface AthleteReportsModuleProps {
  athlete: Athlete & { id?: string }
}

export function AthleteReportsModule({ athlete }: AthleteReportsModuleProps) {
  return (
    <ModuleContainer title="Reports">
      <div className="py-6 text-center text-sm text-muted-foreground">
        <Icon name="fileText" className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>Reports will appear here</p>
      </div>
    </ModuleContainer>
  )
}

// ---------------------------------------------------------------------------
// Main Athlete Profile Modules Component
// ---------------------------------------------------------------------------

interface AthleteProfileModulesProps {
  athlete: Athlete & { id?: string }
  onNavigateToTeam?: (team: Team) => void
  onClickClip?: (clip: ClipData) => void
  activeClipId?: string | null
}

export function AthleteProfileModules({ 
  athlete, 
  onNavigateToTeam,
  onClickClip,
  activeClipId,
}: AthleteProfileModulesProps) {
  const [selectedSeason, setSelectedSeason] = useState(SEASONS[0])
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4 p-4">
        {/* Overview Module */}
        <AthleteOverviewModule 
          athlete={athlete} 
          onNavigateToTeam={onNavigateToTeam}
        />
        
        {/* Stats Module */}
        <AthleteStatsModule 
          athlete={athlete}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
        />
        
        {/* Video Module */}
        <AthleteVideoModule 
          athlete={athlete}
          selectedSeason={selectedSeason}
          onClickClip={onClickClip}
          activeClipId={activeClipId}
        />
        
        {/* Reports Module */}
        <AthleteReportsModule athlete={athlete} />
      </div>
    </div>
  )
}

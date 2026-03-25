"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { getTeamForAthlete } from "@/lib/mock-teams"
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react"
import { ScopeSelector } from "./scope-selector"
import type { Athlete } from "@/types/athlete"
import type { Team } from "@/lib/sports-data"

// Team full names mapping
const TEAM_FULL_NAMES: Record<string, string> = {
  KC: "Kansas City Chiefs",
  SF: "San Francisco 49ers",
  BUF: "Buffalo Bills",
  DAL: "Dallas Cowboys",
  PHI: "Philadelphia Eagles",
  MIA: "Miami Dolphins",
  CIN: "Cincinnati Bengals",
  BAL: "Baltimore Ravens",
  DET: "Detroit Lions",
  MIN: "Minnesota Vikings",
  GB: "Green Bay Packers",
  CHI: "Chicago Bears",
  LAR: "Los Angeles Rams",
  SEA: "Seattle Seahawks",
  NYG: "New York Giants",
  WAS: "Washington Commanders",
  DEN: "Denver Broncos",
  LV: "Las Vegas Raiders",
  LAC: "Los Angeles Chargers",
  NE: "New England Patriots",
  NYJ: "New York Jets",
  JAX: "Jacksonville Jaguars",
  TEN: "Tennessee Titans",
  IND: "Indianapolis Colts",
  HOU: "Houston Texans",
  CLE: "Cleveland Browns",
  PIT: "Pittsburgh Steelers",
  ATL: "Atlanta Falcons",
  NO: "New Orleans Saints",
  TB: "Tampa Bay Buccaneers",
  CAR: "Carolina Panthers",
  ARI: "Arizona Cardinals",
}

interface GamePerformance {
  week: string
  opponent: string
  result: string
  statLine: string
  grade: number
}

interface AthleteOverviewProps {
  athlete: Athlete & { id: string }
  onNavigateToTeam?: (team: Team) => void
  onClickStat?: (statLabel: string) => void
  onClickGame?: (game: GamePerformance) => void
  /** Compact mode for preview panels - uses single-column layout */
  compact?: boolean
}

// Helper to get key stats based on position
function getKeyStatsForAthlete(athlete: Athlete) {
  const stats = athlete.stats
  const position = athlete.position

  if (["QB"].includes(position)) {
    return [
      { label: "Pass Yards", value: stats.passing_yards?.toLocaleString() ?? "0", trend: "up" as const, change: "+12%" },
      { label: "Pass TDs", value: stats.passing_tds?.toString() ?? "0", trend: "up" as const, change: "+3" },
      { label: "QBR", value: "72.4", trend: "neutral" as const, change: "—" },
      { label: "Comp %", value: "67.2%", trend: "down" as const, change: "-2.1%" },
    ]
  }
  if (["RB", "FB"].includes(position)) {
    return [
      { label: "Rush Yards", value: stats.rushing_yards?.toLocaleString() ?? "0", trend: "up" as const, change: "+8%" },
      { label: "Rush TDs", value: stats.rushing_tds?.toString() ?? "0", trend: "up" as const, change: "+2" },
      { label: "YPC", value: "5.2", trend: "up" as const, change: "+0.4" },
      { label: "Rec Yards", value: stats.receiving_yards?.toLocaleString() ?? "0", trend: "neutral" as const, change: "—" },
    ]
  }
  if (["WR", "TE"].includes(position)) {
    return [
      { label: "Rec Yards", value: stats.receiving_yards?.toLocaleString() ?? "0", trend: "up" as const, change: "+15%" },
      { label: "Rec TDs", value: stats.receiving_tds?.toString() ?? "0", trend: "up" as const, change: "+1" },
      { label: "Targets", value: "142", trend: "up" as const, change: "+18" },
      { label: "Catch %", value: "71.8%", trend: "down" as const, change: "-3.2%" },
    ]
  }
  if (["DE", "DT", "NT", "LB", "OLB", "ILB", "MLB"].includes(position)) {
    return [
      { label: "Tackles", value: stats.tackles?.toString() ?? "0", trend: "up" as const, change: "+12" },
      { label: "Sacks", value: stats.sacks?.toFixed(1) ?? "0", trend: "up" as const, change: "+2.5" },
      { label: "TFLs", value: "18", trend: "up" as const, change: "+4" },
      { label: "QB Hits", value: "32", trend: "up" as const, change: "+8" },
    ]
  }
  if (["CB", "S", "FS", "SS", "DB"].includes(position)) {
    return [
      { label: "Tackles", value: stats.tackles?.toString() ?? "0", trend: "neutral" as const, change: "—" },
      { label: "INTs", value: "4", trend: "up" as const, change: "+2" },
      { label: "Pass Def", value: "14", trend: "up" as const, change: "+5" },
      { label: "Passer Rtg", value: "62.3", trend: "down" as const, change: "-8.2" },
    ]
  }
  return [
    { label: "Games", value: "16", trend: "neutral" as const, change: "—" },
    { label: "Starts", value: "16", trend: "neutral" as const, change: "—" },
    { label: "Snaps", value: "1,042", trend: "up" as const, change: "+58" },
    { label: "Snap %", value: "92%", trend: "up" as const, change: "+4%" },
  ]
}

// Advanced stats by position
function getAdvancedStatsForAthlete(athlete: Athlete) {
  const position = athlete.position

  if (["QB"].includes(position)) {
    return [
      { label: "EPA/Play", value: "+0.18", rank: "4th", percentile: 92 },
      { label: "CPOE", value: "+3.2%", rank: "7th", percentile: 85 },
      { label: "Avg Depth", value: "8.4 yds", rank: "12th", percentile: 72 },
      { label: "Pressure %", value: "28.4%", rank: "18th", percentile: 58 },
      { label: "Time to Throw", value: "2.71s", rank: "9th", percentile: 78 },
      { label: "Play Action %", value: "24.2%", rank: "15th", percentile: 65 },
    ]
  }
  if (["RB", "FB"].includes(position)) {
    return [
      { label: "Yards After Contact", value: "3.2", rank: "3rd", percentile: 94 },
      { label: "Broken Tackles", value: "42", rank: "5th", percentile: 88 },
      { label: "Elusive Rating", value: "87.2", rank: "8th", percentile: 82 },
      { label: "10+ Yard Runs", value: "28", rank: "6th", percentile: 86 },
      { label: "Stuff %", value: "14.2%", rank: "11th", percentile: 75 },
      { label: "Pass Block Grade", value: "72.4", rank: "18th", percentile: 62 },
    ]
  }
  if (["WR", "TE"].includes(position)) {
    return [
      { label: "Separation", value: "3.2 yds", rank: "6th", percentile: 88 },
      { label: "YAC/Rec", value: "5.8", rank: "9th", percentile: 79 },
      { label: "Contested Catch %", value: "58.3%", rank: "4th", percentile: 91 },
      { label: "Drop %", value: "4.2%", rank: "12th", percentile: 74 },
      { label: "Target Share", value: "26.4%", rank: "8th", percentile: 82 },
      { label: "Air Yards Share", value: "31.2%", rank: "5th", percentile: 87 },
    ]
  }
  if (["DE", "DT", "NT", "LB", "OLB", "ILB", "MLB"].includes(position)) {
    return [
      { label: "Pass Rush Win %", value: "22.4%", rank: "2nd", percentile: 96 },
      { label: "Pressure Rate", value: "18.2%", rank: "4th", percentile: 92 },
      { label: "Run Stop %", value: "8.4%", rank: "8th", percentile: 84 },
      { label: "Hurries", value: "48", rank: "3rd", percentile: 94 },
      { label: "Forced Fumbles", value: "4", rank: "6th", percentile: 88 },
      { label: "QB Knockdowns", value: "12", rank: "5th", percentile: 89 },
    ]
  }
  return [
    { label: "Coverage Grade", value: "78.4", rank: "12th", percentile: 74 },
    { label: "Tackles/Miss", value: "8.2", rank: "9th", percentile: 78 },
    { label: "Target Rating", value: "62.3", rank: "6th", percentile: 86 },
    { label: "Forced Inc %", value: "18.4%", rank: "8th", percentile: 82 },
    { label: "Yards/Coverage", value: "0.82", rank: "11th", percentile: 76 },
    { label: "Run Support", value: "71.2", rank: "15th", percentile: 68 },
  ]
}

// Performance by game (last 5 games)
function getRecentPerformance(athlete: Athlete) {
  const position = athlete.position
  
  if (["QB"].includes(position)) {
    return [
      { week: "Wk 17", opponent: "@ LV", result: "W 24-17", statLine: "284 YDS, 2 TD, 0 INT", grade: 82.4 },
      { week: "Wk 16", opponent: "vs CIN", result: "W 31-28", statLine: "312 YDS, 3 TD, 1 INT", grade: 78.9 },
      { week: "Wk 15", opponent: "@ NE", result: "W 21-14", statLine: "198 YDS, 1 TD, 0 INT", grade: 71.2 },
      { week: "Wk 14", opponent: "vs BUF", result: "L 24-31", statLine: "342 YDS, 2 TD, 2 INT", grade: 65.8 },
      { week: "Wk 13", opponent: "@ GB", result: "W 27-24", statLine: "276 YDS, 2 TD, 1 INT", grade: 74.6 },
    ]
  }
  if (["RB", "FB"].includes(position)) {
    return [
      { week: "Wk 17", opponent: "@ LV", result: "W 24-17", statLine: "112 YDS, 1 TD, 18 CAR", grade: 84.2 },
      { week: "Wk 16", opponent: "vs CIN", result: "W 31-28", statLine: "98 YDS, 2 TD, 22 CAR", grade: 81.6 },
      { week: "Wk 15", opponent: "@ NE", result: "W 21-14", statLine: "142 YDS, 1 TD, 24 CAR", grade: 88.4 },
      { week: "Wk 14", opponent: "vs BUF", result: "L 24-31", statLine: "67 YDS, 0 TD, 14 CAR", grade: 62.1 },
      { week: "Wk 13", opponent: "@ GB", result: "W 27-24", statLine: "89 YDS, 1 TD, 19 CAR", grade: 72.8 },
    ]
  }
  // Default for other positions
  return [
    { week: "Wk 17", opponent: "@ LV", result: "W 24-17", statLine: "6 TKL, 1.5 SCK", grade: 86.2 },
    { week: "Wk 16", opponent: "vs CIN", result: "W 31-28", statLine: "4 TKL, 2 SCK, 1 FF", grade: 91.4 },
    { week: "Wk 15", opponent: "@ NE", result: "W 21-14", statLine: "8 TKL, 0.5 SCK", grade: 74.8 },
    { week: "Wk 14", opponent: "vs BUF", result: "L 24-31", statLine: "3 TKL, 0 SCK", grade: 58.2 },
    { week: "Wk 13", opponent: "@ GB", result: "W 27-24", statLine: "5 TKL, 1 SCK, 1 TFL", grade: 78.6 },
  ]
}

export function AthleteOverview({ athlete, onNavigateToTeam, onClickStat, onClickGame, compact = false }: AthleteOverviewProps) {
  const keyStats = useMemo(() => getKeyStatsForAthlete(athlete), [athlete])
  const advancedStats = useMemo(() => getAdvancedStatsForAthlete(athlete), [athlete])
  const recentPerformance = useMemo(() => getRecentPerformance(athlete), [athlete])
  const teamName = TEAM_FULL_NAMES[athlete.team] || athlete.team
  const teamInfo = useMemo(() => getTeamForAthlete(athlete.id), [athlete.id])

  const handleTeamClick = () => {
    if (teamInfo && onNavigateToTeam) {
      onNavigateToTeam(teamInfo)
    }
  }

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "neutral" }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-emerald-500" />
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-500" />
    return <Minus className="w-3 h-3 text-muted-foreground" />
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Compact Header */}
      <div className={cn("border-b border-border bg-muted/20", compact ? "px-4 py-4" : "px-6 py-5")}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={cn(
            "rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0",
            compact ? "w-12 h-12" : "w-16 h-16"
          )}>
            <span className={cn("font-bold text-muted-foreground", compact ? "text-base" : "text-xl")}>
              {athlete.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>

          {/* Name and Info */}
          <div className="flex-1 min-w-0">
            <h1 className={cn("font-bold text-foreground", compact ? "text-lg" : "text-xl")}>{athlete.name}</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 flex-wrap">
              {teamInfo ? (
                <button
                  onClick={handleTeamClick}
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
          </div>

          {/* Quick Bio and Scope - hidden in compact mode */}
          {!compact && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Height</span>
                <span className="ml-2 text-foreground font-medium">{athlete.height || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Weight</span>
                <span className="ml-2 text-foreground font-medium">{athlete.weight ? `${athlete.weight} lbs` : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">College</span>
                <span className="ml-2 text-foreground font-medium">{athlete.college || "—"}</span>
              </div>
              <div className="w-px h-6 bg-border mx-1" />
              <ScopeSelector />
            </div>
          )}
        </div>
      </div>

      <div className={cn("space-y-6", compact ? "p-4" : "p-6")}>
        {/* Key Stats with Trends - Clickable to open clip playlist */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Season Stats</h2>
          <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")}>
            {keyStats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => onClickStat?.(stat.label)}
                className={cn(
                  "bg-muted/30 rounded-lg p-4 border border-border/50 text-left transition-colors",
                  onClickStat && "hover:bg-muted/50 hover:border-primary/30 cursor-pointer"
                )}
              >
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={stat.trend} />
                    <span className={cn(
                      "text-xs font-medium",
                      stat.trend === "up" && "text-emerald-500",
                      stat.trend === "down" && "text-red-500",
                      stat.trend === "neutral" && "text-muted-foreground"
                    )}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Advanced Stats - Clickable to open clip playlist */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Advanced Metrics</h2>
            <span className="text-xs text-muted-foreground">vs. Position Avg</span>
          </div>
          <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3")}>
            {advancedStats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => onClickStat?.(stat.label)}
                className={cn(
                  "bg-background rounded-lg p-3 border border-border text-left transition-colors",
                  onClickStat && "hover:bg-muted/30 hover:border-primary/30 cursor-pointer"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <span className="text-xs font-medium text-primary">{stat.rank}</span>
                </div>
                <div className="text-lg font-semibold text-foreground mb-2">{stat.value}</div>
                {/* Percentile Bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      stat.percentile >= 80 ? "bg-emerald-500" :
                      stat.percentile >= 60 ? "bg-primary" :
                      stat.percentile >= 40 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${stat.percentile}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{stat.percentile}th percentile</div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Game Log - hidden in compact mode */}
        {!compact && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Performance</h2>
              <button className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                Full Game Log <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Week</th>
                    <th className="text-left px-3 py-2 font-medium">Opp</th>
                    <th className="text-left px-3 py-2 font-medium">Result</th>
                    <th className="text-left px-3 py-2 font-medium">Stats</th>
                    <th className="text-right px-3 py-2 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPerformance.map((game, idx) => (
                    <tr 
                      key={game.week} 
                      onClick={() => onClickGame?.(game)}
                      className={cn(
                        "border-t border-border/50 transition-colors",
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                        onClickGame && "cursor-pointer hover:bg-primary/5"
                      )}
                    >
                      <td className="px-3 py-2.5 font-medium text-foreground">{game.week}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{game.opponent}</td>
                      <td className={cn(
                        "px-3 py-2.5 font-medium",
                        game.result.startsWith("W") ? "text-emerald-500" : "text-red-500"
                      )}>
                        {game.result}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">{game.statLine}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={cn(
                          "inline-flex items-center justify-center w-10 py-0.5 rounded text-xs font-semibold",
                          game.grade >= 80 ? "bg-emerald-500/10 text-emerald-500" :
                          game.grade >= 70 ? "bg-primary/10 text-primary" :
                          game.grade >= 60 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {game.grade.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Performance Trends Summary */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance Summary</h2>
          <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-500">Strengths</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Elite pass rush win rate</li>
                <li>High pressure generation</li>
                <li>Consistent QB disruption</li>
              </ul>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Minus className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-500">Development Areas</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Run defense consistency</li>
                <li>Setting the edge</li>
                <li>Late-game stamina</li>
              </ul>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Trending</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>+15% pressure rate last 4 weeks</li>
                <li>Career-high sack total pace</li>
                <li>Pro Bowl trajectory</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

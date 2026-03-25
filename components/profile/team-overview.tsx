"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { ScopeSelector } from "./scope-selector"
import { getAthletesForTeam } from "@/lib/mock-teams"
import { mockGames } from "@/lib/mock-games"
import { findTeamById } from "@/lib/games-context"
import type { Team } from "@/lib/sports-data"
import type { Athlete } from "@/types/athlete"

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

function generateTeamIdentity(teamId: string, teamName: string) {
  const h = hashString(teamId)
  const firstNames = ["Mike", "John", "Bill", "Nick", "Andy", "Sean", "Kyle", "Dan", "Kevin", "Matt"]
  const lastNames = ["Johnson", "Smith", "Williams", "Brown", "Jones", "Davis", "Wilson", "Thomas", "Moore", "Taylor"]
  const coachName = `${firstNames[h % firstNames.length]} ${lastNames[(h + 3) % lastNames.length]}`
  const cities = ["Los Angeles, CA", "Dallas, TX", "Miami, FL", "Chicago, IL", "New York, NY", "Denver, CO", "Seattle, WA"]
  const stadiumPrefixes = ["Memorial", "Victory", "Heritage", "National", "United", "State", "Metro"]
  const stadiumSuffixes = ["Stadium", "Field", "Arena", "Bowl", "Coliseum"]
  
  return {
    fullName: teamName,
    headCoach: coachName,
    location: cities[h % cities.length],
    homeArena: `${stadiumPrefixes[h % stadiumPrefixes.length]} ${stadiumSuffixes[(h + 2) % stadiumSuffixes.length]}`,
  }
}

function generateTeamStats(teamId: string) {
  const h = hashString(teamId)
  return {
    passingYPG: (180 + (h % 120)).toFixed(1),
    passingRank: `Top ${10 + (h % 20)}%`,
    passingTrend: h % 3 === 0 ? "up" : h % 3 === 1 ? "down" : "neutral",
    rushingYPG: (90 + (h % 60)).toFixed(1),
    rushingRank: h % 3 === 0 ? "Above Avg" : "Below Avg",
    rushingTrend: h % 2 === 0 ? "up" : "down",
    thirdDownPct: (35 + (h % 30)).toFixed(1),
    thirdDownRank: `Top ${5 + (h % 15)}%`,
    sacks: 25 + (h % 25),
    turnovers: 10 + (h % 15),
    ppg: (20 + (h % 15)).toFixed(1),
    ppgAllowed: (17 + (h % 12)).toFixed(1),
    record: { wins: 6 + (h % 8), losses: 3 + ((h + 3) % 7) },
  }
}

// ---------------------------------------------------------------------------
// Team Overview Component
// ---------------------------------------------------------------------------

interface TeamOverviewProps {
  team: Team
  onNavigateToAthlete?: (athlete: Athlete & { id: string }) => void
}

export function TeamOverview({ team, onNavigateToAthlete }: TeamOverviewProps) {
  const identity = useMemo(() => generateTeamIdentity(team.id, team.name), [team.id, team.name])
  const stats = useMemo(() => generateTeamStats(team.id), [team.id])
  const teamAthletes = useMemo(() => getAthletesForTeam(team.id), [team.id])
  
  // Get conference info
  const conferenceInfo = useMemo(() => {
    const h = hashString(team.id)
    const divisions = ["North", "South", "East", "West"]
    const conferences = ["AFC", "NFC"]
    return { conference: conferences[h % 2], division: divisions[h % 4] }
  }, [team.id])

  // Top players
  const topPlayers = useMemo(() => {
    const positionPriority = ["QB", "RB", "WR", "TE", "DE", "LB"]
    const sorted = [...teamAthletes].sort((a, b) => {
      const aIdx = positionPriority.indexOf(a.position)
      const bIdx = positionPriority.indexOf(b.position)
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })
    return sorted.slice(0, 5).map((athlete) => {
      const h = hashString(athlete.id || athlete.name)
      let statLabel = "", statValue = ""
      if (athlete.position === "QB") { statValue = ((250 + (h % 100)) / 100).toFixed(1); statLabel = "Pass YPG" }
      else if (athlete.position === "RB") { statValue = ((80 + (h % 50)) / 10).toFixed(1); statLabel = "Rush YPG" }
      else if (athlete.position === "WR" || athlete.position === "TE") { statValue = ((60 + (h % 50)) / 10).toFixed(1); statLabel = "Rec YPG" }
      else { statValue = ((40 + (h % 40)) / 10).toFixed(1); statLabel = "Tackles/G" }
      return { ...athlete, statValue, statLabel }
    })
  }, [teamAthletes])

  // Recent games
  const recentGames = useMemo(() => {
    return mockGames
      .filter((g) => g.homeTeamId === team.id || g.awayTeamId === team.id)
      .filter((g) => g.status === "final" && g.score)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((game) => {
        const isHome = game.homeTeamId === team.id
        const teamScore = isHome ? game.score!.home : game.score!.away
        const opponentScore = isHome ? game.score!.away : game.score!.home
        const opponentId = isHome ? game.awayTeamId : game.homeTeamId
        const opponent = findTeamById(opponentId)
        const won = teamScore > opponentScore
        return {
          id: game.id,
          date: new Date(game.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          week: game.gameType === "playoff" ? "Playoff" : `Wk ${game.week}`,
          opponent: opponent?.name || "Unknown",
          opponentAbbr: opponent?.abbreviation || "UNK",
          opponentColor: opponent?.logoColor || "#666",
          won,
          score: `${teamScore}-${opponentScore}`,
        }
      })
  }, [team.id])

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0"
          style={{ backgroundColor: team.logoColor }}
        >
          {team.abbreviation}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {conferenceInfo.conference} {conferenceInfo.division} · {stats.record.wins}-{stats.record.losses}
          </p>
        </div>
        <ScopeSelector />
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* Identity Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Team Info</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Head Coach</span>
              <span className="font-medium text-foreground">{identity.headCoach}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium text-foreground">{identity.location}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Stadium</span>
              <span className="font-medium text-foreground">{identity.homeArena}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Conference</span>
              <span className="font-medium text-foreground">{conferenceInfo.conference} {conferenceInfo.division}</span>
            </div>
          </div>
        </section>

        {/* Key Stats */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Season Stats</h2>
            <span className="text-xs text-muted-foreground">2025/26</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "PPG", value: stats.ppg, sub: `${stats.ppgAllowed} allowed`, trend: "up" },
              { label: "Pass YPG", value: stats.passingYPG, sub: stats.passingRank, trend: stats.passingTrend },
              { label: "Rush YPG", value: stats.rushingYPG, sub: stats.rushingRank, trend: stats.rushingTrend },
              { label: "3rd Down %", value: `${stats.thirdDownPct}%`, sub: stats.thirdDownRank, trend: "up" },
              { label: "Sacks", value: stats.sacks, sub: "Total", trend: "neutral" },
              { label: "Turnovers", value: stats.turnovers, sub: "Forced", trend: "up" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  {stat.trend === "up" && <span className="text-green-500 text-xs">+</span>}
                  {stat.trend === "down" && <span className="text-red-500 text-xs">-</span>}
                </div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Players */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top Players</h2>
          </div>
          <div className="space-y-1">
            {topPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onNavigateToAthlete?.(player as Athlete & { id: string })}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {player.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">{player.position} · #{player.jersey_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary">{player.statValue}</p>
                  <p className="text-xs text-muted-foreground">{player.statLabel}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Games */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Games</h2>
          </div>
          <div className="space-y-1">
            {recentGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 text-xs text-muted-foreground text-center shrink-0">
                  {game.week}
                </div>
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: game.opponentColor }}
                >
                  {game.opponentAbbr}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">vs {game.opponent}</p>
                  <p className="text-xs text-muted-foreground">{game.date}</p>
                </div>
                <div className={cn(
                  "text-sm font-semibold px-2 py-0.5 rounded",
                  game.won ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10"
                )}>
                  {game.won ? "W" : "L"} {game.score}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

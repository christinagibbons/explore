"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { getAthletesForTeam } from "@/lib/mock-teams"
import { mockGames } from "@/lib/mock-games"
import { findTeamById } from "@/lib/games-context"
import { nameToSlug } from "@/lib/athletes-data"
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

/** Generate deterministic mock team stats based on team ID */
function generateTeamStats(teamId: string) {
  const h = hashString(teamId)
  return {
    pointsFor: 200 + (h % 150),
    pointsAgainst: 180 + ((h + 7) % 140),
    offenseRank: 1 + (h % 20),
    defenseRank: 1 + ((h + 13) % 20),
    passingYPG: 200 + (h % 120),
    rushingYPG: 80 + ((h + 5) % 80),
    totalYPG: 280 + (h % 150),
    turnovers: 8 + (h % 12),
    sacks: 20 + (h % 25),
    record: {
      wins: 6 + (h % 8),
      losses: 3 + ((h + 3) % 7),
    },
  }
}

/** Generate a mock stat for an athlete based on position */
function getAthleteStatDisplay(athlete: Athlete & { id: string }) {
  const h = hashString(athlete.id || athlete.name)
  let statLabel = ""
  let statValue = ""
  if (athlete.position === "QB") {
    statValue = `${2500 + (h % 1500)}`
    statLabel = "YDS"
  } else if (athlete.position === "RB") {
    statValue = `${600 + (h % 700)}`
    statLabel = "YDS"
  } else if (athlete.position === "WR" || athlete.position === "TE") {
    statValue = `${400 + (h % 800)}`
    statLabel = "YDS"
  } else if (athlete.position === "DE" || athlete.position === "DT") {
    statValue = `${4 + (h % 10)}`
    statLabel = "SACKS"
  } else {
    statValue = `${40 + (h % 80)}`
    statLabel = "TKL"
  }
  return { statValue, statLabel }
}

// ---------------------------------------------------------------------------
// Team Profile Page Component
// ---------------------------------------------------------------------------

interface TeamProfilePageProps {
  team: Team
}

export function TeamProfilePage({ team }: TeamProfilePageProps) {
  // Get team stats
  const stats = useMemo(() => generateTeamStats(team.id), [team.id])

  // Get all athletes for this team
  const teamAthletes = useMemo(() => getAthletesForTeam(team.id), [team.id])

  // Group athletes by position for roster display
  const rosterByPosition = useMemo(() => {
    const groups: Record<string, (Athlete & { id: string })[]> = {}
    const positionOrder = ["QB", "RB", "WR", "TE", "OL", "DE", "DT", "LB", "CB", "S"]
    
    teamAthletes.forEach((athlete) => {
      if (!groups[athlete.position]) {
        groups[athlete.position] = []
      }
      groups[athlete.position].push(athlete)
    })

    // Sort positions
    return Object.entries(groups).sort(([a], [b]) => {
      const aIdx = positionOrder.indexOf(a)
      const bIdx = positionOrder.indexOf(b)
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })
  }, [teamAthletes])

  // Get recent games for this team
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
          opponent: opponent?.name || "Unknown",
          opponentAbbr: opponent?.abbreviation || "UNK",
          opponentColor: opponent?.logoColor || "#666",
          teamScore,
          opponentScore,
          won,
          week: game.week,
          date: game.date,
        }
      })
  }, [team.id])

  // Calculate PPG values
  const gamesPlayed = stats.record.wins + stats.record.losses
  const ppgFor = gamesPlayed > 0 ? (stats.pointsFor / gamesPlayed).toFixed(1) : "0.0"
  const ppgAgainst = gamesPlayed > 0 ? (stats.pointsAgainst / gamesPlayed).toFixed(1) : "0.0"

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="chevronLeft" className="w-5 h-5" />
            </Link>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: team.logoColor }}
            >
              {team.abbreviation}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{team.name}</h1>
              <p className="text-sm text-muted-foreground">
                {stats.record.wins}-{stats.record.losses} Record
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Team Info & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Team Identity Card */}
            <section className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center text-white text-3xl font-bold shrink-0"
                  style={{ backgroundColor: team.logoColor }}
                >
                  {team.abbreviation}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{team.name}</h2>
                  <p className="text-lg text-muted-foreground mt-1">
                    {stats.record.wins}-{stats.record.losses} ({((stats.record.wins / gamesPlayed) * 100).toFixed(0)}%)
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      #{stats.offenseRank} Offense
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      #{stats.defenseRank} Defense
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Team Stats Grid */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Team Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Points For" value={stats.pointsFor.toString()} subtext={`${ppgFor} PPG`} />
                <StatCard label="Points Against" value={stats.pointsAgainst.toString()} subtext={`${ppgAgainst} PPG`} />
                <StatCard label="Total Yards/Game" value={stats.totalYPG.toString()} subtext="YDS/G" />
                <StatCard label="Passing" value={stats.passingYPG.toString()} subtext="YDS/Game" />
                <StatCard label="Rushing" value={stats.rushingYPG.toString()} subtext="YDS/Game" />
                <StatCard label="Sacks" value={stats.sacks.toString()} subtext="Season Total" />
              </div>
            </section>

            {/* Full Roster */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Roster</h3>
                <span className="text-sm text-muted-foreground">{teamAthletes.length} Players</span>
              </div>

              {rosterByPosition.length > 0 ? (
                <div className="space-y-6">
                  {rosterByPosition.map(([position, athletes]) => (
                    <div key={position}>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        {getPositionLabel(position)} ({athletes.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {athletes.map((athlete) => {
                          const { statValue, statLabel } = getAthleteStatDisplay(athlete)
                          return (
                            <Link
                              key={athlete.id}
                              href={`/athletes/${nameToSlug(athlete.name)}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                                {athlete.jersey_number}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                  {athlete.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{athlete.position}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-semibold text-foreground tabular-nums">
                                  {statValue} <span className="text-xs text-muted-foreground">{statLabel}</span>
                                </span>
                                <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">No roster data available for this team.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Recent Games & Schedule */}
          <div className="space-y-8">
            {/* Recent Games */}
            <section className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Recent Games</h3>
              {recentGames.length > 0 ? (
                <div className="space-y-3">
                  {recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0",
                          game.won
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-red-500/20 text-red-500"
                        )}
                      >
                        {game.won ? "W" : "L"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">vs {game.opponent}</p>
                        <p className="text-xs text-muted-foreground">Week {game.week}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {game.teamScore}-{game.opponentScore}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No recent games available.</p>
              )}
            </section>

            {/* Quick Actions */}
            <section className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="calendar" className="w-4 h-4 mr-2" />
                  View Full Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="play" className="w-4 h-4 mr-2" />
                  Watch Game Film
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="download" className="w-4 h-4 mr-2" />
                  Export Team Report
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function StatCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  )
}

function getPositionLabel(position: string): string {
  const labels: Record<string, string> = {
    QB: "Quarterbacks",
    RB: "Running Backs",
    WR: "Wide Receivers",
    TE: "Tight Ends",
    OL: "Offensive Line",
    DE: "Defensive Ends",
    DT: "Defensive Tackles",
    LB: "Linebackers",
    CB: "Cornerbacks",
    S: "Safeties",
  }
  return labels[position] || position
}

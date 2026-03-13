"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { PreviewModuleShell, type BreadcrumbItem } from "@/components/preview-module-shell"
import type { Team, League } from "@/lib/sports-data"
import type { Game } from "@/lib/games-data"
import type { Athlete, Position } from "@/types/athlete"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamPreviewModuleProps {
  team: Team
  league: League
  onClose: () => void
  breadcrumbs?: BreadcrumbItem[]
  onNavigateToGame?: (game: Game) => void
  onNavigateToAthlete?: (athlete: Athlete) => void
}

// ---------------------------------------------------------------------------
// Mock data generators (deterministic based on team id)
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

interface TeamStats {
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  offenseRank: number
  defenseRank: number
  passingYPG: number
  rushingYPG: number
}

function generateTeamStats(team: Team): TeamStats {
  const h = hashString(team.id)
  const wins = 4 + (h % 10)
  const losses = 12 - wins
  return {
    wins,
    losses,
    pointsFor: 180 + (h % 150),
    pointsAgainst: 150 + ((h + 3) % 180),
    offenseRank: 1 + (h % 32),
    defenseRank: 1 + ((h + 7) % 32),
    passingYPG: 180 + (h % 120),
    rushingYPG: 80 + ((h + 5) % 80),
  }
}

interface RecentGameDisplay {
  game: Game
  result: "W" | "L"
  opponentName: string
  teamScore: number
  opponentScore: number
  weekLabel: string
}

const OPPONENT_TEAMS: Record<string, Team> = {
  "Ravens": { id: "ravens", name: "Baltimore Ravens", abbreviation: "BAL", logoColor: "#241773" },
  "Chiefs": { id: "chiefs", name: "Kansas City Chiefs", abbreviation: "KC", logoColor: "#E31837" },
  "Bills": { id: "bills", name: "Buffalo Bills", abbreviation: "BUF", logoColor: "#00338D" },
  "49ers": { id: "49ers", name: "San Francisco 49ers", abbreviation: "SF", logoColor: "#AA0000" },
  "Eagles": { id: "eagles", name: "Philadelphia Eagles", abbreviation: "PHI", logoColor: "#004C54" },
  "Cowboys": { id: "cowboys", name: "Dallas Cowboys", abbreviation: "DAL", logoColor: "#003594" },
  "Lions": { id: "lions", name: "Detroit Lions", abbreviation: "DET", logoColor: "#0076B6" },
  "Dolphins": { id: "dolphins", name: "Miami Dolphins", abbreviation: "MIA", logoColor: "#008E97" },
}

function generateRecentGames(team: Team): RecentGameDisplay[] {
  const h = hashString(team.id)
  const opponentNames = Object.keys(OPPONENT_TEAMS)
  const games: RecentGameDisplay[] = []
  
  for (let i = 0; i < 5; i++) {
    const oppIdx = (h + i * 3) % opponentNames.length
    const opponentName = opponentNames[oppIdx]
    const opponent = OPPONENT_TEAMS[opponentName]
    const isWin = (h + i) % 3 !== 0
    const teamScore = 14 + ((h + i) % 24)
    const opponentScore = isWin ? Math.max(teamScore - 3 - (i % 10), 0) : teamScore + 3 + (i % 14)
    const week = 12 - i
    
    // Create a Game object for navigation
    const gameObj: Game = {
      id: `${team.id}-${opponent.id}-week${week}`,
      homeTeam: team,
      awayTeam: opponent,
      homeScore: isWin ? teamScore : opponentScore,
      awayScore: isWin ? opponentScore : teamScore,
      date: `Nov ${10 + i}, 2024`,
      venue: `${team.name} Stadium`,
      league: "NFL",
      season: "2024",
      week,
      clipCount: 45 + (h % 30),
      isPlayoff: false,
    }
    
    games.push({
      game: gameObj,
      result: isWin ? "W" : "L",
      opponentName,
      teamScore: Math.max(teamScore, 0),
      opponentScore: Math.max(opponentScore, 0),
      weekLabel: `Week ${week}`,
    })
  }
  
  return games
}

interface KeyPlayerDisplay {
  athlete: Athlete
  stat: string
}

const PLAYER_DATA: Record<string, { firstName: string; lastName: string; college: string }> = {
  "J. Smith": { firstName: "Jayden", lastName: "Smith", college: "Ohio State" },
  "M. Johnson": { firstName: "Marcus", lastName: "Johnson", college: "Alabama" },
  "T. Williams": { firstName: "Tyler", lastName: "Williams", college: "USC" },
  "D. Brown": { firstName: "Derek", lastName: "Brown", college: "LSU" },
  "C. Davis": { firstName: "Cameron", lastName: "Davis", college: "Michigan" },
  "R. Harris": { firstName: "Rashad", lastName: "Harris", college: "Georgia" },
  "K. Wilson": { firstName: "Kyler", lastName: "Wilson", college: "Texas" },
  "A. Moore": { firstName: "Andre", lastName: "Moore", college: "Penn State" },
  "J. Taylor": { firstName: "Jonathan", lastName: "Taylor", college: "Wisconsin" },
  "N. Chubb": { firstName: "Nick", lastName: "Chubb", college: "Georgia" },
  "T. Hill": { firstName: "Tyreek", lastName: "Hill", college: "West Alabama" },
  "J. Chase": { firstName: "Ja'Marr", lastName: "Chase", college: "LSU" },
  "D. Adams": { firstName: "Davante", lastName: "Adams", college: "Fresno State" },
  "S. Diggs": { firstName: "Stefon", lastName: "Diggs", college: "Maryland" },
  "A. Brown": { firstName: "Antonio", lastName: "Brown", college: "Central Michigan" },
  "M. Garrett": { firstName: "Myles", lastName: "Garrett", college: "Texas A&M" },
  "T. Watt": { firstName: "T.J.", lastName: "Watt", college: "Wisconsin" },
  "N. Bosa": { firstName: "Nick", lastName: "Bosa", college: "Ohio State" },
  "M. Crosby": { firstName: "Maxx", lastName: "Crosby", college: "Eastern Michigan" },
  "C. Young": { firstName: "Chase", lastName: "Young", college: "Ohio State" },
}

function generateKeyPlayers(team: Team): KeyPlayerDisplay[] {
  const h = hashString(team.id)
  const qbNames = ["J. Smith", "M. Johnson", "T. Williams", "D. Brown", "C. Davis"]
  const rbNames = ["R. Harris", "K. Wilson", "A. Moore", "J. Taylor", "N. Chubb"]
  const wrNames = ["T. Hill", "J. Chase", "D. Adams", "S. Diggs", "A. Brown"]
  const deNames = ["M. Garrett", "T. Watt", "N. Bosa", "M. Crosby", "C. Young"]
  
  const createAthlete = (shortName: string, position: Position, number: number, stats: Partial<Athlete["stats"]>): Athlete => {
    const data = PLAYER_DATA[shortName] || { firstName: "John", lastName: "Doe", college: "Unknown" }
    const fullName = `${data.firstName} ${data.lastName}`
    return {
      id: `${team.id}-${position.toLowerCase()}-${number}`,
      name: fullName,
      team: team.abbreviation,
      position,
      jersey_number: number,
      height: position === "QB" ? "6'3" : position === "RB" ? "5'10" : position === "WR" ? "6'0" : "6'4",
      weight: position === "QB" ? 215 : position === "RB" ? 205 : position === "WR" ? 190 : 265,
      college: data.college,
      stats: {
        passing_yards: stats.passing_yards || 0,
        passing_tds: stats.passing_tds || 0,
        rushing_yards: stats.rushing_yards || 0,
        rushing_tds: stats.rushing_tds || 0,
        receiving_yards: stats.receiving_yards || 0,
        receiving_tds: stats.receiving_tds || 0,
        tackles: stats.tackles || 0,
        sacks: stats.sacks || 0,
      },
    }
  }
  
  const qbYards = 2800 + (h % 1500)
  const rbYards = 800 + (h % 600)
  const wrYards = 700 + (h % 500)
  const sacks = 6 + (h % 10)
  
  return [
    { 
      athlete: createAthlete(qbNames[h % qbNames.length], "QB", 1 + (h % 19), { passing_yards: qbYards, passing_tds: Math.floor(qbYards / 150) }),
      stat: `${qbYards} YDS` 
    },
    { 
      athlete: createAthlete(rbNames[(h + 1) % rbNames.length], "RB", 20 + (h % 15), { rushing_yards: rbYards, rushing_tds: Math.floor(rbYards / 100) }),
      stat: `${rbYards} YDS` 
    },
    { 
      athlete: createAthlete(wrNames[(h + 2) % wrNames.length], "WR", 10 + (h % 10), { receiving_yards: wrYards, receiving_tds: Math.floor(wrYards / 120) }),
      stat: `${wrYards} YDS` 
    },
    { 
      athlete: createAthlete(deNames[(h + 3) % deNames.length], "DE", 90 + (h % 9), { sacks, tackles: 30 + (h % 40) }),
      stat: `${sacks} SACKS` 
    },
  ]
}

// ---------------------------------------------------------------------------
// Stat Card Component
// ---------------------------------------------------------------------------

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
      {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Team Preview Module
// ---------------------------------------------------------------------------

export function TeamPreviewModule({ team, league, onClose, breadcrumbs, onNavigateToGame, onNavigateToAthlete }: TeamPreviewModuleProps) {
  const stats = useMemo(() => generateTeamStats(team), [team])
  const recentGames = useMemo(() => generateRecentGames(team), [team])
  const keyPlayers = useMemo(() => generateKeyPlayers(team), [team])

  const getLeagueLabel = (l: League) => {
    if (l === "NCAA (FBS)") return "College Football"
    if (l === "High School") return "High School Football"
    return "NFL"
  }

  const footer = (
    <>
      <Button variant="default" className="flex-1 gap-2">
        <Icon name="play" className="w-4 h-4" />
        View All Clips
      </Button>
      <Button variant="outline" className="flex-1 gap-2">
        <Icon name="folder" className="w-4 h-4" />
        Team Roster
      </Button>
    </>
  )

  return (
    <PreviewModuleShell
      icon="users"
      title={team.name}
      subtitle={getLeagueLabel(league)}
      onClose={onClose}
      footer={footer}
      breadcrumbs={breadcrumbs}
    >
      {/* Team Hero */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ backgroundColor: team.logoColor }}
          >
            {team.abbreviation}
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{stats.wins}</span>
              <span className="text-xl text-muted-foreground">-</span>
              <span className="text-3xl font-bold text-foreground">{stats.losses}</span>
            </div>
            <span className="text-sm text-muted-foreground">2024 Season Record</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
          {/* Stats Grid */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Team Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Points For" value={stats.pointsFor} subtext={`${(stats.pointsFor / (stats.wins + stats.losses)).toFixed(1)} PPG`} />
              <StatCard label="Points Against" value={stats.pointsAgainst} subtext={`${(stats.pointsAgainst / (stats.wins + stats.losses)).toFixed(1)} PPG`} />
              <StatCard label="Offense Rank" value={`#${stats.offenseRank}`} />
              <StatCard label="Defense Rank" value={`#${stats.defenseRank}`} />
              <StatCard label="Passing" value={`${stats.passingYPG}`} subtext="YDS/Game" />
              <StatCard label="Rushing" value={`${stats.rushingYPG}`} subtext="YDS/Game" />
            </div>
          </div>

          {/* Key Players */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Players</h3>
            <div className="space-y-2">
              {keyPlayers.map((player, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigateToAthlete?.(player.athlete)}
                  className={cn(
                    "flex items-center justify-between w-full p-2 rounded-lg transition-colors text-left",
                    onNavigateToAthlete ? "hover:bg-[#0273e3]/10 cursor-pointer bg-muted/30" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: team.logoColor }}
                    >
                      {player.athlete.jersey_number}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-foreground">{player.athlete.name}</span>
                      <span className="text-xs text-muted-foreground">{player.athlete.position}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{player.stat}</span>
                    {onNavigateToAthlete && (
                      <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Games */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Games</h3>
            <div className="space-y-1">
              {recentGames.map((recentGame, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigateToGame?.(recentGame.game)}
                  className={cn(
                    "flex items-center justify-between w-full py-2 px-3 rounded-lg transition-colors text-left",
                    onNavigateToGame ? "hover:bg-[#0273e3]/10 cursor-pointer" : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                        recentGame.result === "W" ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                      )}
                    >
                      {recentGame.result}
                    </span>
                    <span className="text-sm text-foreground">vs {recentGame.opponentName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{recentGame.teamScore}-{recentGame.opponentScore}</span>
                    <span className="text-xs text-muted-foreground">{recentGame.weekLabel}</span>
                    {onNavigateToGame && (
                      <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
    </PreviewModuleShell>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { ChevronRight, Trophy, TrendingUp, TrendingDown } from "lucide-react"
import type { Athlete } from "@/types/athlete"
import type { Game } from "@/lib/sports-data"

interface GamesListModuleProps {
  athlete: Athlete & { id: string }
  onClickGame?: (game: Game) => void
}

// Mock games the athlete played in
const MOCK_ATHLETE_GAMES = [
  { 
    id: "g-1", 
    week: 12, 
    opponent: "Ravens", 
    home: true, 
    result: "W", 
    score: "24-17",
    grade: 87.3,
    keyStats: "2 sacks, 4 pressures",
    date: "Nov 24, 2024"
  },
  { 
    id: "g-2", 
    week: 11, 
    opponent: "Saints", 
    home: false, 
    result: "W", 
    score: "31-14",
    grade: 92.1,
    keyStats: "3 sacks, 6 pressures, 1 FF",
    date: "Nov 17, 2024"
  },
  { 
    id: "g-3", 
    week: 10, 
    opponent: "Chargers", 
    home: true, 
    result: "L", 
    score: "20-27",
    grade: 71.4,
    keyStats: "1 sack, 2 pressures",
    date: "Nov 10, 2024"
  },
  { 
    id: "g-4", 
    week: 9, 
    opponent: "Bengals", 
    home: false, 
    result: "W", 
    score: "21-14",
    grade: 85.6,
    keyStats: "2 sacks, 5 pressures",
    date: "Nov 3, 2024"
  },
  { 
    id: "g-5", 
    week: 8, 
    opponent: "Ravens", 
    home: false, 
    result: "L", 
    score: "17-28",
    grade: 68.2,
    keyStats: "0 sacks, 3 pressures",
    date: "Oct 27, 2024"
  },
  { 
    id: "g-6", 
    week: 7, 
    opponent: "Bengals", 
    home: true, 
    result: "W", 
    score: "28-21",
    grade: 89.7,
    keyStats: "2.5 sacks, 7 pressures",
    date: "Oct 20, 2024"
  },
]

export function GamesListModule({ athlete, onClickGame }: GamesListModuleProps) {
  const wins = MOCK_ATHLETE_GAMES.filter(g => g.result === "W").length
  const losses = MOCK_ATHLETE_GAMES.filter(g => g.result === "L").length

  return (
    <div className="h-full bg-background rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Game Log</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {MOCK_ATHLETE_GAMES.length} games · {wins}-{losses} record
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Games List */}
        <div className="p-4">
          <div className="space-y-1">
            {MOCK_ATHLETE_GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => onClickGame?.({ 
                  id: game.id, 
                  homeTeam: game.home ? athlete.team : game.opponent,
                  awayTeam: game.home ? game.opponent : athlete.team,
                  date: game.date,
                  time: "1:00 PM",
                  league: athlete.league,
                  status: "final" as const,
                  homeScore: game.home ? parseInt(game.score.split("-")[0]) : parseInt(game.score.split("-")[1]),
                  awayScore: game.home ? parseInt(game.score.split("-")[1]) : parseInt(game.score.split("-")[0]),
                })}
                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors text-left group"
              >
                {/* Week & Result */}
                <div className="flex flex-col items-center w-12 shrink-0">
                  <span className="text-[10px] text-muted-foreground uppercase">Week</span>
                  <span className="text-lg font-bold text-foreground">{game.week}</span>
                  <span className={cn(
                    "text-xs font-semibold px-1.5 py-0.5 rounded",
                    game.result === "W" 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "bg-red-500/10 text-red-500"
                  )}>
                    {game.result}
                  </span>
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {game.home ? "vs" : "@"} {game.opponent}
                    </span>
                    <span className="text-sm text-muted-foreground">{game.score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{game.keyStats}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{game.date}</p>
                </div>

                {/* Grade */}
                <div className="flex flex-col items-end shrink-0">
                  <span className={cn(
                    "text-lg font-bold",
                    game.grade >= 85 ? "text-emerald-500" :
                    game.grade >= 70 ? "text-amber-500" : "text-red-500"
                  )}>
                    {game.grade.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Grade</span>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

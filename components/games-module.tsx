"use client"

import { useState, useMemo } from "react"
import { mockGames, mockClips, findTeamById as getTeamById } from "@/lib/games-context"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import type { Game, GameLeague } from "@/types/game"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GamesModuleProps {
  selectedLeagues: GameLeague[]
  selectedSeason: string | null
  onLeagueToggle: (league: GameLeague) => void
  onSeasonChange: (season: string | null) => void
  onClickGame?: (game: Game) => void
  activeGameId?: string
}

interface GamesBySeasonAndLeague {
  season: string
  leagues: {
    league: GameLeague
    games: Game[]
  }[]
}

// ---------------------------------------------------------------------------
// Helper: Format date to MM/DD/YY
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear().toString().slice(-2)}`
}

// ---------------------------------------------------------------------------
// Helper: Get clip count for a game
// ---------------------------------------------------------------------------
function getClipCountForGame(gameId: string): number {
  return mockClips.filter((clip) => clip.gameId === gameId).length
}

// ---------------------------------------------------------------------------
// Helper: Get week display text
// ---------------------------------------------------------------------------
function getWeekDisplay(game: Game): { text: string; isPlayoff: boolean } {
  if (game.gameType === "playoff" || game.gameType === "super-bowl") {
    return { text: "PLAYOFF", isPlayoff: true }
  }
  return { text: `Week ${game.week}`, isPlayoff: false }
}

// ---------------------------------------------------------------------------
// Team Badge Component
// ---------------------------------------------------------------------------
function TeamBadge({ teamId, className }: { teamId: string; className?: string }) {
  const team = getTeamById(teamId)
  if (!team) return null

  return (
    <div
      className={cn(
        "w-9 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white shrink-0",
        className
      )}
      style={{ backgroundColor: team.logoColor }}
    >
      {team.abbreviation}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Game Tile Component
// ---------------------------------------------------------------------------
function GameTile({ 
  game, 
  onClick, 
  isActive 
}: { 
  game: Game
  onClick?: () => void
  isActive?: boolean 
}) {
  const homeTeam = getTeamById(game.homeTeamId)
  const awayTeam = getTeamById(game.awayTeamId)
  const clipCount = getClipCountForGame(game.id)
  const weekDisplay = getWeekDisplay(game)

  if (!homeTeam || !awayTeam) return null

  // Determine winner (if game is final)
  const homeWins = game.score && game.score.home > game.score.away
  const awayWins = game.score && game.score.away > game.score.home

  return (
    <div 
      className={cn(
        "flex items-center bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg px-4 py-3 cursor-pointer border",
        isActive ? "border-primary ring-1 ring-primary" : "border-border/50"
      )}
      onClick={onClick}
    >
      {/* Left: Date and Week */}
      <div className="w-[72px] shrink-0 text-left pr-3">
        <div className="text-xs text-muted-foreground">{formatDate(game.date)}</div>
        <div className={cn(
          "text-xs font-medium",
          weekDisplay.isPlayoff ? "text-red-500" : "text-muted-foreground"
        )}>
          {weekDisplay.text}
        </div>
      </div>

      {/* Middle: Teams */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Away Team (top row) */}
        <div className="flex items-center gap-2">
          <TeamBadge teamId={game.awayTeamId} />
          <span className={cn(
            "text-sm truncate",
            awayWins ? "font-semibold text-foreground" : "text-muted-foreground"
          )}>
            {awayTeam.name}
          </span>
        </div>
        {/* Home Team (bottom row) */}
        <div className="flex items-center gap-2">
          <TeamBadge teamId={game.homeTeamId} />
          <span className={cn(
            "text-sm truncate",
            homeWins ? "font-semibold text-foreground" : "text-muted-foreground"
          )}>
            {homeTeam.name}
          </span>
        </div>
      </div>

      {/* Right: Scores */}
      <div className="w-[40px] shrink-0 text-right flex flex-col gap-1">
        {game.score ? (
          <>
            <span className={cn(
              "text-sm",
              awayWins ? "font-semibold text-foreground" : "text-muted-foreground"
            )}>
              {game.score.away}
            </span>
            <span className={cn(
              "text-sm",
              homeWins ? "font-semibold text-foreground" : "text-muted-foreground"
            )}>
              {game.score.home}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">-</span>
            <span className="text-sm text-muted-foreground">-</span>
          </>
        )}
      </div>

      {/* Far Right: Clip Count */}
      <div className="w-[60px] shrink-0 text-right text-xs text-muted-foreground pl-2">
        {clipCount} clips
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// League Section Component
// ---------------------------------------------------------------------------
function LeagueSection({ 
  league, 
  games,
  onClickGame,
  activeGameId,
}: { 
  league: GameLeague
  games: Game[]
  onClickGame?: (game: Game) => void
  activeGameId?: string
}) {
  const leagueLabel = league === "HighSchool" ? "High School" : league

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        {leagueLabel} ({games.length})
      </h4>
      <div className="space-y-2">
        {games.map((game) => (
          <GameTile 
            key={game.id} 
            game={game} 
            onClick={() => onClickGame?.(game)}
            isActive={game.id === activeGameId}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Games Module
// ---------------------------------------------------------------------------
export function GamesModule({
  selectedLeagues,
  selectedSeason,
  onLeagueToggle,
  onSeasonChange,
  onClickGame,
  activeGameId,
}: GamesModuleProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Get all unique seasons from games
  const allSeasons = useMemo(() => {
    const seasons = new Set(mockGames.map((g) => g.season))
    return Array.from(seasons).sort((a, b) => b.localeCompare(a))
  }, [])

  // Filter and organize games
  const organizedGames = useMemo(() => {
    let filtered = mockGames

    // Filter by selected leagues (if any selected, otherwise show all)
    if (selectedLeagues.length > 0) {
      filtered = filtered.filter((g) => selectedLeagues.includes(g.league))
    }

    // Filter by selected season (if any)
    if (selectedSeason) {
      filtered = filtered.filter((g) => g.season === selectedSeason)
    }

    // Filter by search query (team names or matchup display)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((g) => {
        const homeTeam = getTeamById(g.homeTeamId)
        const awayTeam = getTeamById(g.awayTeamId)
        return (
          g.matchupDisplay.toLowerCase().includes(query) ||
          homeTeam?.name.toLowerCase().includes(query) ||
          awayTeam?.name.toLowerCase().includes(query) ||
          homeTeam?.abbreviation.toLowerCase().includes(query) ||
          awayTeam?.abbreviation.toLowerCase().includes(query)
        )
      })
    }

    // Sort by date (newest first)
    filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Organize by season, then by league
    const bySeasonMap = new Map<string, Map<GameLeague, Game[]>>()

    filtered.forEach((game) => {
      if (!bySeasonMap.has(game.season)) {
        bySeasonMap.set(game.season, new Map())
      }
      const leagueMap = bySeasonMap.get(game.season)!
      if (!leagueMap.has(game.league)) {
        leagueMap.set(game.league, [])
      }
      leagueMap.get(game.league)!.push(game)
    })

    // Convert to array structure
    const result: GamesBySeasonAndLeague[] = []
    // Sort seasons descending
    const sortedSeasons = Array.from(bySeasonMap.keys()).sort((a, b) => b.localeCompare(a))
    
    sortedSeasons.forEach((season) => {
      const leagueMap = bySeasonMap.get(season)!
      const leagueOrder: GameLeague[] = ["NFL", "College", "HighSchool"]
      const leagues = leagueOrder
        .filter((l) => leagueMap.has(l))
        .map((l) => ({
          league: l,
          games: leagueMap.get(l)!,
        }))

      if (leagues.length > 0) {
        result.push({ season, leagues })
      }
    })

    return result
  }, [selectedLeagues, selectedSeason, searchQuery])

  // Count total games
  const totalGames = organizedGames.reduce(
    (sum, s) => sum + s.leagues.reduce((lSum, l) => lSum + l.games.length, 0),
    0
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with count and search */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">All Games</span>
          <span className="text-sm text-muted-foreground">({totalGames})</span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
          />
        </div>
      </div>

      {/* Games List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pl-4 pr-2 py-4 space-y-6">
          {organizedGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No games found</p>
              <p className="text-xs mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
            organizedGames.map((seasonGroup) => (
              <div key={seasonGroup.season} className="space-y-4">
                {/* Season Header */}
                <h3 className="text-base font-semibold text-foreground">
                  {seasonGroup.season} Season
                </h3>
                {/* League Sections */}
                <div className="space-y-4">
                  {seasonGroup.leagues.map((leagueGroup) => (
                    <LeagueSection
                      key={`${seasonGroup.season}-${leagueGroup.league}`}
                      league={leagueGroup.league}
                      games={leagueGroup.games}
                      onClickGame={onClickGame}
                      activeGameId={activeGameId}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

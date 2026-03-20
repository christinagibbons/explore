"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { getAthletesForTeam } from "@/lib/mock-teams"
import { mockGames } from "@/lib/mock-games"
import { findTeamById } from "@/lib/games-context"
import { nameToSlug } from "@/lib/athletes-data"
import { useExploreContextOptional } from "@/lib/explore-context"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import { ExploreScopeBar } from "@/components/explore/explore-scope-bar"
import { Play, ChevronRight, ChevronLeft } from "lucide-react"
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

/** Generate deterministic mock team identity data based on team ID */
function generateTeamIdentity(teamId: string, teamName: string) {
  const h = hashString(teamId)
  const firstNames = ["Mike", "John", "Bill", "Nick", "Andy", "Sean", "Kyle", "Dan", "Kevin", "Matt"]
  const lastNames = ["Johnson", "Smith", "Williams", "Brown", "Jones", "Davis", "Wilson", "Thomas", "Moore", "Taylor"]
  const coachName = `${firstNames[h % firstNames.length]} ${lastNames[(h + 3) % lastNames.length]}`
  
  const cities = ["Los Angeles, CA", "Dallas, TX", "Miami, FL", "Chicago, IL", "New York, NY", "Denver, CO", "Seattle, WA", "Phoenix, AZ", "Atlanta, GA", "Detroit, MI"]
  const city = cities[h % cities.length]
  
  const stadiumPrefixes = ["Memorial", "Victory", "Heritage", "National", "United", "State", "Metro", "Central"]
  const stadiumSuffixes = ["Stadium", "Field", "Arena", "Bowl", "Coliseum"]
  const stadium = `${stadiumPrefixes[h % stadiumPrefixes.length]} ${stadiumSuffixes[(h + 2) % stadiumSuffixes.length]}`
  
  return {
    fullName: teamName,
    headCoach: coachName,
    location: city,
    homeArena: stadium,
  }
}

/** Generate deterministic mock team stats based on team ID (football-specific) */
function generateTeamStats(teamId: string) {
  const h = hashString(teamId)
  return {
    passingYPG: (180 + (h % 120)).toFixed(1),
    passingRank: `Top ${10 + (h % 20)}%`,
    rushingYPG: (90 + (h % 60)).toFixed(1),
    rushingRank: h % 3 === 0 ? "Above D1 Average" : "Below D1 Average (low risk)",
    thirdDownPct: (35 + (h % 30)).toFixed(1),
    thirdDownRank: `Elite (top ${5 + (h % 15)}%)`,
    sacks: 25 + (h % 25),
    sacksSecondary: `/ ${35 + (h % 15)}`,
    sacksNote: `${20 + (h % 15)}.${h % 10}% sack rate`,
    turnovers: 10 + (h % 15),
    turnoversSecondary: `/ ${20 + (h % 10)}`,
    turnoversNote: `${10 + (h % 8)}.0% turnover rate`,
    ppg: (20 + (h % 15)).toFixed(1),
    ppgSecondary: `/ ${25 + (h % 10)}`,
    ppgNote: `${h % 2 === 0 ? "+" : ""}${(h % 8) - 4}.${h % 10} point differential`,
    record: {
      wins: 6 + (h % 8),
      losses: 3 + ((h + 3) % 7),
    },
  }
}

/** Generate deterministic mock highlights for team */
function generateTeamHighlights(teamId: string) {
  const h = hashString(teamId)
  const opponents = ["Texas A&M", "Purdue", "Minnesota", "Michigan", "UMBC", "Ohio State", "Alabama", "Georgia"]
  return Array.from({ length: 5 }, (_, i) => ({
    id: `highlight-${teamId}-${i}`,
    title: `Double Double vs ${opponents[(h + i) % opponents.length]}`,
    reactions: (h + i) % 2 === 0 ? `${1 + ((h + i) % 3)} reacted` : null,
    views: `${10 + ((h + i * 3) % 30)} views`,
    date: `Jan ${(3 + i * 2) % 28 || 1} 2025`,
    thumbnail: `/placeholder.svg?height=120&width=200`,
  }))
}

/** Generate deterministic mock playlists for team */
function generateTeamPlaylists(teamId: string) {
  const h = hashString(teamId)
  const playlistNames = [
    "Automatic Video Report",
    "Best Actions",
    "Touchdowns",
    "Interceptions",
    "Sacks",
    "Big Plays",
  ]
  return playlistNames.map((name, i) => ({
    id: `playlist-${teamId}-${i}`,
    name,
    clips: 100 + ((h + i * 17) % 150),
  }))
}

/** Generate detailed game stats for recent games */
function generateGameStats(gameId: string) {
  const h = hashString(gameId)
  return {
    passYds: 200 + (h % 200),
    rushYds: 80 + (h % 120),
    totalYds: 280 + (h % 250),
    firstDowns: 15 + (h % 15),
    thirdDown: `${4 + (h % 6)}/${10 + (h % 6)}`,
    thirdDownPct: ((4 + (h % 6)) / (10 + (h % 6)) * 100).toFixed(1),
    turnovers: h % 4,
    sacks: h % 5,
    penalties: 3 + (h % 8),
    penaltyYds: 25 + (h % 60),
    timeOfPoss: `${28 + (h % 8)}:${(h % 60).toString().padStart(2, "0")}`,
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEAM_PROFILE_TABS = ["Overview", "Games", "Players", "Events", "Report"] as const
type TeamProfileTab = (typeof TEAM_PROFILE_TABS)[number]

// ---------------------------------------------------------------------------
// Team Profile Page Component
// ---------------------------------------------------------------------------

interface TeamProfilePageProps {
  team: Team
}

export function TeamProfilePage({ team }: TeamProfilePageProps) {
  const [activeTab, setActiveTab] = useState<TeamProfileTab>("Overview")
  const highlightsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const exploreContext = useExploreContextOptional()

  // Update breadcrumbs when team profile is loaded
  useEffect(() => {
    if (exploreContext) {
      exploreContext.pushBreadcrumb({
        type: "team",
        id: team.id,
        label: team.name,
      })
    }
  }, [team.id, team.name, exploreContext])

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (anchor: { type: string; id?: string; label: string }, index: number) => {
    if (anchor.type === "explore") {
      router.push("/explore")
    }
  }

  // Get team identity
  const identity = useMemo(() => generateTeamIdentity(team.id, team.name), [team.id, team.name])

  // Get team stats
  const stats = useMemo(() => generateTeamStats(team.id), [team.id])

  // Get all athletes for this team
  const teamAthletes = useMemo(() => getAthletesForTeam(team.id), [team.id])

  // Get highlights
  const highlights = useMemo(() => generateTeamHighlights(team.id), [team.id])

  // Get playlists
  const playlists = useMemo(() => generateTeamPlaylists(team.id), [team.id])

  // Get top players with position-specific stats
  const topPlayers = useMemo(() => {
    const positionPriority = ["QB", "RB", "WR", "TE", "DE", "LB"]
    const sorted = [...teamAthletes].sort((a, b) => {
      const aIdx = positionPriority.indexOf(a.position)
      const bIdx = positionPriority.indexOf(b.position)
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })
    return sorted.slice(0, 5).map((athlete) => {
      const h = hashString(athlete.id || athlete.name)
      let statLabel = ""
      let statValue = ""
      if (athlete.position === "QB") {
        statValue = ((250 + (h % 100)) / 100).toFixed(2)
        statLabel = "Pass YPG"
      } else if (athlete.position === "RB") {
        statValue = ((80 + (h % 50)) / 10).toFixed(2)
        statLabel = "Rush YPG"
      } else if (athlete.position === "WR" || athlete.position === "TE") {
        statValue = ((60 + (h % 50)) / 10).toFixed(2)
        statLabel = "Rec YPG"
      } else if (athlete.position === "DE" || athlete.position === "DT") {
        statValue = ((10 + (h % 10)) / 10).toFixed(2)
        statLabel = "Sacks / Game"
      } else {
        statValue = ((40 + (h % 40)) / 10).toFixed(2)
        statLabel = "Tackles / Game"
      }
      return { ...athlete, statValue, statLabel }
    })
  }, [teamAthletes])

  // Get recent games for this team (up to 5)
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
        const gameStats = generateGameStats(game.id)
        return {
          id: game.id,
          date: new Date(game.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          competition: game.gameType === "playoff" ? "Playoff" : `Week ${game.week}`,
          opponent: opponent?.name || "Unknown",
          opponentAbbr: opponent?.abbreviation || "UNK",
          opponentColor: opponent?.logoColor || "#666",
          teamScore,
          opponentScore,
          won,
          score: `${won ? "W" : "L"} ${teamScore}-${opponentScore}`,
          stats: gameStats,
        }
      })
  }, [team.id])

  // Conference info
  const conferenceInfo = useMemo(() => {
    const h = hashString(team.id)
    const divisions = ["North", "South", "East", "West"]
    const conferences = ["AFC", "NFC"]
    return {
      conference: conferences[h % 2],
      division: divisions[h % 4],
      league: team.id.startsWith("hs-") ? "High School Football" : team.id.length > 3 ? "NCAA Division 1 Football" : "NFL",
    }
  }, [team.id])

  // Scroll handlers for highlights carousel
  const scrollHighlights = (direction: "left" | "right") => {
    if (highlightsRef.current) {
      const scrollAmount = 220
      highlightsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Breadcrumbs & Scope Bar - only show if within explore context */}
      {exploreContext && (
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-2">
            <ExploreBreadcrumbs 
              className="mb-1" 
              onNavigate={handleBreadcrumbNavigate}
            />
            <ExploreScopeBar className="mx-0 -mx-6 px-6 border-t border-border/30 mt-2" />
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className={cn(
        "border-b border-border bg-background/95 backdrop-blur-sm",
        !exploreContext && "sticky top-0 z-50"
      )}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="chevronLeft" className="w-5 h-5" />
              </Link>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: team.logoColor }}
              >
                {team.abbreviation}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{team.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <span className="text-primary">{conferenceInfo.conference} {conferenceInfo.division}</span>
                  <span className="text-border">{"·"}</span>
                  <span>{conferenceInfo.league}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Icon name="flag" className="w-4 h-4 mr-1.5" />
                Label
              </Button>
              <Button variant="outline" size="sm">
                <Icon name="menu" className="w-4 h-4 mr-1.5" />
                List
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-background sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-1 py-2">
            {TEAM_PROFILE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === "Overview" && (
          <div className="space-y-8">
            {/* Two-column layout: Identity and Key Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Identity Section */}
              <section>
                <h2 className="text-base font-bold text-foreground mb-4">Identity</h2>
                <div className="space-y-0">
                  <div className="flex justify-between py-3 border-b border-dotted border-border">
                    <span className="text-sm font-medium text-foreground">Team Name</span>
                    <span className="text-sm text-muted-foreground">{identity.fullName}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-dotted border-border">
                    <span className="text-sm font-medium text-foreground">Head Coach</span>
                    <span className="text-sm text-primary">{identity.headCoach}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-dotted border-border">
                    <span className="text-sm font-medium text-foreground">Conference</span>
                    <span className="text-sm text-primary">{conferenceInfo.conference}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-dotted border-border">
                    <span className="text-sm font-medium text-foreground">Location</span>
                    <span className="text-sm text-muted-foreground">{identity.location}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-foreground">Home Arena</span>
                    <span className="text-sm text-muted-foreground">{identity.homeArena}</span>
                  </div>
                </div>
              </section>

              {/* Key Stats Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-foreground">Key Stats</h2>
                  <span className="text-xs text-muted-foreground border border-border rounded px-2 py-1">2025/26</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {/* Passing YPG */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-primary mb-1">Passing YPG</p>
                    <p className="text-2xl font-bold text-foreground">{stats.passingYPG}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.passingRank}</p>
                  </div>
                  {/* Rushing YPG */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-primary mb-1">Rushing YPG</p>
                    <p className="text-2xl font-bold text-foreground">{stats.rushingYPG}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.rushingRank}</p>
                  </div>
                  {/* 3rd Down % */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-primary mb-1">3rd Down %</p>
                    <p className="text-2xl font-bold text-foreground">{stats.thirdDownPct}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.thirdDownRank}</p>
                  </div>
                  {/* Sacks */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-primary mb-1">Sacks</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-foreground">{stats.sacks}</p>
                      <p className="text-sm text-muted-foreground">{stats.sacksSecondary}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stats.sacksNote}</p>
                  </div>
                  {/* Turnovers */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-primary mb-1">Turnovers</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-foreground">{stats.turnovers}</p>
                      <p className="text-sm text-muted-foreground">{stats.turnoversSecondary}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stats.turnoversNote}</p>
                  </div>
                  {/* PPG */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-primary mb-1">PPG</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-foreground">{stats.ppg}</p>
                      <p className="text-sm text-muted-foreground">{stats.ppgSecondary}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stats.ppgNote}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Team Highlights */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">Team Highlights</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollHighlights("left")}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollHighlights("right")}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <Button variant="outline" size="sm" className="ml-2">
                    View All
                  </Button>
                </div>
              </div>
              <div
                ref={highlightsRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {highlights.map((highlight) => (
                  <div key={highlight.id} className="shrink-0 w-52">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-3 group cursor-pointer">
                      <img
                        src={highlight.thumbnail}
                        alt={highlight.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground fill-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{highlight.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      {highlight.reactions && (
                        <>
                          <span className="text-amber-500">{"*"}</span>
                          <span>{highlight.reactions}</span>
                          <span>{"·"}</span>
                        </>
                      )}
                      <span>{highlight.views}</span>
                      <span>{"·"}</span>
                      <span>{highlight.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Playlists */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">Playlists</h2>
                <Button variant="outline" size="sm">
                  Create Playlist
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{playlist.name}</span>
                    <span className="text-sm text-muted-foreground">{playlist.clips} clips</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Games Table */}
            {recentGames.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-foreground">Recent Games</h2>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-xs font-semibold h-10 px-3 w-10"></TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3">Date</TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3">Competition</TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3">Opponent</TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3">Score</TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3 text-right">Pass</TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3 text-right">Rush</TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3 text-right">TO</TableHead>
                        <TableHead className="text-xs font-semibold h-10 px-3 text-right">3rd%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentGames.map((game) => (
                        <TableRow
                          key={game.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell className="px-3 py-3">
                            <button className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                              <Play className="w-3 h-3 text-muted-foreground ml-0.5" />
                            </button>
                          </TableCell>
                          <TableCell className="text-xs px-3 py-3 text-muted-foreground">{game.date}</TableCell>
                          <TableCell className="text-xs px-3 py-3 text-muted-foreground">{game.competition}</TableCell>
                          <TableCell className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                style={{ backgroundColor: game.opponentColor }}
                              >
                                {game.opponentAbbr.slice(0, 2)}
                              </div>
                              <span className="text-xs text-foreground">{game.opponentAbbr}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3">
                            <span className={cn(
                              "text-xs font-semibold",
                              game.won ? "text-emerald-500" : "text-red-500"
                            )}>
                              {game.score}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-3 py-3 text-right tabular-nums text-primary">{game.stats.passYds}</TableCell>
                          <TableCell className="text-xs px-3 py-3 text-right tabular-nums text-primary">{game.stats.rushYds}</TableCell>
                          <TableCell className="text-xs px-3 py-3 text-right tabular-nums">{game.stats.turnovers}</TableCell>
                          <TableCell className="text-xs px-3 py-3 text-right tabular-nums text-primary">{game.stats.thirdDownPct}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {/* Top Players */}
            {topPlayers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-foreground">Top Players</h2>
                  <Button variant="outline" size="sm">
                    View Full Team
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {topPlayers.map((player, idx) => (
                    <Link
                      key={player.id || idx}
                      href={`/athletes/${nameToSlug(player.name)}`}
                      className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <p className="text-xs font-semibold text-primary mb-1">{player.statLabel}</p>
                      <p className="text-2xl font-bold text-foreground">{player.statValue}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                          {player.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-foreground truncate">{player.name.split(" ").pop()}</p>
                          <p className="text-[10px] text-muted-foreground">{player.position} · #{player.jersey_number}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab !== "Overview" && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">{activeTab} content coming soon.</p>
          </div>
        )}
      </main>
    </div>
  )
}

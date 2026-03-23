"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"

import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { nameToSlug } from "@/lib/athletes-data"
import { getTeamForAthlete } from "@/lib/mock-teams"
import { useBreadcrumbContextOptional } from "@/lib/breadcrumb-context"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
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
  // College teams
  UGA: "Georgia Bulldogs", TEX: "Texas Longhorns", OSU: "Ohio State Buckeyes",
  ORE: "Oregon Ducks", ALA: "Alabama Crimson Tide", MICH: "Michigan Wolverines",
  PSU: "Penn State Nittany Lions", MIAMI: "Miami Hurricanes", CLEM: "Clemson Tigers",
  LSU: "LSU Tigers",
  // High School teams
  MDM: "Mater Dei Monarchs", SJB: "St. John Bosco Braves", IMG: "IMG Academy Ascenders",
  SLC: "Southlake Carroll Dragons", NSM: "North Shore Mustangs", STA: "St. Thomas Aquinas Raiders",
  DLS: "De La Salle Spartans", BUFD: "Buford Wolves", KATY: "Katy Tigers",
  DUN: "Duncanville Panthers",
}

const PROFILE_TABS = ["Overview", "Games", "Events", "Career", "Report"] as const

// Mock data for Athlete Highlights
const MOCK_HIGHLIGHTS = [
  { id: "1", title: "Game-winning TD vs Ravens", reactions: 24, views: 1200, date: "Jan 12 2025" },
  { id: "2", title: "Career-high 180 yards", reactions: 18, views: 890, date: "Jan 05 2025" },
  { id: "3", title: "Incredible one-handed catch", reactions: 45, views: 2100, date: "Dec 29 2024" },
  { id: "4", title: "Breakaway 65-yard run", reactions: 32, views: 1500, date: "Dec 22 2024" },
  { id: "5", title: "Clutch 4th quarter drive", reactions: 12, views: 650, date: "Dec 15 2024" },
]

// Mock data for Playlists
const MOCK_PLAYLISTS = [
  { id: "1", name: "Automatic Video Report", clips: 192 },
  { id: "2", name: "Best Actions", clips: 156 },
  { id: "3", name: "Touchdowns", clips: 48 },
  { id: "4", name: "Big Plays", clips: 87 },
  { id: "5", name: "Red Zone", clips: 64 },
  { id: "6", name: "Third Down", clips: 112 },
  { id: "7", name: "Two-Minute Drill", clips: 34 },
  { id: "8", name: "Goal Line", clips: 28 },
  { id: "9", name: "Play Action", clips: 76 },
  { id: "10", name: "Screen Plays", clips: 45 },
]

// Mock data for Recent Games
const MOCK_RECENT_GAMES = [
  { id: "1", date: "Jan 12, 2025", competition: "Divisional Round", opponent: "Ravens", result: "W", score: "31-24", yards: 156, tds: 2, tackles: 0 },
  { id: "2", date: "Jan 05, 2025", competition: "Wild Card", opponent: "Steelers", result: "W", score: "28-14", yards: 180, tds: 1, tackles: 0 },
  { id: "3", date: "Dec 29, 2024", competition: "Week 17", opponent: "Browns", result: "W", score: "35-21", yards: 142, tds: 2, tackles: 0 },
  { id: "4", date: "Dec 22, 2024", competition: "Week 16", opponent: "Bengals", result: "L", score: "24-27", yards: 98, tds: 1, tackles: 0 },
  { id: "5", date: "Dec 15, 2024", competition: "Week 15", opponent: "Chiefs", result: "L", score: "17-31", yards: 67, tds: 0, tackles: 0 },
]

/** Return position-relevant stats for an athlete */
function getKeyStatsForAthlete(athlete: Athlete): { label: string; value: string; secondary?: string; note?: string }[] {
  const s = athlete.stats
  const pos = athlete.position

  if (pos === "QB") {
    return [
      { label: "Pass Yards", value: s.passing_yards.toLocaleString(), secondary: `/ ${s.passing_tds} TDs`, note: "Career total" },
      { label: "Passer Rating", value: ((s.passing_tds / Math.max(s.passing_yards / 250, 1)) * 30 + 65).toFixed(1), note: "Estimated" },
      { label: "Rush Yards", value: s.rushing_yards.toLocaleString(), secondary: `/ ${s.rushing_tds} TDs`, note: "Dual threat" },
      { label: "Total TDs", value: (s.passing_tds + s.rushing_tds).toString(), note: "Pass + Rush" },
      { label: "YPG", value: (s.passing_yards / 17).toFixed(1), note: "Yards per game avg" },
      { label: "Comp %", value: (58 + (hashString(athlete.name) % 12)).toFixed(1) + "%", note: "Estimated" },
    ]
  }

  if (pos === "RB") {
    return [
      { label: "Rush Yards", value: s.rushing_yards.toLocaleString(), secondary: `/ ${s.rushing_tds} TDs`, note: "Career total" },
      { label: "YPC", value: (s.rushing_yards / Math.max((s.rushing_yards / 4.5), 1)).toFixed(1), note: "Yards per carry" },
      { label: "Rec Yards", value: s.receiving_yards.toLocaleString(), secondary: `/ ${s.receiving_tds} TDs`, note: "Receiving" },
      { label: "Total TDs", value: (s.rushing_tds + s.receiving_tds).toString(), note: "Rush + Rec" },
      { label: "Scrimmage", value: (s.rushing_yards + s.receiving_yards).toLocaleString(), note: "Total yards" },
      { label: "Rush YPG", value: (s.rushing_yards / 17).toFixed(1), note: "Yards per game avg" },
    ]
  }

  if (pos === "WR" || pos === "TE") {
    return [
      { label: "Rec Yards", value: s.receiving_yards.toLocaleString(), secondary: `/ ${s.receiving_tds} TDs`, note: "Career total" },
      { label: "Rec/Game", value: ((s.receiving_yards / 12) / 17).toFixed(1), note: "Receptions avg" },
      { label: "YPR", value: (s.receiving_yards / Math.max(s.receiving_yards / 12, 1)).toFixed(1), note: "Yards per reception" },
      { label: "Total TDs", value: (s.receiving_tds + s.rushing_tds).toString(), note: "All touchdowns" },
      { label: "Rec YPG", value: (s.receiving_yards / 17).toFixed(1), note: "Yards per game avg" },
      { label: "Targets", value: Math.round(s.receiving_yards / 8.5).toLocaleString(), note: "Estimated" },
    ]
  }

  if (pos === "OL") {
    const h = hashString(athlete.name)
    const proB = 2 + (h % 5)
    const allPro = 1 + (h % 3)
    const snaps = 850 + (h % 250)
    const penPct = (1.2 + (h % 20) / 10).toFixed(1)
    const sackAllow = (h % 5)
    const runBlock = (78 + (h % 15)).toFixed(1)
    return [
      { label: "Pro Bowls", value: proB.toString(), note: "Career selections" },
      { label: "All-Pro", value: allPro.toString(), note: "First-team nods" },
      { label: "Snaps", value: snaps.toLocaleString(), note: "2025 season" },
      { label: "Penalty %", value: penPct + "%", note: "Of total snaps" },
      { label: "Sacks Allowed", value: sackAllow.toString(), note: "2025 season" },
      { label: "Run Block", value: runBlock, note: "PFF grade" },
    ]
  }

  if (pos === "DE" || pos === "DT") {
    return [
      { label: "Sacks", value: s.sacks.toFixed(1), note: "Career total" },
      { label: "Tackles", value: s.tackles.toString(), note: "Career total" },
      { label: "TFL", value: Math.round(s.sacks * 1.4 + 8).toString(), note: "Tackles for loss" },
      { label: "QB Hits", value: Math.round(s.sacks * 2.2 + 5).toString(), note: "Estimated" },
      { label: "Sacks/Game", value: (s.sacks / 34).toFixed(2), note: "Per game avg" },
      { label: "FF", value: Math.round(s.sacks * 0.3 + 1).toString(), note: "Forced fumbles" },
    ]
  }

  if (pos === "LB") {
    return [
      { label: "Tackles", value: s.tackles.toString(), note: "Career total" },
      { label: "Sacks", value: s.sacks.toFixed(1), note: "Career total" },
      { label: "TFL", value: Math.round(s.sacks * 1.5 + 12).toString(), note: "Tackles for loss" },
      { label: "Tkl/Game", value: (s.tackles / 34).toFixed(1), note: "Per game avg" },
      { label: "PD", value: Math.round(s.tackles * 0.08 + 3).toString(), note: "Pass deflections" },
      { label: "INT", value: Math.round(s.tackles * 0.02 + 1).toString(), note: "Interceptions" },
    ]
  }

  // CB / S
  return [
    { label: "Tackles", value: s.tackles.toString(), note: "Career total" },
    { label: "INT", value: Math.round(s.tackles * 0.04 + 2).toString(), note: "Interceptions" },
    { label: "PD", value: Math.round(s.tackles * 0.12 + 5).toString(), note: "Pass deflections" },
    { label: "Tkl/Game", value: (s.tackles / 34).toFixed(1), note: "Per game avg" },
    { label: "Sacks", value: s.sacks.toFixed(1), note: "Blitz production" },
    { label: "FF", value: Math.round(s.tackles * 0.015 + 1).toString(), note: "Forced fumbles" },
  ]
}

// ---------------------------------------------------------------------------
// Athlete Profile Page Component
// ---------------------------------------------------------------------------

interface AthleteProfilePageProps {
  athlete: Athlete & { id: string }
}

export function AthleteProfilePage({ athlete }: AthleteProfilePageProps) {
  const [profileTab, setProfileTab] = useState<typeof PROFILE_TABS[number]>("Overview")
  const breadcrumbContext = useBreadcrumbContextOptional()

  const keyStats = useMemo(() => getKeyStatsForAthlete(athlete), [athlete])
  const teamName = TEAM_FULL_NAMES[athlete.team] || athlete.team
  const teamInfo = useMemo(() => getTeamForAthlete(athlete.id), [athlete.id])

  // Generate slug for routing
  const athleteSlug = nameToSlug(athlete.name)

  // Push athlete anchor to breadcrumbs when the page loads
  // Wait for hydration before checking breadcrumbs to ensure sessionStorage state is loaded
  useEffect(() => {
    if (!breadcrumbContext || !breadcrumbContext.isHydrated) {
      return
    }
    
    console.log("[v0] AthleteProfilePage - hydrated, current breadcrumbs:", breadcrumbContext.breadcrumbs.map(b => b.label))
    
    // Check if this athlete is already in the breadcrumbs (prevents duplicates on re-renders)
    const alreadyInBreadcrumbs = breadcrumbContext.breadcrumbs.some(
      b => b.specificType === "athlete" && b.id === athleteSlug
    )
    
    if (alreadyInBreadcrumbs) {
      console.log("[v0] Athlete already in breadcrumbs, skipping")
      return
    }
    
    // If no collection anchor exists (direct navigation), set up "Athletes" as the starting point
    if (breadcrumbContext.breadcrumbs.length === 0) {
      console.log("[v0] No breadcrumbs - setting Athletes as collection anchor")
      breadcrumbContext.setCollectionAnchor("athletes")
    }
    
    console.log("[v0] Pushing athlete anchor:", athlete.name, athleteSlug)
    breadcrumbContext.pushAnchor({
      anchorType: "entity",
      specificType: "athlete",
      label: athlete.name,
      id: athleteSlug,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteSlug, breadcrumbContext?.isHydrated])

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = () => {
    // Navigation is handled by the breadcrumb component
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Breadcrumbs */}
      {breadcrumbContext && breadcrumbContext.breadcrumbs.length > 0 && (
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <ExploreBreadcrumbs onNavigate={handleBreadcrumbNavigate} />
          </div>
        </div>
      )}

      {/* Header */}
      <header className={cn(
        "border-b border-border bg-background/95 backdrop-blur-sm",
        (!breadcrumbContext || breadcrumbContext.breadcrumbs.length === 0) && "sticky top-0 z-50"
      )}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="chevronLeft" className="w-5 h-5" />
            </Link>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
              {athlete.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{athlete.name}</h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {teamInfo ? (
                  <Link 
                    href={`/teams/${teamInfo.id}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {teamName}
                  </Link>
                ) : (
                  <span className="text-primary font-medium">{teamName}</span>
                )}
                <span className="text-border">{"·"}</span>
                <span>{athlete.position}</span>
                <span className="text-border">{"·"}</span>
                <span>#{athlete.jersey_number}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Profile Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
                    profileTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {profileTab === "Overview" ? (
              <div className="space-y-8">
                {/* Two-column layout: Identity (left) + Key Stats (right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Identity Section */}
                  <section>
                    <h3 className="text-base font-bold text-foreground mb-4">Identity</h3>
                    <div className="space-y-0">
                      <IdentityRow label="Height / Weight" value={`${athlete.height} / ${athlete.weight} lbs`} />
                      <IdentityRow label="Position" value={athlete.position} />
                      <IdentityRow label="Jersey" value={`#${athlete.jersey_number}`} />
                      <IdentityRow label="College" value={athlete.college} />
                      <IdentityRow label="Team" value={teamName} />
                      <IdentityRow label="League" value={athlete.league} isLast />
                    </div>
                  </section>

                  {/* Key Stats Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-foreground">Key Stats</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>2025/26</span>
                        <Icon name="chevronDown" className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {keyStats.slice(0, 6).map((stat) => (
                        <div key={stat.label} className="rounded-lg border border-border p-3">
                          <p className="text-xs font-medium text-foreground mb-1">{stat.label}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-primary">{stat.value}</span>
                            {stat.secondary && (
                              <span className="text-[10px] text-muted-foreground">{stat.secondary}</span>
                            )}
                          </div>
                          {stat.note && (
                            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{stat.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Athlete Highlights Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-foreground">Athlete Highlights</h3>
                    <button className="px-3 py-1.5 text-xs font-medium text-foreground border border-border rounded-md hover:bg-muted transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {MOCK_HIGHLIGHTS.map((highlight) => (
                      <div key={highlight.id} className="flex-shrink-0 w-44">
                        <div className="aspect-video rounded-lg bg-primary/20 mb-2 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/60 flex items-center justify-center">
                            <Icon name="play" className="w-8 h-8 text-white/80" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{highlight.title}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-0.5">
                            <span className="text-orange-500">{"🔥"}</span>
                            {highlight.reactions}
                          </span>
                          <span>{"·"}</span>
                          <span>{highlight.views} views</span>
                          <span>{"·"}</span>
                          <span>{highlight.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Playlists Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-foreground">Playlists</h3>
                    <button className="px-3 py-1.5 text-xs font-medium text-foreground border border-border rounded-md hover:bg-muted transition-colors">
                      Create Playlist
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {MOCK_PLAYLISTS.map((playlist) => (
                      <button
                        key={playlist.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Icon name="play" className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{playlist.name}</p>
                          <p className="text-xs text-muted-foreground">{playlist.clips} clips</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Recent Games Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-foreground">Recent Games</h3>
                    <button className="px-3 py-1.5 text-xs font-medium text-foreground border border-border rounded-md hover:bg-muted transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border">
                            <th className="w-10 px-3 py-2"></th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Competition</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Opponent</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Score</th>
                            <th className="text-center px-2 py-2 font-medium text-muted-foreground">Yds</th>
                            <th className="text-center px-2 py-2 font-medium text-muted-foreground">TDs</th>
                            <th className="text-center px-2 py-2 font-medium text-muted-foreground">Tkl</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_RECENT_GAMES.map((game, idx) => (
                            <tr key={game.id} className={cn("border-b border-border", idx % 2 === 0 && "bg-muted/10")}>
                              <td className="px-3 py-2">
                                <button className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                  <Icon name="play" className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </td>
                              <td className="px-3 py-2 text-foreground whitespace-nowrap">{game.date}</td>
                              <td className="px-3 py-2 text-foreground">{game.competition}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">vs</span>
                                  <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                    {game.opponent.slice(0, 2)}
                                  </div>
                                  <span className="text-foreground">{game.opponent}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className={cn("font-medium", game.result === "W" ? "text-green-500" : "text-red-500")}>
                                  {game.result} {game.score}
                                </span>
                              </td>
                              <td className="text-center px-2 py-2 text-primary font-medium">{game.yards}</td>
                              <td className="text-center px-2 py-2 text-primary font-medium">{game.tds}</td>
                              <td className="text-center px-2 py-2 text-primary font-medium">{game.tackles}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* Teams Section */}
                <section>
                  <h3 className="text-base font-bold text-foreground mb-4">Teams</h3>
                  <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                    {teamInfo ? (
                      <>
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: teamInfo.logoColor }}
                        >
                          {teamInfo.abbreviation}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{teamInfo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {athlete.position} {"·"} #{athlete.jersey_number}
                          </p>
                          <p className="text-xs text-muted-foreground">2023 - Present</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold shrink-0">
                          {athlete.team.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{teamName}</p>
                          <p className="text-xs text-muted-foreground">
                            {athlete.position} {"·"} #{athlete.jersey_number}
                          </p>
                          <p className="text-xs text-muted-foreground">2023 - Present</p>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <p className="text-muted-foreground">{profileTab} content coming soon.</p>
              </div>
            )}
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function IdentityRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-3", !isLast && "border-b border-dotted border-border")}>
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { nameToSlug } from "@/lib/athletes-data"
import { getTeamForAthlete } from "@/lib/mock-teams"
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

  const keyStats = useMemo(() => getKeyStatsForAthlete(athlete), [athlete])
  const teamName = TEAM_FULL_NAMES[athlete.team] || athlete.team
  const teamInfo = useMemo(() => getTeamForAthlete(athlete.id), [athlete.id])

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <section className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground shrink-0">
                  {athlete.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{athlete.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {teamInfo ? (
                      <Link 
                        href={`/teams/${teamInfo.id}`}
                        className="text-lg text-primary font-medium hover:underline"
                      >
                        {teamName}
                      </Link>
                    ) : (
                      <span className="text-lg text-primary font-medium">{teamName}</span>
                    )}
                    <span className="text-muted-foreground">#{athlete.jersey_number}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {athlete.position}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      {athlete.league}
                    </span>
                  </div>
                </div>
              </div>
            </section>

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
                {/* Identity Section */}
                <section className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Identity</h3>
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
                    <h3 className="text-lg font-bold text-foreground">Key Statistics</h3>
                    <span className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-3 py-1">
                      2025/26
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {keyStats.map((stat) => (
                      <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
                        <p className="text-xs font-bold text-primary mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-extrabold text-foreground">{stat.value}</span>
                          {stat.secondary && (
                            <span className="text-sm text-muted-foreground">{stat.secondary}</span>
                          )}
                        </div>
                        {stat.note && (
                          <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <p className="text-muted-foreground">{profileTab} content coming soon.</p>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Related */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <section className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="play" className="w-4 h-4 mr-2" />
                  Watch Highlights
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="folder" className="w-4 h-4 mr-2" />
                  View Game Film
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="download" className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </section>

            {/* Team Link */}
            {teamInfo && (
              <section className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-lg font-bold text-foreground mb-4">Team</h3>
                <Link
                  href={`/teams/${teamInfo.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: teamInfo.logoColor }}
                  >
                    {teamInfo.abbreviation}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {teamInfo.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{athlete.league}</p>
                  </div>
                  <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground" />
                </Link>
              </section>
            )}

            {/* Career Summary */}
            <section className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Career Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium text-foreground">
                    {athlete.classYear || athlete.grade || `${2 + (hashString(athlete.name) % 8)} Years`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Draft</span>
                  <span className="font-medium text-foreground">
                    {athlete.league === "NFL" ? `Round ${1 + (hashString(athlete.name) % 4)}` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">College</span>
                  <span className="font-medium text-foreground">{athlete.college}</span>
                </div>
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

function IdentityRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-3", !isLast && "border-b border-dotted border-border")}>
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  )
}

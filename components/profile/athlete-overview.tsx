"use client"

import { useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getTeamForAthlete } from "@/lib/mock-teams"
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

interface AthleteOverviewProps {
  athlete: Athlete & { id: string }
  onNavigateToTeam?: (team: Team) => void
}

// Helper to get key stats based on position
function getKeyStatsForAthlete(athlete: Athlete) {
  const stats = athlete.stats
  const position = athlete.position

  if (["QB"].includes(position)) {
    return [
      { label: "Pass Yards", value: stats.passing_yards?.toLocaleString() ?? "0" },
      { label: "Pass TDs", value: stats.passing_tds?.toString() ?? "0" },
      { label: "Rush Yards", value: stats.rushing_yards?.toLocaleString() ?? "0" },
    ]
  }
  if (["RB", "FB"].includes(position)) {
    return [
      { label: "Rush Yards", value: stats.rushing_yards?.toLocaleString() ?? "0" },
      { label: "Rush TDs", value: stats.rushing_tds?.toString() ?? "0" },
      { label: "Rec Yards", value: stats.receiving_yards?.toLocaleString() ?? "0" },
    ]
  }
  if (["WR", "TE"].includes(position)) {
    return [
      { label: "Rec Yards", value: stats.receiving_yards?.toLocaleString() ?? "0" },
      { label: "Rec TDs", value: stats.receiving_tds?.toString() ?? "0" },
      { label: "Targets", value: "—" },
    ]
  }
  if (["DE", "DT", "NT", "LB", "OLB", "ILB", "MLB"].includes(position)) {
    return [
      { label: "Tackles", value: stats.tackles?.toString() ?? "0" },
      { label: "Sacks", value: stats.sacks?.toFixed(1) ?? "0" },
      { label: "TFLs", value: "—" },
    ]
  }
  if (["CB", "S", "FS", "SS", "DB"].includes(position)) {
    return [
      { label: "Tackles", value: stats.tackles?.toString() ?? "0" },
      { label: "INTs", value: "—" },
      { label: "Pass Def", value: "—" },
    ]
  }
  return [
    { label: "Games", value: "16" },
    { label: "Starts", value: "16" },
    { label: "Snaps", value: "—" },
  ]
}

export function AthleteOverview({ athlete, onNavigateToTeam }: AthleteOverviewProps) {
  const keyStats = useMemo(() => getKeyStatsForAthlete(athlete), [athlete])
  const teamName = TEAM_FULL_NAMES[athlete.team] || athlete.team
  const teamInfo = useMemo(() => getTeamForAthlete(athlete.id), [athlete.id])

  const handleTeamClick = () => {
    if (teamInfo && onNavigateToTeam) {
      onNavigateToTeam(teamInfo)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="px-6 -mt-16 relative z-10">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-xl border-4 border-background bg-muted flex items-center justify-center overflow-hidden shrink-0">
            <span className="text-3xl font-bold text-muted-foreground">
              {athlete.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>

          {/* Name and Info */}
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-foreground">{athlete.name}</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
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
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {keyStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-muted/30 rounded-lg p-4 text-center"
            >
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bio Section */}
        <div className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Bio</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Height</span>
              <span className="text-foreground font-medium">{athlete.height || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span className="text-foreground font-medium">{athlete.weight ? `${athlete.weight} lbs` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">College</span>
              <span className="text-foreground font-medium">{athlete.college || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Experience</span>
              <span className="text-foreground font-medium">{"—"}</span>
            </div>
          </div>
        </div>

        {/* Recent Highlights Placeholder */}
        <div className="mt-8 pb-8">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Recent Highlights</h2>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center"
              >
                <span className="text-xs text-muted-foreground">Highlight {i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { notFound } from "next/navigation"
import { TeamProfilePage } from "./team-profile-page"
import { sportsData } from "@/lib/sports-data"
import type { Team } from "@/lib/sports-data"

// ---------------------------------------------------------------------------
// Helper to find a team by ID across all leagues/conferences
// ---------------------------------------------------------------------------

function findTeamById(teamId: string): Team | undefined {
  for (const league of Object.values(sportsData)) {
    for (const conference of league.conferences) {
      // Check direct teams
      const directTeam = conference.teams.find((t) => t.id === teamId)
      if (directTeam) return directTeam

      // Check subdivisions (NFL pattern)
      if (conference.subdivisions) {
        for (const subdivision of conference.subdivisions) {
          const subTeam = subdivision.teams.find((t) => t.id === teamId)
          if (subTeam) return subTeam
        }
      }
    }
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ teamId: string }>
}

export default async function Page({ params }: PageProps) {
  const { teamId } = await params
  const team = findTeamById(teamId)

  if (!team) {
    notFound()
  }

  return <TeamProfilePage team={team} />
}

// ---------------------------------------------------------------------------
// Generate static params for all teams (optional optimization)
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  const teamIds: string[] = []

  for (const league of Object.values(sportsData)) {
    for (const conference of league.conferences) {
      // Direct teams
      conference.teams.forEach((t) => teamIds.push(t.id))

      // Subdivision teams
      if (conference.subdivisions) {
        for (const subdivision of conference.subdivisions) {
          subdivision.teams.forEach((t) => teamIds.push(t.id))
        }
      }
    }
  }

  return teamIds.map((teamId) => ({ teamId }))
}

/**
 * Team Rosters - Links athletes to their teams.
 * 
 * This formalizes the relationship between athletes (from athletes-data.ts)
 * and teams (from sports-data.ts). Athletes already have a `team` field 
 * with the team abbreviation, but this provides queryable roster data.
 */

import { athletes, getAthleteById } from "./athletes-data"
import { sportsData, type Team } from "./sports-data"
import type { Athlete } from "@/types/athlete"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamRoster {
  /** Team ID matching Team.id from sports-data.ts (e.g., "buf", "kc") */
  teamId: string
  /** Array of athlete IDs from athletes-data.ts */
  athleteIds: string[]
}

// ---------------------------------------------------------------------------
// Team Rosters Data
// ---------------------------------------------------------------------------

/**
 * Build rosters from existing athlete.team field.
 * This groups athletes by their team abbreviation and maps to team IDs.
 */

// Map team abbreviations to team IDs (sports-data uses lowercase IDs)
const teamAbbreviationToId: Record<string, string> = {
  // NFL Teams
  BAL: "bal",
  BUF: "buf",
  KC: "kc",
  DET: "det",
  CIN: "cin",
  HOU: "hou",
  SF: "sf",
  PHI: "phi",
  MIN: "min",
  MIA: "mia",
  DAL: "dal",
  LAR: "lar",
  NYJ: "nyj",
  ATL: "atl",
  LV: "lv",
  CLE: "cle",
  NYG: "nyg",
  PIT: "pit",
  DEN: "den",
  JAX: "jax",
  LAC: "lac",
  TB: "tb",
  CHI: "chi",
  GB: "gb",

  // College Teams (10 teams)
  UGA: "geo",     // Georgia Bulldogs
  TEX: "tex",     // Texas Longhorns
  OSU: "osu",     // Ohio State Buckeyes
  ORE: "ore",     // Oregon Ducks
  ALA: "ala",     // Alabama Crimson Tide
  MICH: "mich",   // Michigan Wolverines
  PSU: "psu",     // Penn State Nittany Lions
  MIAMI: "miami", // Miami Hurricanes (using MIAMI to avoid conflict with NFL MIA)
  CLEM: "clem",   // Clemson Tigers
  LSU: "lsu",     // LSU Tigers

  // High School Teams (10 teams)
  MDM: "hs-mater-dei",       // Mater Dei Monarchs
  SJB: "hs-st-john-bosco",   // St. John Bosco Braves
  IMG: "hs-img-academy",     // IMG Academy Ascenders
  SLC: "hs-southlake",       // Southlake Carroll Dragons
  NSM: "hs-north-shore",     // North Shore Mustangs
  STA: "hs-st-thomas",       // St. Thomas Aquinas Raiders
  DLS: "hs-de-la-salle",     // De La Salle Spartans
  BUFD: "hs-buford",         // Buford Wolves (using BUFD to avoid conflict with NFL BUF)
  KATY: "hs-katy",           // Katy Tigers
  DUN: "hs-duncanville",     // Duncanville Panthers
}

// Build rosters dynamically from athletes data
function buildRosters(): TeamRoster[] {
  const rosterMap = new Map<string, string[]>()

  athletes.forEach((athlete) => {
    const teamId = teamAbbreviationToId[athlete.team]
    if (teamId) {
      if (!rosterMap.has(teamId)) {
        rosterMap.set(teamId, [])
      }
      rosterMap.get(teamId)!.push(athlete.id)
    }
  })

  return Array.from(rosterMap.entries()).map(([teamId, athleteIds]) => ({
    teamId,
    athleteIds,
  }))
}

export const teamRosters: TeamRoster[] = buildRosters()

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Get a team's roster by team ID
 */
export function getRosterByTeamId(teamId: string): TeamRoster | undefined {
  return teamRosters.find((r) => r.teamId === teamId)
}

/**
 * Get all athletes for a given team
 */
export function getAthletesForTeam(teamId: string): (Athlete & { id: string })[] {
  const roster = getRosterByTeamId(teamId)
  if (!roster) return []
  
  return roster.athleteIds
    .map((id) => getAthleteById(id))
    .filter((a): a is Athlete & { id: string } => a !== undefined)
}

/**
 * Get all athlete IDs for a given team
 */
export function getAthleteIdsForTeam(teamId: string): string[] {
  const roster = getRosterByTeamId(teamId)
  return roster?.athleteIds ?? []
}

/**
 * Get the team (from sports-data) for an athlete
 */
export function getTeamForAthlete(athleteId: string): Team | undefined {
  const athlete = getAthleteById(athleteId)
  if (!athlete) return undefined

  const teamId = teamAbbreviationToId[athlete.team]
  if (!teamId) return undefined

  // Search through all conferences to find the team
  for (const league of Object.values(sportsData)) {
    for (const conference of league.conferences) {
      // Check direct teams
      const directTeam = conference.teams.find((t) => t.id === teamId)
      if (directTeam) return directTeam

      // Check subdivisions
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

/**
 * Check if an athlete is on a specific team
 */
export function isAthleteOnTeam(athleteId: string, teamId: string): boolean {
  const roster = getRosterByTeamId(teamId)
  return roster?.athleteIds.includes(athleteId) ?? false
}

/**
 * Get athletes that are on either of two teams (useful for game context)
 */
export function getAthletesForGame(
  homeTeamId: string,
  awayTeamId: string
): (Athlete & { id: string })[] {
  return [
    ...getAthletesForTeam(homeTeamId),
    ...getAthletesForTeam(awayTeamId),
  ]
}

/**
 * Validate that a list of athlete IDs are valid for a game
 * (i.e., all athletes are from one of the two teams playing)
 */
export function validateAthletesForGame(
  athleteIds: string[],
  homeTeamId: string,
  awayTeamId: string
): boolean {
  const validAthleteIds = new Set([
    ...getAthleteIdsForTeam(homeTeamId),
    ...getAthleteIdsForTeam(awayTeamId),
  ])

  return athleteIds.every((id) => validAthleteIds.has(id))
}

/**
 * Get all teams that have athletes in our dataset
 */
export function getTeamsWithRosters(): string[] {
  return teamRosters.map((r) => r.teamId)
}

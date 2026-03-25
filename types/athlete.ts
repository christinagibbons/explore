/**
 * Athlete data types.
 *
 * Represents player profiles and their stats across NFL, College, and High School.
 * Team abbreviations align with those in lib/sports-data.ts (e.g. "BAL", "KC", "UGA", "MDM").
 */

// ---------------------------------------------------------------------------
// Leagues
// ---------------------------------------------------------------------------

export type AthleteLeague = "NFL" | "College" | "HighSchool"

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

export type OffensivePosition = "QB" | "RB" | "WR" | "TE" | "OL"
export type DefensivePosition = "DE" | "DT" | "LB" | "CB" | "S"
export type Position = OffensivePosition | DefensivePosition

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface AthleteStats {
  passing_yards: number
  passing_tds: number
  rushing_yards: number
  rushing_tds: number
  receiving_yards: number
  receiving_tds: number
  tackles: number
  sacks: number
}

// ---------------------------------------------------------------------------
// Team History Entry
// ---------------------------------------------------------------------------

export interface TeamHistoryEntry {
  /** Team abbreviation */
  team: string
  /** Seasons played for this team (e.g. ["2023", "2024"]) */
  seasons: string[]
}

// ---------------------------------------------------------------------------
// Athlete
// ---------------------------------------------------------------------------

export interface Athlete {
  /** Unique athlete identifier (e.g. "ath-001") */
  id?: string
  /** Player full name (unique identifier for now) */
  name: string
  /** League: NFL, College, or HighSchool */
  league: AthleteLeague
  /** Current team abbreviation matching sports-data.ts (e.g. "BAL", "KC", "UGA", "MDM") */
  team: string
  /** Historical teams the athlete has played for (optional, for multi-team athletes) */
  teamHistory?: TeamHistoryEntry[]
  /** Player position */
  position: Position
  /** Jersey number */
  jersey_number: number
  /** Height as display string (e.g. "6'2") */
  height: string
  /** Weight in pounds */
  weight: number
  /** College the player attended (for NFL/College) or High School name */
  college: string
  /** Grade level for high school players (e.g. "Senior", "Junior") */
  grade?: string
  /** Class year for college players (e.g. "Senior", "Junior", "Sophomore", "Freshman") */
  classYear?: string
  /** Aggregate career stats */
  stats: AthleteStats
}

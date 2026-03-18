/**
 * Game entity types.
 * 
 * Games are the parent container for Clips. Each game involves two teams
 * and contains all the clips/plays from that matchup.
 */

// ---------------------------------------------------------------------------
// Game Status
// ---------------------------------------------------------------------------

export type GameStatus = "scheduled" | "in-progress" | "final" | "postponed" | "cancelled"

// ---------------------------------------------------------------------------
// League Type
// ---------------------------------------------------------------------------

export type GameLeague = "NFL" | "College" | "HighSchool"

// ---------------------------------------------------------------------------
// Weather conditions for outdoor games
// ---------------------------------------------------------------------------

export interface GameWeather {
  temperature: number // Fahrenheit
  condition: "clear" | "cloudy" | "rain" | "snow" | "windy" | "dome"
  windSpeed?: number // mph
  humidity?: number // percentage
}

// ---------------------------------------------------------------------------
// Broadcast information
// ---------------------------------------------------------------------------

export interface BroadcastInfo {
  network: string // e.g., "CBS", "FOX", "ESPN", "NBC", "Amazon Prime"
  announcers?: string[]
}

// ---------------------------------------------------------------------------
// Game Score
// ---------------------------------------------------------------------------

export interface GameScore {
  home: number
  away: number
  /** Quarter-by-quarter scores */
  quarters?: {
    q1: { home: number; away: number }
    q2: { home: number; away: number }
    q3: { home: number; away: number }
    q4: { home: number; away: number }
    ot?: { home: number; away: number }
  }
}

// ---------------------------------------------------------------------------
// Main Game Entity
// ---------------------------------------------------------------------------

export interface Game {
  /** Unique game identifier */
  id: string

  /** League this game belongs to */
  league: GameLeague

  /** Reference to home team (matches Team.id from sports-data.ts) */
  homeTeamId: string

  /** Reference to away team (matches Team.id from sports-data.ts) */
  awayTeamId: string

  /** Game date in ISO format (YYYY-MM-DD) */
  date: string

  /** Kickoff time in 24h format (HH:MM) */
  kickoffTime?: string

  /** Season year (e.g., "2024") */
  season: string

  /** Week number in the season (1-18 for regular, 19+ for playoffs) */
  week: number

  /** Type of game */
  gameType: "regular" | "playoff" | "super-bowl" | "preseason"

  /** Current status of the game */
  status: GameStatus

  /** Final or current score */
  score?: GameScore

  /** Venue/stadium name */
  venue: string

  /** City where the game is played */
  city: string

  /** Weather conditions (null for dome games) */
  weather?: GameWeather

  /** Attendance count */
  attendance?: number

  /** Broadcast information */
  broadcast?: BroadcastInfo

  /** Display name for the matchup (e.g., "BUF @ KC") */
  matchupDisplay: string
}

// ---------------------------------------------------------------------------
// Helper type for creating games with optional fields
// ---------------------------------------------------------------------------

export type CreateGameInput = Omit<Game, "id" | "matchupDisplay"> & {
  id?: string
}

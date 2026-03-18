import { mockGames, getGameById } from "./mock-games"
import { getAthleteIdsForTeam } from "./mock-teams"

export interface Clip {
  id: string
  /** Foreign key to Game.id from mock-games.ts */
  gameId: string
  /** 
   * Athletes featured in this clip (subset of players from the teams in the game).
   * References athlete IDs from athletes-data.ts.
   */
  athleteIds: string[]
  matchup: string
  date: string
  quarter: number
  time: string
  down: number
  distance: number
  yardLine: number // 0-100
  hash: "Left" | "Middle" | "Right"
  isTwoMinuteDrill: boolean
  homeScore: number
  awayScore: number
  
  // Advanced Analytics
  analytics: {
    epa: number
    successRate: boolean
    explosivePlay: boolean
    completionProb?: number
    winProbability: number
  }

  // Formation & Personnel
  formation: {
    personnelO: string
    personnelD: string
    type: string
    name: string
    backfieldAlignment: string
    isShotgun: boolean
    preSnapMotion: boolean
    motionType?: string
  }
  
  // Play Context
  playDevelopment: {
    playAction: boolean
    rpo?: "Pass" | "Run"
    screen: boolean
    designedRollout: boolean
    brokenPlay: boolean
  }
  playResult: {
    touchdown?: "Pass" | "Run" | "Defensive"
    firstDown?: "Pass" | "Run"
    turnover?: "Fumble" | "Interception" | "On downs" | "Safety"
    penalty?: string
  }

  // Passing
  passing?: {
    result?: "Complete" | "Incomplete"
    pressure?: "Complete" | "Incomplete" 
    scramble: boolean
    sack: boolean
    throwaway: boolean
    airYards?: number
    yac?: number
    timeToPass?: number
    qbHit?: boolean
    qbSacked?: boolean
    passLocation?: "Left Sideline" | "Left Numbers" | "Middle" | "Right Numbers" | "Right Sideline"
    receiver?: {
      targeted: boolean
      reception: boolean
      drop: boolean
      contested: boolean
      route: string
      depth: "Behind LOS" | "0-10" | "10-20" | "20+"
    }
    defense?: {
      breakup: boolean
      interception: boolean
      sack: boolean
      pressure: boolean
      coverage: string
    }
  }

  // Rushing
  rushing?: {
    attempt?: "Gain" | "Loss / No gain"
    yac: number
    direction: "Left end" | "Left tackle" | "Left guard" | "Center" | "Right guard" | "Right tackle" | "Right end"
    runGap?: "A-Gap" | "B-Gap" | "C-Gap" | "D-Gap" | "Outside"
    yardsAtContact?: number
    handoffType?: "Hand" | "Pitch" | "Toss"
    defense?: {
      tackleMade: boolean
      tackleMissed: boolean
      tfl: boolean
      forcedFumble: boolean
    }
  }

  // Expanded Defense Specifics
  defense: {
    front: string
    coverageScheme: string
    coverageDetail: string
    isBlitz: boolean
    blitzType?: string
    pressurePoints: number
    tackleType?: "Solo" | "Assist" | "Missed"
  }

  // Blocking
  blocking?: {
    passBlock: boolean
    runBlock: boolean
    allowedPressure: boolean
    allowedSack: boolean
  }

  // Special Teams
  specialTeams?: {
    type: "Field Goal" | "PAT" | "Punt" | "Kickoff"
    result?: string 
    returnYards?: number
  }

  // 22 Athletes On-Field Tracking
  onField: {
    offenseIds: string[]
    defenseIds: string[]
  }

  // Legacy/Shared
  personnel: {
    offense: string
    defense: string
  }
  gain: number
  videoUrl: string
  thumbnailUrl: string
  videoStartMs?: number
  videoEndMs?: number
}

// Helpers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => (Math.random() * (max - min) + min);

const directions = ["Left end", "Left tackle", "Left guard", "Center", "Right guard", "Right tackle", "Right end"] as const
const depths = ["Behind LOS", "0-10", "10-20", "20+"] as const
const routes = ["Go", "Slant", "Out", "Dig", "Post", "Corner", "Curl", "Flat", "Seam"]
const formations = ["Trey Left", "Deuce Right", "Empty Strong", "Trips Right", "I-Form Tight"]
const coverages = ["Cover 1", "Cover 2", "Cover 3 Match", "Quarters", "Cover 0"]
const passLocs = ["Left Sideline", "Left Numbers", "Middle", "Right Numbers", "Right Sideline"] as const

// Use real game IDs from mock-games.ts - get completed games from each league
const nflGameIds = mockGames.filter(g => g.status === "final" && g.league === "NFL").map(g => g.id)
const collegeGameIds = mockGames.filter(g => g.status === "final" && g.league === "College").map(g => g.id)
const hsGameIds = mockGames.filter(g => g.status === "final" && g.league === "HighSchool").map(g => g.id)

// Combine game IDs with distribution: ~30 NFL, ~25 College, ~20 HS
const allGameIds = [
  ...nflGameIds.slice(0, 8),
  ...collegeGameIds.slice(0, 15),
  ...hsGameIds.slice(0, 15)
]

/**
 * Get athlete IDs for a game's teams, selecting a random subset for the clip
 * @param gameId - The game ID to get athletes for
 * @param count - Number of athletes to select (1-5 featured athletes per clip)
 */
function getAthleteIdsForClip(gameId: string, count: number = 3): string[] {
  const game = getGameById(gameId)
  if (!game) return []
  
  const homeAthletes = getAthleteIdsForTeam(game.homeTeamId)
  const awayAthletes = getAthleteIdsForTeam(game.awayTeamId)
  const allAthletes = [...homeAthletes, ...awayAthletes]
  
  // Shuffle and take a subset
  const shuffled = allAthletes.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Get on-field player IDs (11 offense, 11 defense) from game teams
 */
function getMockOnFieldIds(gameId: string) {
  const game = getGameById(gameId)
  if (!game) {
    // Fallback to random IDs if game not found
    const oIds = Array.from({length: 11}, () => `ath-${String(randomInt(1, 26)).padStart(3, '0')}`);
    const dIds = Array.from({length: 11}, () => `ath-${String(randomInt(27, 50)).padStart(3, '0')}`);
    return { offenseIds: [...new Set(oIds)], defenseIds: [...new Set(dIds)] };
  }
  
  const homeAthletes = getAthleteIdsForTeam(game.homeTeamId)
  const awayAthletes = getAthleteIdsForTeam(game.awayTeamId)
  
  // Home team on offense, away team on defense (simplified)
  // In reality this would alternate, but for mock data this works
  const offenseIds = homeAthletes.length > 0 
    ? homeAthletes.sort(() => Math.random() - 0.5).slice(0, 11)
    : Array.from({length: 11}, () => `ath-${String(randomInt(1, 26)).padStart(3, '0')}`)
  
  const defenseIds = awayAthletes.length > 0
    ? awayAthletes.sort(() => Math.random() - 0.5).slice(0, 11)
    : Array.from({length: 11}, () => `ath-${String(randomInt(27, 50)).padStart(3, '0')}`)
  
  return { offenseIds: [...new Set(offenseIds)], defenseIds: [...new Set(defenseIds)] };
}

export const mockClips: Clip[] = Array.from({ length: 75 }).map((_, i) => {
  const isPass = Math.random() > 0.45;
  const isRun = !isPass && Math.random() > 0.2;
  const isSpecial = !isPass && !isRun;
  const gain = isPass ? randomInt(-7, 35) : isRun ? randomInt(-3, 20) : 0;
  const epa = randomFloat(-3.5, 4.5);
  
  // Assign clip to a real game (distribute across available games from all leagues)
  const gameIndex = i % allGameIds.length;
  const gameId = allGameIds[gameIndex] || "game-001";
  const game = getGameById(gameId);
  
  // Get athletes for this clip from the game's teams
  const athleteIds = getAthleteIdsForClip(gameId, randomInt(2, 5));
  const onField = getMockOnFieldIds(gameId);

  return {
    id: `clip-${String(i + 1).padStart(4, "0")}`,
    gameId,
    athleteIds,
    matchup: game?.matchupDisplay || "TBD",
    date: game?.date || "2024-11-17",
    quarter: (i % 4) + 1,
    time: `${String(15 - (i % 15)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    down: (i % 4) + 1,
    distance: randomInt(1, 15),
    yardLine: randomInt(1, 99),
    hash: ["Left", "Middle", "Right"][randomInt(0, 2)] as "Left" | "Middle" | "Right",
    isTwoMinuteDrill: Math.random() > 0.85,
    homeScore: randomInt(0, 35),
    awayScore: randomInt(0, 35),
    
    analytics: {
      epa: parseFloat(epa.toFixed(2)),
      successRate: epa > 0,
      explosivePlay: gain > 15,
      completionProb: isPass ? parseFloat(randomFloat(0.2, 0.95).toFixed(2)) : undefined,
      winProbability: parseFloat(randomFloat(0.05, 0.95).toFixed(2)),
    },

    formation: {
      personnelO: ["11", "12", "21", "22", "10", "Empty"][randomInt(0, 5)],
      personnelD: ["Base", "Nickel", "Dime", "Goal Line"][randomInt(0, 3)],
      type: ["3x1", "2x2", "Empty", "Condensed"][randomInt(0, 3)],
      name: formations[randomInt(0, formations.length - 1)],
      backfieldAlignment: ["Gun Strong", "Gun Weak", "Pistol", "Under Center"][randomInt(0, 3)],
      isShotgun: Math.random() > 0.3,
      preSnapMotion: Math.random() > 0.5,
      motionType: Math.random() > 0.5 ? "Jet" : "Orbit"
    },
    
    playDevelopment: {
      playAction: isPass && Math.random() > 0.7,
      screen: isPass && Math.random() > 0.8,
      designedRollout: isPass && Math.random() > 0.9,
      brokenPlay: Math.random() > 0.95,
      rpo: Math.random() > 0.85 ? (Math.random() > 0.5 ? "Pass" : "Run") : undefined
    },
    
    playResult: {
      touchdown: Math.random() > 0.92 ? (isPass ? "Pass" : isRun ? "Run" : "Defensive") : undefined,
      firstDown: Math.random() > 0.6 ? (isPass ? "Pass" : "Run") : undefined,
      turnover: Math.random() > 0.95 ? ["Fumble", "Interception", "On downs"][randomInt(0, 2)] as "Fumble" | "Interception" | "On downs" : undefined,
    },

    passing: isPass ? {
      result: Math.random() > 0.35 ? "Complete" : "Incomplete",
      pressure: Math.random() > 0.7 ? (Math.random() > 0.5 ? "Complete" : "Incomplete") : undefined,
      scramble: Math.random() > 0.9,
      sack: Math.random() > 0.92,
      throwaway: Math.random() > 0.95,
      airYards: randomInt(-2, 40),
      yac: randomInt(0, 25),
      timeToPass: parseFloat(randomFloat(1.8, 4.5).toFixed(2)),
      qbHit: Math.random() > 0.8,
      passLocation: passLocs[randomInt(0, passLocs.length - 1)],
      receiver: {
        targeted: true,
        reception: Math.random() > 0.35,
        drop: Math.random() > 0.92,
        contested: Math.random() > 0.75,
        route: routes[randomInt(0, routes.length - 1)],
        depth: depths[randomInt(0, depths.length - 1)]
      },
      defense: {
        breakup: Math.random() > 0.85,
        interception: Math.random() > 0.97,
        sack: Math.random() > 0.92,
        pressure: Math.random() > 0.7,
        coverage: coverages[randomInt(0, coverages.length - 1)]
      }
    } : undefined,

    rushing: isRun ? {
      attempt: gain > 0 ? "Gain" : "Loss / No gain",
      yac: randomInt(0, 10),
      direction: directions[randomInt(0, directions.length - 1)],
      runGap: ["A-Gap", "B-Gap", "C-Gap", "D-Gap", "Outside"][randomInt(0, 4)] as "A-Gap" | "B-Gap" | "C-Gap" | "D-Gap" | "Outside",
      yardsAtContact: parseFloat(randomFloat(-2, 5).toFixed(1)),
      handoffType: ["Hand", "Pitch", "Toss"][randomInt(0, 2)] as "Hand" | "Pitch" | "Toss",
      defense: {
        tackleMade: Math.random() > 0.2,
        tackleMissed: Math.random() > 0.7,
        tfl: gain < 0,
        forcedFumble: Math.random() > 0.97
      }
    } : undefined,

    defense: {
      front: ["Over", "Under", "Bear", "Okie"][randomInt(0, 3)],
      coverageScheme: coverages[randomInt(0, coverages.length - 1)],
      coverageDetail: "Pattern Match",
      isBlitz: Math.random() > 0.7,
      blitzType: Math.random() > 0.7 ? "Fire Zone" : "Zero",
      pressurePoints: randomInt(0, 4),
      tackleType: ["Solo", "Assist", "Missed"][randomInt(0, 2)] as "Solo" | "Assist" | "Missed",
    },

    blocking: (isPass || isRun) ? {
      passBlock: isPass,
      runBlock: isRun,
      allowedPressure: isPass && Math.random() > 0.7,
      allowedSack: isPass && Math.random() > 0.92
    } : undefined,

    specialTeams: isSpecial ? {
      type: ["Field Goal", "PAT", "Punt", "Kickoff"][randomInt(0, 3)] as "Field Goal" | "PAT" | "Punt" | "Kickoff",
      result: ["Made", "Missed", "Blocked", "Downed", "Touchback"][randomInt(0, 4)],
      returnYards: randomInt(0, 40)
    } : undefined,

    onField,
    personnel: { 
      offense: ["11 Pers", "12 Pers", "21 Pers", "22 Pers", "13 Pers"][i % 5], 
      defense: ["Nickel 4-2-5", "Base 4-3", "Dime 4-1-6", "Base 3-4"][i % 4]
    },
    gain,
    videoUrl: "/placeholder-video.mp4",
    thumbnailUrl: "/football-field-aerial.png",
    videoStartMs: randomInt(0, 5000),
    videoEndMs: randomInt(10000, 20000)
  }
})

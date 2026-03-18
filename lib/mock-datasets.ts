// Import clips and games for getAllUniqueClips - lazy loaded to avoid circular deps
import type { Clip } from "./mock-clips"

export interface PlayData {
  id: string
  playNumber: number
  odk: "O" | "D" | "K"
  quarter: number
  down: number
  distance: number
  yardLine: string
  hash: "L" | "R" | "M"
  yards: number
  result: string
  gainLoss: "Gn" | "Ls"
  defFront: string
  defStr: string
  coverage: string
  blitz: string
  game: string
  /** League: NFL, College, or HighSchool */
  league?: "NFL" | "College" | "HighSchool"
  /** Foreign key to Game.id from mock-games.ts */
  gameId?: string
  /** Athletes featured in this play */
  athleteIds?: string[]
  
  // Enhanced Pro Fields
  epa: number
  successRate: boolean
  explosivePlay: boolean
  formationName: string
  isShotgun: boolean
  timeToPass?: number
  passLocation?: string
  runGap?: string
  isTwoMinuteDrill: boolean
  
  playType: "Pass" | "Run" | "Special Teams"
  passResult?: "Complete" | "Incomplete" | "Sack" | "Interception" | "Throwaway"
  runDirection?: "Left" | "Middle" | "Right"
  personnelO: "11" | "12" | "21" | "22" | "10" | "Empty"
  personnelD: "Base" | "Nickel" | "Dime" | "Goal Line"
  isTouchdown: boolean
  isFirstDown: boolean
  isPenalty: boolean
  penaltyType?: string
  
  /** Absolute yard-line number (0-50), parsed once at generation time. */
  yardLineNumeric: number
  
  // Players On Field
  offenseIds: string[]
  defenseIds: string[]
}

export interface Dataset {
  id: string
  name: string
  plays: PlayData[]
}

// Simple seeded PRNG (mulberry32) for deterministic random data across server/client
function createSeededRandom(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const VIDEO_POOL = [
  "https://www.youtube.com/embed/LDGIdxOFgTc",
  "https://www.youtube.com/embed/3iBuXdGL7ZM",
  "https://www.youtube.com/embed/LDGIdxOFgTc",
  "https://www.youtube.com/embed/r4cjaa3u_Ls",
  "https://www.youtube.com/embed/jj0yzxcPMJE",
  "https://www.youtube.com/embed/8-8L1-OQykU",
  "https://www.youtube.com/embed/2txa-GRAFRE",
  "https://www.youtube.com/embed/B2fbxpJoz3o",
  "https://www.youtube.com/embed/kGw9oVQFseA",
  "https://www.youtube.com/embed/N1rBDCTNnXA",
]

export function getRandomVideoUrl(excludeUrl?: string | null): string {
  const available = excludeUrl ? VIDEO_POOL.filter((url) => url !== excludeUrl) : VIDEO_POOL
  if (available.length === 0) return VIDEO_POOL[0]
  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

let globalSeed = 42

const generatePlays = (count: number, gameName: string): PlayData[] => {
  const random = createSeededRandom(globalSeed)
  globalSeed += 1000 // Advance seed for next dataset to get different but deterministic data

  const personnelOOptions: PlayData["personnelO"][] = ["11", "12", "21", "22", "10", "Empty"]
  const personnelDOptions: PlayData["personnelD"][] = ["Base", "Nickel", "Dime", "Goal Line"]
  const passResults: PlayData["passResult"][] = ["Complete", "Incomplete", "Sack", "Interception", "Throwaway"]
  const runDirections: PlayData["runDirection"][] = ["Left", "Middle", "Right"]
  const penaltyTypes = ["Holding", "False Start", "Offsides", "Pass Interference", "Illegal Formation"]
  const formations = ["Trey Left", "Deuce Right", "Empty Strong", "Trips Right", "I-Form Tight"]
  const runGaps = ["A-Gap", "B-Gap", "C-Gap", "D-Gap", "Outside"]
  const passLocs = ["Left Sideline", "Left Numbers", "Middle", "Right Numbers", "Right Sideline"]

  return Array.from({ length: count }).map((_, i) => {
    const gain = Math.floor(random() * 20) - 5
    const odk = random() > 0.5 ? "O" : random() > 0.5 ? "D" : "K"
    const playType: PlayData["playType"] = odk === "K" ? "Special Teams" : random() > 0.5 ? "Pass" : "Run"
    const distance = Math.floor(random() * 10) + 1
    const isPenalty = random() > 0.9
    const yardLineRaw = Math.floor(random() * 50)
    const epa = (random() * 8) - 3.5; // range between -3.5 and 4.5

    // Generate pseudo-random athlete IDs for on-field logic
    const offenseIds = Array.from({length: 11}, () => `ath-${String(Math.floor(random() * 26) + 1).padStart(3, '0')}`);
    const defenseIds = Array.from({length: 11}, () => `ath-${String(Math.floor(random() * 24) + 27).padStart(3, '0')}`);

    return {
      id: `play-${i}`,
      playNumber: i + 1,
      odk,
      quarter: Math.floor(i / (count / 4)) + 1,
      down: (i % 4) + 1,
      distance,
      yardLine: `${random() > 0.5 ? "-" : "+"}${yardLineRaw}`,
      yardLineNumeric: yardLineRaw,
      hash: ["L", "R", "M"][Math.floor(random() * 3)] as "L" | "R" | "M",
      yards: Math.abs(gain),
      result: playType === "Pass" ? passResults[Math.floor(random() * 2)] || "Pass" : "Run",
      gainLoss: gain >= 0 ? "Gn" : "Ls",
      defFront: ["Over", "Under", "Bear", "Okie"][Math.floor(random() * 4)],
      defStr: ["Strong", "Weak"][Math.floor(random() * 2)],
      coverage: ["Cov 1", "Cov 2", "Cov 3", "Quarters"][Math.floor(random() * 4)],
      blitz: random() > 0.8 ? "Yes" : "No",
      game: gameName,
      
      // Pro Fields
      epa: parseFloat(epa.toFixed(2)),
      successRate: epa > 0,
      explosivePlay: gain > 15,
      formationName: formations[Math.floor(random() * formations.length)],
      isShotgun: random() > 0.4,
      timeToPass: playType === "Pass" ? parseFloat(((random() * 2.5) + 1.5).toFixed(2)) : undefined,
      passLocation: playType === "Pass" ? passLocs[Math.floor(random() * passLocs.length)] : undefined,
      runGap: playType === "Run" ? runGaps[Math.floor(random() * runGaps.length)] : undefined,
      isTwoMinuteDrill: random() > 0.85,
      offenseIds: [...new Set(offenseIds)],
      defenseIds: [...new Set(defenseIds)],

      // Enhanced fields
      playType,
      passResult: playType === "Pass" ? passResults[Math.floor(random() * passResults.length)] : undefined,
      runDirection: playType === "Run" ? runDirections[Math.floor(random() * runDirections.length)] : undefined,
      personnelO: personnelOOptions[Math.floor(random() * personnelOOptions.length)],
      personnelD: personnelDOptions[Math.floor(random() * personnelDOptions.length)],
      isTouchdown: random() > 0.9,
      isFirstDown: gain >= distance,
      isPenalty,
      penaltyType: isPenalty ? penaltyTypes[Math.floor(random() * penaltyTypes.length)] : undefined,
    }
  })
}

export const MOCK_DATASETS: Dataset[] = [
  { id: "dataset-a", name: "NFL Highlights", plays: generatePlays(10, "BUF vs LA 01.01.26") },
  { id: "dataset-b", name: "Practice Drills", plays: generatePlays(12, "Practice - Wed 10.12") },
  { id: "dataset-c", name: "Scrimmage", plays: generatePlays(15, "LSU Spring Scrimmage") },
  { id: "dataset-d", name: "Full Game", plays: generatePlays(20, "SF vs PHI 12.03.23") },
]

export function getDatasetForItem(itemId: string | null): Dataset {
  if (!itemId) return MOCK_DATASETS[0]
  const index = itemId.length % MOCK_DATASETS.length
  return MOCK_DATASETS[index]
}

export function getAllUniqueClips(): Dataset {
  // Lazy load to avoid circular dependencies
  const { mockClips } = require("./mock-clips") as { mockClips: Clip[] }
  const { getGameById } = require("./mock-games") as { getGameById: (id: string) => { league?: string } | undefined }
  
  // Convert detailed clips from mock-clips.ts to PlayData format
  // This ensures we use the rich clip data with game/league/athlete information
  
  const allPlays: PlayData[] = mockClips.map((clip: Clip, index: number) => {
    const game = getGameById(clip.gameId)
    const league = game?.league || "NFL"
    
    // Map hash format from Clip to PlayData
    const hashMap: Record<string, "L" | "R" | "M"> = { "Left": "L", "Right": "R", "Middle": "M" }
    
    return {
      id: clip.id,
      playNumber: index + 1,
      odk: clip.passing ? "O" : clip.rushing ? "O" : "K" as "O" | "D" | "K",
      quarter: clip.quarter,
      down: clip.down,
      distance: clip.distance,
      yardLine: `${clip.yardLine > 50 ? "+" : "-"}${clip.yardLine > 50 ? 100 - clip.yardLine : clip.yardLine}`,
      yardLineNumeric: clip.yardLine > 50 ? 100 - clip.yardLine : clip.yardLine,
      hash: hashMap[clip.hash] || "M",
      yards: Math.abs(clip.gain),
      result: clip.passing?.result || clip.rushing?.attempt || "Play",
      gainLoss: clip.gain >= 0 ? "Gn" : "Ls" as "Gn" | "Ls",
      defFront: clip.defense.front,
      defStr: "Strong",
      coverage: clip.defense.coverageScheme,
      blitz: clip.defense.isBlitz ? "Yes" : "No",
      game: clip.matchup,
      league,
      gameId: clip.gameId,
      athleteIds: clip.athleteIds,
      
      // Pro Fields
      epa: clip.analytics.epa,
      successRate: clip.analytics.successRate,
      explosivePlay: clip.analytics.explosivePlay,
      formationName: clip.formation.name,
      isShotgun: clip.formation.isShotgun,
      timeToPass: clip.passing?.timeToPass,
      passLocation: clip.passing?.passLocation,
      runGap: clip.rushing?.runGap,
      isTwoMinuteDrill: clip.isTwoMinuteDrill,
      offenseIds: clip.onField.offenseIds,
      defenseIds: clip.onField.defenseIds,
      
      // Enhanced fields
      playType: clip.passing ? "Pass" : clip.rushing ? "Run" : "Special Teams" as "Pass" | "Run" | "Special Teams",
      passResult: clip.passing?.result as PlayData["passResult"],
      runDirection: clip.rushing?.direction?.includes("Left") ? "Left" : 
                   clip.rushing?.direction?.includes("Right") ? "Right" : "Middle" as PlayData["runDirection"],
      personnelO: clip.formation.personnelO as PlayData["personnelO"],
      personnelD: clip.formation.personnelD as PlayData["personnelD"],
      isTouchdown: !!clip.playResult.touchdown,
      isFirstDown: !!clip.playResult.firstDown,
      isPenalty: !!clip.playResult.penalty,
      penaltyType: clip.playResult.penalty,
    }
  })

  return { id: "all-clips", name: "All Clips", plays: allPlays }
}

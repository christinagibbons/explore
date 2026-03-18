"use client"

/**
 * Games Context
 * 
 * Provides state management and helper functions for games data.
 * Connects games, clips, teams, and athletes together.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { mockGames, getGameById as getGameByIdFn } from "./mock-games"
import { mockClips, type Clip } from "./mock-clips"
import { teamRosters, getAthletesForTeam, getAthleteIdsForTeam, validateAthletesForGame } from "./mock-teams"
import { sportsData, type Team } from "./sports-data"
import { athletes, getAthleteById } from "./athletes-data"
import type { Game, GameStatus } from "@/types/game"
import type { Athlete } from "@/types/athlete"

// ---------------------------------------------------------------------------
// Context Types
// ---------------------------------------------------------------------------

interface GamesContextValue {
  // Games data
  games: Game[]
  getGameById: (gameId: string) => Game | undefined
  getGamesForTeam: (teamId: string) => Game[]
  getGamesByWeek: (season: string, week: number) => Game[]
  getGamesBySeason: (season: string) => Game[]
  getGamesByStatus: (status: GameStatus) => Game[]
  
  // Clips data (connected to games)
  clips: Clip[]
  getClipsForGame: (gameId: string) => Clip[]
  getClipById: (clipId: string) => Clip | undefined
  
  // Team data (connected to games)
  getTeamById: (teamId: string) => Team | undefined
  getTeamsForGame: (gameId: string) => { home: Team | undefined; away: Team | undefined }
  
  // Athletes data (connected to teams and clips)
  getAthletesForTeam: (teamId: string) => (Athlete & { id: string })[]
  getAthletesForGame: (gameId: string) => (Athlete & { id: string })[]
  getAthletesForClip: (clipId: string) => (Athlete & { id: string })[]
  
  // Validation
  validateClipAthletes: (clipId: string) => boolean
  
  // Metadata
  availableSeasons: string[]
  availableWeeks: { season: string; week: number }[]
}

// ---------------------------------------------------------------------------
// Helper: Find team by ID or abbreviation across all leagues/conferences
// ---------------------------------------------------------------------------

function findTeamById(teamId: string): Team | undefined {
  const normalizedId = teamId.toLowerCase()
  for (const league of Object.values(sportsData)) {
    for (const conference of league.conferences) {
      // Check direct teams - match by id or abbreviation (case-insensitive)
      const directTeam = conference.teams.find(
        (t) => t.id === normalizedId || t.abbreviation?.toLowerCase() === normalizedId
      )
      if (directTeam) return directTeam

      // Check subdivisions
      if (conference.subdivisions) {
        for (const subdivision of conference.subdivisions) {
          const subTeam = subdivision.teams.find(
            (t) => t.id === normalizedId || t.abbreviation?.toLowerCase() === normalizedId
          )
          if (subTeam) return subTeam
        }
      }
    }
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Context Creation
// ---------------------------------------------------------------------------

const GamesContext = createContext<GamesContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

interface GamesProviderProps {
  children: ReactNode
}

export function GamesProvider({ children }: GamesProviderProps) {
  // Memoize derived data
  const contextValue = useMemo<GamesContextValue>(() => {
    // Games helpers
    const getGameById = (gameId: string) => getGameByIdFn(gameId)
    
    const getGamesForTeam = (teamId: string) =>
      mockGames.filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId)
    
    const getGamesByWeek = (season: string, week: number) =>
      mockGames.filter((g) => g.season === season && g.week === week)
    
    const getGamesBySeason = (season: string) =>
      mockGames.filter((g) => g.season === season)
    
    const getGamesByStatus = (status: GameStatus) =>
      mockGames.filter((g) => g.status === status)
    
    // Clips helpers
    const getClipsForGame = (gameId: string) =>
      mockClips.filter((c) => c.gameId === gameId)
    
    const getClipById = (clipId: string) =>
      mockClips.find((c) => c.id === clipId)
    
    // Team helpers
    const getTeamById = (teamId: string) => findTeamById(teamId)
    
    const getTeamsForGame = (gameId: string) => {
      const game = getGameById(gameId)
      if (!game) return { home: undefined, away: undefined }
      return {
        home: findTeamById(game.homeTeamId),
        away: findTeamById(game.awayTeamId),
      }
    }
    
    // Athletes helpers
    const getAthletesForGameFn = (gameId: string) => {
      const game = getGameById(gameId)
      if (!game) return []
      return [
        ...getAthletesForTeam(game.homeTeamId),
        ...getAthletesForTeam(game.awayTeamId),
      ]
    }
    
    const getAthletesForClip = (clipId: string) => {
      const clip = getClipById(clipId)
      if (!clip) return []
      return clip.athleteIds
        .map((id) => getAthleteById(id))
        .filter((a): a is Athlete & { id: string } => a !== undefined)
    }
    
    // Validation
    const validateClipAthletes = (clipId: string): boolean => {
      const clip = getClipById(clipId)
      if (!clip) return false
      
      const game = getGameById(clip.gameId)
      if (!game) return false
      
      return validateAthletesForGame(clip.athleteIds, game.homeTeamId, game.awayTeamId)
    }
    
    // Metadata
    const availableSeasons = [...new Set(mockGames.map((g) => g.season))].sort().reverse()
    
    const weeksMap = new Map<string, { season: string; week: number }>()
    mockGames.forEach((g) => {
      const key = `${g.season}-${g.week}`
      if (!weeksMap.has(key)) {
        weeksMap.set(key, { season: g.season, week: g.week })
      }
    })
    const availableWeeks = Array.from(weeksMap.values()).sort((a, b) => {
      if (a.season !== b.season) return b.season.localeCompare(a.season)
      return a.week - b.week
    })
    
    return {
      games: mockGames,
      getGameById,
      getGamesForTeam,
      getGamesByWeek,
      getGamesBySeason,
      getGamesByStatus,
      clips: mockClips,
      getClipsForGame,
      getClipById,
      getTeamById,
      getTeamsForGame,
      getAthletesForTeam,
      getAthletesForGame: getAthletesForGameFn,
      getAthletesForClip,
      validateClipAthletes,
      availableSeasons,
      availableWeeks,
    }
  }, [])

  return (
    <GamesContext.Provider value={contextValue}>
      {children}
    </GamesContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGames(): GamesContextValue {
  const context = useContext(GamesContext)
  if (!context) {
    throw new Error("useGames must be used within a GamesProvider")
  }
  return context
}

// ---------------------------------------------------------------------------
// Standalone utility functions (for use outside React)
// ---------------------------------------------------------------------------

export {
  getGameByIdFn as getGameById,
  mockGames,
  mockClips,
  findTeamById,
  getAthletesForTeam,
  getAthleteIdsForTeam,
  validateAthletesForGame,
}

// Re-export for convenience
export { findTeamById as getTeamById }

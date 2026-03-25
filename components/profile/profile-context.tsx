"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type ProfileModule = "clips" | "games" | "reports"

// Scope types for filtering profile data
export type ScopeType = "current" | "career" | "custom"
export type SeasonYear = "2025" | "2024" | "2023" | "2022" | "2021"

export interface ProfileScope {
  type: ScopeType
  customSeasons?: SeasonYear[]
}

export const AVAILABLE_SEASONS: SeasonYear[] = ["2025", "2024", "2023", "2022", "2021"]

interface ProfileContextType {
  // Scope for filtering data
  scope: ProfileScope
  setScope: (scope: ProfileScope) => void
  
  // Module visibility
  visibleModules: {
    clips: boolean
    games: boolean
    reports: boolean
  }
  toggleModule: (module: ProfileModule) => void
  
  // Panel sizes
  modulePanelSize: number
  setModulePanelSize: (size: number) => void
  
  // Active module (for the panel content)
  activeModule: ProfileModule | null
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<ProfileScope>({ type: "current" })
  
  const [visibleModules, setVisibleModules] = useState({
    clips: false,
    games: false,
    reports: false,
  })
  
  const [modulePanelSize, setModulePanelSize] = useState(35)
  const [activeModule, setActiveModule] = useState<ProfileModule | null>(null)
  
  const toggleModule = (module: ProfileModule) => {
    setVisibleModules((prev) => {
      const newState = {
        clips: false,
        games: false,
        reports: false,
        [module]: !prev[module],
      }
      // Track active module
      if (newState[module]) {
        setActiveModule(module)
      } else {
        setActiveModule(null)
      }
      return newState
    })
  }
  
  return (
    <ProfileContext.Provider
      value={{
        scope,
        setScope,
        visibleModules,
        toggleModule,
        modulePanelSize,
        setModulePanelSize,
        activeModule,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfileContext() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider")
  }
  return context
}

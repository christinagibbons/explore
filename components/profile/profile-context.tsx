"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type ProfileModule = "clips" | "games" | "reports"

interface ProfileContextType {
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

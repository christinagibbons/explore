"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Athlete } from "@/types/athlete"
import type { Team } from "@/lib/sports-data"
import type { PlayData } from "@/lib/mock-datasets"

// Profile entity types
export type ProfileEntityType = "athlete" | "team"

export interface ProfileEntity {
  type: ProfileEntityType
  athlete?: Athlete & { id: string }
  team?: Team
}

// Module types that can be shown in profile view
export type ProfileModuleType = "clips" | "events" | "reports"

interface ProfileContextType {
  // Current profile entity
  entity: ProfileEntity | null
  setEntity: (entity: ProfileEntity | null) => void
  
  // Module visibility
  visibleModules: {
    clips: boolean
    events: boolean
    reports: boolean
  }
  toggleModule: (module: ProfileModuleType) => void
  
  // Panel sizes (persisted for session)
  clipsPanelSize: number
  setClipsPanelSize: (size: number) => void
  reportsPanelSize: number
  setReportsPanelSize: (size: number) => void
  
  // Selected clip for preview
  selectedClip: PlayData | null
  setSelectedClip: (clip: PlayData | null) => void
  
  // Clips data (filtered for the entity)
  clips: PlayData[]
  setClips: (clips: PlayData[]) => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [entity, setEntity] = useState<ProfileEntity | null>(null)
  const [selectedClip, setSelectedClip] = useState<PlayData | null>(null)
  const [clips, setClips] = useState<PlayData[]>([])
  
  const [visibleModules, setVisibleModules] = useState({
    clips: false,
    events: false,
    reports: false,
  })
  
  const [clipsPanelSize, setClipsPanelSize] = useState(35)
  const [reportsPanelSize, setReportsPanelSize] = useState(25)
  
  const toggleModule = (module: ProfileModuleType) => {
    setVisibleModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }))
  }
  
  return (
    <ProfileContext.Provider
      value={{
        entity,
        setEntity,
        visibleModules,
        toggleModule,
        clipsPanelSize,
        setClipsPanelSize,
        reportsPanelSize,
        setReportsPanelSize,
        selectedClip,
        setSelectedClip,
        clips,
        setClips,
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

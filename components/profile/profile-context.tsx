"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface ProfileContextType {
  // Module visibility
  visibleModules: {
    reports: boolean
  }
  toggleModule: (module: "reports") => void
  
  // Panel sizes
  reportsPanelSize: number
  setReportsPanelSize: (size: number) => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [visibleModules, setVisibleModules] = useState({
    reports: false,
  })
  
  const [reportsPanelSize, setReportsPanelSize] = useState(30)
  
  const toggleModule = (module: "reports") => {
    setVisibleModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }))
  }
  
  return (
    <ProfileContext.Provider
      value={{
        visibleModules,
        toggleModule,
        reportsPanelSize,
        setReportsPanelSize,
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

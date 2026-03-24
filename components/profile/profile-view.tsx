"use client"

import { useEffect, useRef } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ProfileProvider, useProfileContext } from "@/components/profile/profile-context"
import { ProfileToolbar } from "@/components/profile/profile-toolbar"
import { AthleteOverview } from "@/components/profile/athlete-overview"
import { ReportsModule } from "@/components/reports-module"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import type { ImperativePanelHandle } from "react-resizable-panels"
import type { Athlete } from "@/types/athlete"
import type { Team } from "@/lib/sports-data"

interface ProfileViewProps {
  athlete: Athlete & { id: string }
  onNavigateToTeam?: (team: Team) => void
  onClose?: () => void
}

function ProfileContent({ athlete, onNavigateToTeam, onClose }: ProfileViewProps) {
  const { 
    visibleModules, 
    reportsPanelSize,
    setReportsPanelSize,
  } = useProfileContext()

  const reportsPanelRef = useRef<ImperativePanelHandle>(null)

  // Collapse/expand reports panel based on visibility
  useEffect(() => {
    if (visibleModules.reports) {
      reportsPanelRef.current?.expand()
    } else {
      reportsPanelRef.current?.collapse()
    }
  }, [visibleModules.reports])

  const handleBreadcrumbNavigate = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex h-full w-full">
      {/* Main Resizable Area */}
      <div className="flex-1 min-w-0 bg-sidebar p-3 pr-0">
        <ResizablePanelGroup
          direction="horizontal"
          className="[&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out"
        >
          {/* LEFT: Overview (primary content) */}
          <ResizablePanel
            defaultSize={100 - (visibleModules.reports ? reportsPanelSize : 0)}
            minSize={40}
            id="profile-main-panel"
            order={1}
          >
            <div className="h-full overflow-hidden bg-background rounded-lg flex flex-col">
              {/* Breadcrumbs */}
              <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
                <ExploreBreadcrumbs onNavigate={handleBreadcrumbNavigate} />
              </div>
              {/* Overview Content */}
              <div className="flex-1 overflow-hidden">
                <AthleteOverview 
                  athlete={athlete} 
                  onNavigateToTeam={onNavigateToTeam}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-transparent" />

          {/* RIGHT: Reports panel - collapsible */}
          <ResizablePanel
            ref={reportsPanelRef}
            defaultSize={reportsPanelSize}
            minSize={20}
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              if (size > 0) setReportsPanelSize(size)
            }}
            id="profile-reports-panel"
            order={2}
          >
            <div className="h-full overflow-hidden ml-3">
              <ReportsModule />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* RHS Toolbar */}
      <ProfileToolbar />
    </div>
  )
}

export function ProfileView(props: ProfileViewProps) {
  return (
    <ProfileProvider>
      <ProfileContent {...props} />
    </ProfileProvider>
  )
}

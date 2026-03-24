"use client"

import { useEffect, useRef, useMemo } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ProfileProvider, useProfileContext } from "@/components/profile/profile-context"
import { ProfileToolbar } from "@/components/profile/profile-toolbar"
import { AthleteOverview } from "@/components/profile/athlete-overview"
import { GridModule } from "@/components/grid-module"
import { ReportsModule } from "@/components/reports-module"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import { useBreadcrumbContext } from "@/lib/breadcrumb-context"
import { mockDatasets } from "@/lib/mock-datasets"
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
    clipsPanelSize, 
    setClipsPanelSize,
    reportsPanelSize,
    setReportsPanelSize,
    selectedClip,
    setSelectedClip,
  } = useProfileContext()
  const { popToAnchor } = useBreadcrumbContext()

  const clipsPanelRef = useRef<ImperativePanelHandle>(null)
  const reportsPanelRef = useRef<ImperativePanelHandle>(null)

  // Get clips filtered for this athlete (mock - in reality this would be API call)
  const athleteClipsDataset = useMemo(() => {
    // For now, return first 20 clips from mock data as "athlete clips"
    const plays = mockDatasets["off-rpo"]?.plays.slice(0, 20) || []
    return {
      id: `athlete-${athlete.id}-clips`,
      name: `${athlete.name} Clips`,
      plays,
    }
  }, [athlete.id, athlete.name])

  // Collapse/expand panels based on visibility
  useEffect(() => {
    if (visibleModules.clips) {
      clipsPanelRef.current?.expand()
    } else {
      clipsPanelRef.current?.collapse()
    }
  }, [visibleModules.clips])

  useEffect(() => {
    if (visibleModules.reports) {
      reportsPanelRef.current?.expand()
    } else {
      reportsPanelRef.current?.collapse()
    }
  }, [visibleModules.reports])

  const handleBreadcrumbNavigate = () => {
    // Navigate back via breadcrumbs
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex h-full w-full">
      {/* Main Resizable Area */}
      <div className="flex-1 min-w-0 bg-sidebar">
        <ResizablePanelGroup
          direction="horizontal"
          className="[&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out"
        >
          {/* LEFT: Overview + Clips (vertical split) */}
          <ResizablePanel
            defaultSize={100 - (visibleModules.reports ? reportsPanelSize : 0)}
            minSize={40}
            id="profile-main-panel"
            order={1}
          >
            <ResizablePanelGroup
              direction="vertical"
              className="[&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out"
            >
              {/* TOP: Overview (primary content) */}
              <ResizablePanel
                defaultSize={visibleModules.clips ? 100 - clipsPanelSize : 100}
                minSize={30}
                id="profile-overview-panel"
                order={1}
              >
                <div className="h-full overflow-hidden bg-background rounded-lg m-1 ml-0 flex flex-col">
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

              {/* BOTTOM: Clips Grid - collapsible */}
              <ResizablePanel
                ref={clipsPanelRef}
                defaultSize={clipsPanelSize}
                minSize={20}
                collapsible
                collapsedSize={0}
                onResize={(size) => {
                  if (size > 0) setClipsPanelSize(size)
                }}
                id="profile-clips-panel"
                order={2}
              >
                <div className="h-full overflow-hidden m-1 ml-0 mt-0">
                  <GridModule
                    showTabs={false}
                    dataset={athleteClipsDataset}
                    onClickPlay={setSelectedClip}
                    activePlayId={selectedClip?.id}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
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
            <div className="h-full overflow-hidden m-1 mr-0 ml-0">
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

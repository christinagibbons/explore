"use client"

// Profile view component - displays athlete overview with collapsible module panels
import { useEffect, useRef, useMemo } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ProfileProvider, useProfileContext } from "@/components/profile/profile-context"
import { ProfileToolbar } from "@/components/profile/profile-toolbar"
import { AthleteOverview } from "@/components/profile/athlete-overview"
import { ReportsModule } from "@/components/reports-module"
import { GridModule } from "@/components/grid-module"
import { GamesModule } from "@/components/games-module"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import { MOCK_DATASETS } from "@/lib/mock-datasets"
import type { ImperativePanelHandle } from "react-resizable-panels"
import type { Athlete } from "@/types/athlete"
import type { Team, Game } from "@/lib/sports-data"
import type { PlayData } from "@/lib/play-data"

interface ProfileViewProps {
  athlete: Athlete & { id: string }
  onNavigateToTeam?: (team: Team) => void
  onClickClip?: (play: PlayData) => void
  onClickGame?: (game: Game) => void
  onClose?: () => void
}

function ProfileContent({ athlete, onNavigateToTeam, onClickClip, onClickGame, onClose }: ProfileViewProps) {
  const { 
    visibleModules, 
    modulePanelSize,
    setModulePanelSize,
    activeModule,
  } = useProfileContext()

  const modulePanelRef = useRef<ImperativePanelHandle>(null)
  
  // Mock dataset for athlete clips
  const athleteClipsDataset = useMemo(() => {
    const plays = MOCK_DATASETS[0]?.plays.slice(0, 30) || []
    return {
      id: `athlete-${athlete.id}-clips`,
      name: `${athlete.name} Clips`,
      plays,
    }
  }, [athlete.id, athlete.name])
  
  // Check if any module is visible
  const isModulePanelOpen = visibleModules.clips || visibleModules.games || visibleModules.reports

  // Collapse/expand module panel based on visibility
  useEffect(() => {
    if (isModulePanelOpen) {
      modulePanelRef.current?.expand()
    } else {
      modulePanelRef.current?.collapse()
    }
  }, [isModulePanelOpen])

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
            defaultSize={100 - (isModulePanelOpen ? modulePanelSize : 0)}
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

          {/* RIGHT: Module panel - collapsible (Clips, Games, or Reports) */}
          <ResizablePanel
            ref={modulePanelRef}
            defaultSize={modulePanelSize}
            minSize={25}
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              if (size > 0) setModulePanelSize(size)
            }}
            id="profile-module-panel"
            order={2}
          >
            <div className="h-full overflow-hidden ml-3">
              {activeModule === "clips" && (
                <GridModule
                  showTabs={false}
                  dataset={athleteClipsDataset}
                  onClickPlay={onClickClip}
                />
              )}
              {activeModule === "games" && (
                <GamesModule
                  selectedLeagues={[athlete.league]}
                  onClickGame={onClickGame}
                />
              )}
              {activeModule === "reports" && (
                <ReportsModule />
              )}
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

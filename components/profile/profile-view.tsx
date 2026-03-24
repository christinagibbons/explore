"use client"

// Profile view component - displays athlete overview with collapsible module panels
import { useEffect, useRef, useState } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ProfileProvider, useProfileContext } from "@/components/profile/profile-context"
import { ProfileToolbar } from "@/components/profile/profile-toolbar"
import { AthleteOverview } from "@/components/profile/athlete-overview"
import { ReportsModule } from "@/components/reports-module"
import { ClipsListModule } from "@/components/profile/clips-list-module"
import { GamesListModule } from "@/components/profile/games-list-module"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import { PreviewModuleV1 } from "@/components/explore/preview-module-v1"
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
  const [previewTeam, setPreviewTeam] = useState<Team | null>(null)
  const [previewClip, setPreviewClip] = useState<PlayData | null>(null)
  const [previewGame, setPreviewGame] = useState<Game | null>(null)
  
  // Check if any module is visible
  const isModulePanelOpen = visibleModules.clips || visibleModules.games || visibleModules.reports
  
  // Handle team click - open preview
  const handleTeamClick = (team: Team) => {
    setPreviewTeam(team)
    setPreviewClip(null)
    setPreviewGame(null)
  }
  
  // Handle clip click - open preview
  const handleClipClick = (clip: PlayData) => {
    setPreviewClip(clip)
    setPreviewTeam(null)
    setPreviewGame(null)
  }
  
  // Handle game click - open preview
  const handleGameClick = (game: Game) => {
    setPreviewGame(game)
    setPreviewTeam(null)
    setPreviewClip(null)
  }
  
  // Handle closing preview
  const handleClosePreview = () => {
    setPreviewTeam(null)
    setPreviewClip(null)
    setPreviewGame(null)
  }

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
      {/* Main Resizable Area - no gap between modules (same context), use dividers */}
      <div className="flex-1 min-w-0 bg-sidebar py-3 pl-3 pr-0">
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
                  onNavigateToTeam={handleTeamClick}
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
            <div className="h-full overflow-hidden ml-0 border-l border-border">
              {activeModule === "clips" && (
                <ClipsListModule
                  athlete={athlete}
                  onClickClip={handleClipClick}
                />
              )}
              {activeModule === "games" && (
                <GamesListModule
                  athlete={athlete}
                  onClickGame={handleGameClick}
                />
              )}
              {activeModule === "reports" && (
                <ReportsModule />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Preview Panel - for team/clip/game previews (gap indicates different context) */}
      {(previewTeam || previewClip || previewGame) && (
        <div className="w-[400px] shrink-0 py-3 pr-3 pl-3">
          <PreviewModuleV1
            team={previewTeam || undefined}
            play={previewClip || undefined}
            game={previewGame || undefined}
            onClose={handleClosePreview}
          />
        </div>
      )}

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

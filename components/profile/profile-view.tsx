"use client"

// Profile view component - displays athlete overview with collapsible module panels
import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useLibraryContext } from "@/lib/library-context"
import { useBreadcrumbContext } from "@/lib/breadcrumb-context"
import { MOCK_DATASETS } from "@/lib/mock-datasets"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ProfileProvider, useProfileContext } from "@/components/profile/profile-context"
import { ProfileToolbar } from "@/components/profile/profile-toolbar"
import { AthleteOverview } from "@/components/profile/athlete-overview"
import { ReportsModule } from "@/components/reports-module"
import { ClipsListModule } from "@/components/profile/clips-list-module"
import { GamesListModule } from "@/components/profile/games-list-module"
import { PlaylistPreview } from "@/components/profile/playlist-preview"
import { ScopeSelector } from "@/components/profile/scope-selector"
import { TeamScopeSelector } from "@/components/profile/team-scope-selector"
import { GamePreview } from "@/components/profile/game-preview"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import { PreviewModuleV1 } from "@/components/explore/preview-module-v1"
import type { ImperativePanelHandle } from "react-resizable-panels"
import type { Athlete } from "@/types/athlete"
import { getTeamById } from "@/lib/games-context"
import type { Team, Game } from "@/lib/sports-data"
import type { PlayData } from "@/lib/play-data"

interface ProfileViewProps {
  athlete: Athlete & { id: string }
  onNavigateToTeam?: (team: Team) => void
  onFocusTeam?: (team: Team) => void
  onClickClip?: (play: PlayData) => void
  onClickGame?: (game: Game) => void
  onClose?: () => void
}

function ProfileContent({ athlete, onNavigateToTeam, onFocusTeam, onClickClip, onClickGame, onClose }: ProfileViewProps) {
  const router = useRouter()
  const { setPendingPreviewClips } = useLibraryContext()
  const { pushAnchor } = useBreadcrumbContext()
  
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
  const [playlistPreview, setPlaylistPreview] = useState<{ title: string } | null>(null)
  const [selectedTeamScope, setSelectedTeamScope] = useState<string | null>(null)
  const [gamePerformancePreview, setGamePerformancePreview] = useState<{
    week: string
    opponent: string
    result: string
    statLine: string
    grade: number
  } | null>(null)
  
  // Get mock clips for the playlist preview
  const playlistClips = useMemo(() => {
    return MOCK_DATASETS[0]?.plays.slice(0, 8) || []
  }, [])
  
  // Check if any module is visible
  const isModulePanelOpen = visibleModules.clips || visibleModules.games || visibleModules.reports
  
  // Check if any preview is open (different context - hide toolbar)
  const isPreviewOpen = previewTeam || previewClip || previewGame || playlistPreview || gamePerformancePreview
  
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
    setPlaylistPreview(null)
    setGamePerformancePreview(null)
  }
  
  // Handle stat click - open a playlist preview
  const handleStatClick = (statLabel: string) => {
    setPlaylistPreview({ title: statLabel })
    setPreviewTeam(null)
    setPreviewClip(null)
    setPreviewGame(null)
    setGamePerformancePreview(null)
  }
  
  // Handle game click from game log - open game preview
  const handleGamePerformanceClick = (game: {
    week: string
    opponent: string
    result: string
    statLine: string
    grade: number
  }) => {
    setGamePerformancePreview(game)
    setPreviewTeam(null)
    setPreviewClip(null)
    setPreviewGame(null)
    setPlaylistPreview(null)
  }
  
  // Handle watch full game - navigate to watch with game clips
  const handleWatchFullGame = () => {
    if (!gamePerformancePreview) return
    
    // Convert PlayData to ClipData format for the library context
    const clips = playlistClips.map((play) => ({
      id: play.id,
      playNumber: play.playNumber,
      odk: play.odk,
      quarter: play.quarter,
      down: play.down,
      distance: play.distance,
      yardLine: play.yardLine,
      hash: play.hash,
      yards: play.yards,
      result: play.result,
      gainLoss: play.gainLoss,
      defFront: play.defFront,
      defStr: play.defStr,
      coverage: play.coverage,
      blitz: play.blitz,
      game: play.game,
      playType: play.playType,
      passResult: play.passResult,
      runDirection: play.runDirection,
      personnelO: play.personnelO,
      personnelD: play.personnelD,
      isTouchdown: play.isTouchdown,
      isFirstDown: play.isFirstDown,
      isPenalty: play.isPenalty,
      penaltyType: play.penaltyType,
    }))
    
    const gameName = `${gamePerformancePreview.week} vs ${gamePerformancePreview.opponent}`
    
    // Push the game to breadcrumbs
    pushAnchor({
      anchorType: "entity",
      specificType: "game",
      label: gameName,
      id: `game-${gamePerformancePreview.week}-${gamePerformancePreview.opponent}`,
    })
    
    // Set pending clips with the game name
    setPendingPreviewClips(clips, gameName)
    
    // Navigate to watch
    router.push("/watch")
  }
  
  // Handle view full playlist - navigate to watch with clips
  const handleViewFullPlaylist = () => {
    if (!playlistPreview) return
    
    // Convert PlayData to ClipData format for the library context
    const clips = playlistClips.map((play) => ({
      id: play.id,
      playNumber: play.playNumber,
      odk: play.odk,
      quarter: play.quarter,
      down: play.down,
      distance: play.distance,
      yardLine: play.yardLine,
      hash: play.hash,
      yards: play.yards,
      result: play.result,
      gainLoss: play.gainLoss,
      defFront: play.defFront,
      defStr: play.defStr,
      coverage: play.coverage,
      blitz: play.blitz,
      game: play.game,
      playType: play.playType,
      passResult: play.passResult,
      runDirection: play.runDirection,
      personnelO: play.personnelO,
      personnelD: play.personnelD,
      isTouchdown: play.isTouchdown,
      isFirstDown: play.isFirstDown,
      isPenalty: play.isPenalty,
      penaltyType: play.penaltyType,
    }))
    
    // Push the playlist to breadcrumbs
    pushAnchor({
      anchorType: "entity",
      specificType: "playlist",
      label: playlistPreview.title,
      id: `playlist-${playlistPreview.title}`,
    })
    
    // Set pending clips with the playlist name
    setPendingPreviewClips(clips, playlistPreview.title)
    
    // Navigate to watch
    router.push("/watch")
  }

  // Collapse/expand module panel based on visibility
  useEffect(() => {
    if (isModulePanelOpen) {
      modulePanelRef.current?.expand()
    } else {
      modulePanelRef.current?.collapse()
    }
  }, [isModulePanelOpen])

  const handleBreadcrumbNavigate = (anchor: { specificType: string; id?: string }) => {
    // If clicking on a team breadcrumb, navigate to that team
    if (anchor.specificType === "team" && anchor.id && onFocusTeam) {
      const team = getTeamById(anchor.id)
      if (team) {
        onFocusTeam(team)
        return
      }
    }
    // For collection breadcrumbs, close the profile
    if (anchor.specificType === "athletes" || anchor.specificType === "teams") {
      onClose?.()
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
              {/* Breadcrumbs with Scope Selectors */}
              <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
                <ExploreBreadcrumbs 
                  onNavigate={handleBreadcrumbNavigate} 
                  actions={
                    <div className="flex items-center gap-2">
                      <TeamScopeSelector 
                        athlete={athlete}
                        selectedTeam={selectedTeamScope}
                        onSelectTeam={setSelectedTeamScope}
                      />
                      <ScopeSelector />
                    </div>
                  }
                />
              </div>
              {/* Overview Content */}
              <div className="flex-1 overflow-hidden">
                <AthleteOverview 
                  athlete={athlete} 
                  onNavigateToTeam={handleTeamClick}
                  onClickStat={handleStatClick}
                  onClickGame={handleGamePerformanceClick}
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

      {/* Preview Panel - for team/clip/game/playlist previews (gap indicates different context) */}
      {isPreviewOpen && (
        <div className="w-[400px] shrink-0 py-3 pr-3 pl-3">
          {playlistPreview ? (
            <PlaylistPreview
              title={`${playlistPreview.title} Clips`}
              athleteName={athlete.name}
              onClose={handleClosePreview}
              onViewFullPlaylist={handleViewFullPlaylist}
            />
          ) : gamePerformancePreview ? (
            <GamePreview
              game={gamePerformancePreview}
              athleteName={athlete.name}
              onClose={handleClosePreview}
              onWatchFullGame={handleWatchFullGame}
            />
          ) : (
            <PreviewModuleV1
              team={previewTeam || undefined}
              play={previewClip || undefined}
              game={previewGame || undefined}
              onClose={handleClosePreview}
              onFocusTeam={onFocusTeam}
            />
          )}
        </div>
      )}

      {/* RHS Toolbar - hidden when preview is open (focus shifts to preview context) */}
      {!isPreviewOpen && <ProfileToolbar />}
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

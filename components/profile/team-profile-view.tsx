"use client"

// Team Profile view component - displays team overview with collapsible module panels
import { useEffect, useRef, useState } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ProfileProvider, useProfileContext } from "@/components/profile/profile-context"
import { TeamOverview } from "@/components/profile/team-overview"
import { RosterListModule } from "@/components/profile/roster-list-module"
import { GamesListModule } from "@/components/profile/games-list-module"
import { ReportsModule } from "@/components/reports-module"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import { PreviewModuleV1 } from "@/components/explore/preview-module-v1"
import { ScopeSelector } from "@/components/profile/scope-selector"
import { cn } from "@/lib/utils"
import { Play, Calendar, Users } from "lucide-react"
import type { ImperativePanelHandle } from "react-resizable-panels"
import type { Team, Game } from "@/lib/sports-data"
import type { Athlete } from "@/types/athlete"
import type { PlayData } from "@/lib/play-data"

// Custom toolbar for teams (Roster, Games, Reports)
const ReportsIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 2C2.44772 2 2 2.44772 2 3V13.5C2 14.0523 2.44772 14.5 3 14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5V3C14.5 2.44772 14.0523 2 13.5 2H3ZM9 5H7.5V12H9V5ZM6 8H4.5V12H6V8ZM10.5 9.5H12V12H10.5V9.5Z"
      fill="currentColor"
    />
  </svg>
)

function TeamToolbar({ visibleModules, toggleModule }: { 
  visibleModules: { roster: boolean; games: boolean; reports: boolean }
  toggleModule: (module: "roster" | "games" | "reports") => void 
}) {
  const ToggleBtn = ({
    active,
    onClick,
    icon,
    label,
  }: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-md transition-colors px-[0] h-10 w-10 gap-1",
        active
          ? "bg-foreground/90 text-background dark:bg-white/90 dark:text-sidebar"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  )

  return (
    <div className="w-16 flex flex-col bg-sidebar border-l border-border/20 z-20 shrink-0 items-center gap-3 py-3">
      <ToggleBtn
        active={visibleModules.roster}
        onClick={() => toggleModule("roster")}
        icon={<Users className="w-4 h-4" />}
        label="Roster"
      />
      <ToggleBtn
        active={visibleModules.games}
        onClick={() => toggleModule("games")}
        icon={<Calendar className="w-4 h-4" />}
        label="Games"
      />
      <ToggleBtn
        active={visibleModules.reports}
        onClick={() => toggleModule("reports")}
        icon={<ReportsIcon className="w-4 h-4" />}
        label="Reports"
      />
    </div>
  )
}

interface TeamProfileViewProps {
  team: Team
  onClose?: () => void
}

function TeamProfileContent({ team, onClose }: TeamProfileViewProps) {
  // Local state for team-specific modules
  const [visibleModules, setVisibleModules] = useState({
    roster: false,
    games: false,
    reports: false,
  })
  const [activeModule, setActiveModule] = useState<"roster" | "games" | "reports" | null>(null)
  const [modulePanelSize, setModulePanelSize] = useState(35)
  
  const modulePanelRef = useRef<ImperativePanelHandle>(null)
  
  // Preview state for different contexts
  const [previewAthlete, setPreviewAthlete] = useState<(Athlete & { id: string }) | null>(null)
  const [previewClip, setPreviewClip] = useState<PlayData | null>(null)
  const [previewGame, setPreviewGame] = useState<Game | null>(null)
  
  const toggleModule = (module: "roster" | "games" | "reports") => {
    setVisibleModules((prev) => {
      const newState = {
        roster: false,
        games: false,
        reports: false,
        [module]: !prev[module],
      }
      if (newState[module]) {
        setActiveModule(module)
      } else {
        setActiveModule(null)
      }
      return newState
    })
  }
  
  // Check if any module is visible
  const isModulePanelOpen = visibleModules.roster || visibleModules.games || visibleModules.reports
  
  // Check if any preview is open (different context - hide toolbar)
  const isPreviewOpen = previewAthlete || previewClip || previewGame
  
  // Handle athlete click - open preview (different context)
  const handleAthleteClick = (athlete: Athlete & { id: string }) => {
    setPreviewAthlete(athlete)
    setPreviewClip(null)
    setPreviewGame(null)
  }
  
  // Handle game click - open preview
  const handleGameClick = (game: Game) => {
    setPreviewGame(game)
    setPreviewAthlete(null)
    setPreviewClip(null)
  }
  
  // Handle closing preview
  const handleClosePreview = () => {
    setPreviewAthlete(null)
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
            id="team-profile-main-panel"
            order={1}
          >
            <div className="h-full overflow-hidden bg-background rounded-lg flex flex-col">
              {/* Breadcrumbs with Scope Selector */}
              <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
                <ExploreBreadcrumbs 
                  onNavigate={handleBreadcrumbNavigate}
                  actions={<ScopeSelector />}
                />
              </div>
              {/* Overview Content */}
              <div className="flex-1 overflow-hidden">
                <TeamOverview 
                  team={team} 
                  onNavigateToAthlete={handleAthleteClick}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-transparent" />

          {/* RIGHT: Module panel - collapsible (Roster, Games, or Reports) */}
          <ResizablePanel
            ref={modulePanelRef}
            defaultSize={modulePanelSize}
            minSize={25}
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              if (size > 0) setModulePanelSize(size)
            }}
            id="team-profile-module-panel"
            order={2}
          >
            <div className="h-full overflow-hidden ml-0 border-l border-border">
              {activeModule === "roster" && (
                <RosterListModule
                  team={team}
                  onClickAthlete={handleAthleteClick}
                />
              )}
              {activeModule === "games" && (
                <GamesListModule
                  team={team}
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

      {/* Preview Panel - for athlete/clip/game previews (gap indicates different context) */}
      {isPreviewOpen && (
        <div className="w-[400px] shrink-0 py-3 pr-3 pl-3">
          <PreviewModuleV1
            athlete={previewAthlete || undefined}
            play={previewClip || undefined}
            game={previewGame || undefined}
            onClose={handleClosePreview}
          />
        </div>
      )}

      {/* RHS Toolbar - hidden when preview is open (focus shifts to preview context) */}
      {!isPreviewOpen && (
        <TeamToolbar 
          visibleModules={visibleModules} 
          toggleModule={toggleModule} 
        />
      )}
    </div>
  )
}

export function TeamProfileView(props: TeamProfileViewProps) {
  return (
    <ProfileProvider>
      <TeamProfileContent {...props} />
    </ProfileProvider>
  )
}

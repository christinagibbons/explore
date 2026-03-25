"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { WatchProvider, useWatchContext } from "@/components/watch/watch-context"
import { GridModule } from "@/components/grid-module"
import { FiltersModule } from "@/components/filters-module"
import { GamesFiltersModule } from "@/components/games-filters-module"
import { GamesModule } from "@/components/games-module"
import { TeamsModule } from "@/components/teams-module"
import { AthletesModule } from "@/components/athletes-module"
import { PreviewModuleV1 } from "@/components/explore/preview-module-v1"
import { ProfileView } from "@/components/profile/profile-view"
import { TeamProfileView } from "@/components/profile/team-profile-view"
import { getAllUniqueClips } from "@/lib/mock-datasets"
import { AddToPlaylistMenu } from "@/components/add-to-playlist-menu"
import { useExploreFilters } from "@/hooks/use-explore-filters"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { useLibraryContext } from "@/lib/library-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import type { ClipData } from "@/types/library"
import type { PlayData } from "@/lib/mock-datasets"
import type { Game, GameLeague } from "@/types/game"
import type { Team } from "@/lib/sports-data"
import type { Athlete } from "@/types/athlete"
import { useExploreContext } from "@/lib/explore-context"
import { useBreadcrumbContext, type CollectionType } from "@/lib/breadcrumb-context"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"

const exploreTabs = [
  { value: "competitions", label: "Competitions" },
  { value: "teams", label: "Teams" },
  { value: "athletes", label: "Athletes" },
  { value: "games", label: "Games" },
  { value: "clips", label: "Clips" },
] as const

type ExploreTab = (typeof exploreTabs)[number]["value"]

function PreviewClipsButton() {
  const { selectedPlayIds, activeDataset, clearPlaySelection } = useWatchContext()
  const { setPendingPreviewClips } = useLibraryContext()
  const router = useRouter()

  if (selectedPlayIds.size === 0 || !activeDataset) return null

  const handlePreview = () => {
    const selectedPlays = activeDataset.plays.filter((p) => selectedPlayIds.has(p.id))
    const clips: ClipData[] = selectedPlays.map((play) => ({
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

    setPendingPreviewClips(clips)
    clearPlaySelection()
    router.push("/watch")
  }

  return (
    <Button variant="ghost" size="sm" onClick={handlePreview} className="flex items-center gap-1.5 text-sm">
      <Icon name="play" className="w-3.5 h-3.5" />
      Preview Clips
    </Button>
  )
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
      <Icon name="folder" className="w-10 h-10 opacity-40" />
      <p className="text-sm">{label} content coming soon</p>
    </div>
  )
}

/**
 * V1 - Preview Module Breadcrumbs
 * 
 * This is the baseline version with the original explore page behavior.
 * Customize this version to implement breadcrumb navigation in the preview module.
 */
export function ExploreV1() {
  const [activeTab, setActiveTab] = useState<ExploreTab>("clips")
  const [previewPlay, setPreviewPlay] = useState<PlayData | null>(null)
  const [previewGame, setPreviewGame] = useState<Game | null>(null)
  const [previewTeam, setPreviewTeam] = useState<Team | null>(null)
  const [previewAthlete, setPreviewAthlete] = useState<(Athlete & { id: string }) | null>(null)
  // Focused entity state - when an entity becomes the main content (full profile view)
  const [focusedAthlete, setFocusedAthlete] = useState<(Athlete & { id: string }) | null>(null)
  const [focusedTeam, setFocusedTeam] = useState<Team | null>(null)
  const { showFilters, setShowFilters, setActiveFilterCount } = useExploreContext()
  const { setCollectionAnchor, pushAnchor } = useBreadcrumbContext()
  const previewPanelRef = useRef<ImperativePanelHandle>(null)
  const filterPanelRef = useRef<ImperativePanelHandle>(null)

  // Games tab filter state
  const [selectedLeagues, setSelectedLeagues] = useState<GameLeague[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)

  const handleLeagueToggle = (league: GameLeague) => {
    setSelectedLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]
    )
  }

  const clearGamesFilters = () => {
    setSelectedLeagues([])
    setSelectedSeason(null)
  }

  const gamesFilterCount = selectedLeagues.length + (selectedSeason ? 1 : 0)

  // Set collection anchor when tab changes or on mount
  // This establishes the breadcrumb trail starting point
  useEffect(() => {
    setCollectionAnchor(activeTab as CollectionType)
    // setCollectionAnchor is a stable callback from context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (previewPlay || previewGame || previewTeam || previewAthlete) {
      previewPanelRef.current?.resize(50)
      setShowFilters(false)
    } else {
      previewPanelRef.current?.collapse()
      setShowFilters(true)
    }
  }, [previewPlay, previewGame, previewTeam, previewAthlete])

  const handleGameClick = (game: Game) => {
    setPreviewPlay(null)
    setPreviewTeam(null)
    setPreviewAthlete(null)
    setPreviewGame(game)
  }

  const handleClipClick = (play: PlayData) => {
    setPreviewGame(null)
    setPreviewTeam(null)
    setPreviewAthlete(null)
    setPreviewPlay(play)
  }

  const handleTeamClick = (team: Team) => {
    setPreviewPlay(null)
    setPreviewGame(null)
    setPreviewAthlete(null)
    setPreviewTeam(team)
  }

  const handleAthleteClick = (athlete: Athlete & { id: string }) => {
    setPreviewPlay(null)
    setPreviewGame(null)
    setPreviewTeam(null)
    setPreviewAthlete(athlete)
  }

  const handleClosePreview = () => {
    setPreviewPlay(null)
    setPreviewGame(null)
    setPreviewTeam(null)
    setPreviewAthlete(null)
  }

  // Handler for when an athlete becomes the focused entity (full profile in modules layout)
  const handleFocusAthlete = (athlete: Athlete & { id: string }) => {
    setFocusedAthlete(athlete)
    setFocusedTeam(null) // Clear team focus when switching to athlete
    setPreviewAthlete(null)
    setPreviewPlay(null)
    setPreviewGame(null)
    setPreviewTeam(null)
    // Push athlete to breadcrumbs
    pushAnchor({
      anchorType: "entity",
      specificType: "athlete",
      label: athlete.name,
      id: athlete.id,
    })
  }

  // Handler to go back from focused athlete to the list
  const handleCloseFocusedAthlete = () => {
    setFocusedAthlete(null)
  }

  // Handler for when a team becomes the focused entity (full profile in modules layout)
  const handleFocusTeam = (team: Team) => {
    setFocusedTeam(team)
    setFocusedAthlete(null) // Clear athlete focus when switching to team
    setPreviewTeam(null)
    setPreviewAthlete(null)
    setPreviewPlay(null)
    setPreviewGame(null)
    // Push team to breadcrumbs
    pushAnchor({
      anchorType: "entity",
      specificType: "team",
      label: team.name,
      id: team.id,
    })
  }

  // Handler to go back from focused team to the list
  const handleCloseFocusedTeam = () => {
    setFocusedTeam(null)
  }

  useEffect(() => {
    if (showFilters) {
      filterPanelRef.current?.expand()
    } else {
      filterPanelRef.current?.collapse()
    }
  }, [showFilters])

  const allClipsDataset = useMemo(() => getAllUniqueClips(), [])

  const {
    filters,
    rangeFilters,
    toggleFilter,
    toggleAllInCategory,
    setRangeFilter,
    clearFilters,
    filteredPlays,
    uniqueGames,
    activeFilterCount,
    isFiltering,
  } = useExploreFilters(allClipsDataset.plays)

  useEffect(() => {
    const count = activeTab === "games" || activeTab === "teams" || activeTab === "athletes" ? gamesFilterCount : activeFilterCount
    setActiveFilterCount(count)
  }, [activeFilterCount, gamesFilterCount, activeTab, setActiveFilterCount])

  const filteredDataset = useMemo(
    () => ({ ...allClipsDataset, plays: filteredPlays }),
    [allClipsDataset, filteredPlays]
  )

  // If an athlete is focused, render the ProfileView which has its own toolbar + module system
  if (focusedAthlete) {
    return (
      <div className="h-full w-full bg-sidebar">
        <ProfileView
          athlete={focusedAthlete}
          onNavigateToTeam={handleTeamClick}
          onFocusTeam={handleFocusTeam}
          onClose={handleCloseFocusedAthlete}
        />
      </div>
    )
  }

  // If a team is focused, render the TeamProfileView which has its own toolbar + module system
  if (focusedTeam) {
    return (
      <div className="h-full w-full bg-sidebar">
        <TeamProfileView
          team={focusedTeam}
          onClose={handleCloseFocusedTeam}
        />
      </div>
    )
  }

  return (
    <WatchProvider initialTabs={[allClipsDataset]}>
      <div className="flex flex-col h-full w-full bg-sidebar">
        <ResizablePanelGroup direction="horizontal" className="flex-1 [&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out">
          {/* Filters Panel */}
          <ResizablePanel
            ref={filterPanelRef}
            defaultSize={22}
            minSize={18}
            maxSize={35}
            collapsible
            collapsedSize={0}
            onCollapse={() => setShowFilters(false)}
            onExpand={() => setShowFilters(true)}
          >
            <div className="h-full pl-3 py-3">
              {activeTab === "games" || activeTab === "teams" || activeTab === "athletes" ? (
                <GamesFiltersModule
                  selectedLeagues={selectedLeagues}
                  selectedSeason={selectedSeason}
                  onLeagueToggle={handleLeagueToggle}
                  onSeasonChange={setSelectedSeason}
                  onClear={clearGamesFilters}
                />
              ) : (
                <FiltersModule
                  filters={filters}
                  rangeFilters={rangeFilters}
                  onToggle={toggleFilter}
                  onToggleAll={toggleAllInCategory}
                  onRangeChange={setRangeFilter}
                  onClear={clearFilters}
                  uniqueGames={uniqueGames}
                  activeFilterCount={activeFilterCount}
                  totalCount={allClipsDataset.plays.length}
                  filteredCount={filteredPlays.length}
                />
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-[8px] bg-transparent border-0 after:hidden before:hidden [&>div]:hidden" />

          {/* Main Content + Preview */}
          <ResizablePanel defaultSize={78}>
            <ResizablePanelGroup direction="horizontal" className="h-full [&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out">
              <ResizablePanel defaultSize={100} minSize={40} id="explore-main-v1" order={1}>
                <div className={cn("h-full flex flex-col py-3", !previewPlay && !previewGame && !previewTeam && !previewAthlete && "pr-3")}>
                  {/* Tabs header - no breadcrumbs on base explore page */}
                  <div className="px-3 pt-3 pb-2 bg-background rounded-t-lg">
                    {/* Tabs */}
                    <div className="flex items-center gap-2">
                    {exploreTabs.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200",
                          activeTab === tab.value
                            ? "bg-foreground text-background shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                    </div>
                  </div>

                  {/* Tab content - only show when not focused on entity */}
                  {activeTab === "competitions" ? (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <div className="p-6 text-center text-muted-foreground">
                        <p className="text-sm">Competitions module coming soon.</p>
                        <p className="text-xs mt-1">Browse leagues, tournaments, and seasonal competitions.</p>
                      </div>
                    </div>
                  ) : activeTab === "clips" ? (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden relative">
                      <GridModule
                        showTabs={false}
                        selectionActions={
                          <div className="flex items-center gap-1">
                            <AddToPlaylistMenu />
                            <PreviewClipsButton />
                          </div>
                        }
                        dataset={filteredDataset}
                        onClearFilters={clearFilters}
                        onClickPlay={handleClipClick}
                        activePlayId={previewPlay?.id}
                      />
                      {isFiltering && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none z-10">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Filtering...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : activeTab === "games" ? (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <GamesModule
                        selectedLeagues={selectedLeagues}
                        selectedSeason={selectedSeason}
                        onLeagueToggle={handleLeagueToggle}
                        onSeasonChange={setSelectedSeason}
                        onClickGame={handleGameClick}
                        activeGameId={previewGame?.id}
                      />
                    </div>
                  ) : activeTab === "teams" ? (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <TeamsModule
                        selectedLeagues={selectedLeagues}
                        selectedSeason={selectedSeason}
                        onClickTeam={handleTeamClick}
                        activeTeamId={previewTeam?.id}
                      />
                    </div>
                  ) : activeTab === "athletes" ? (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <AthletesModule
                        selectedLeagues={selectedLeagues}
                        selectedSeason={selectedSeason}
                        onClickAthlete={handleAthleteClick}
                        activeAthleteId={previewAthlete?.id}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <EmptyTabState label="Content" />
                    </div>
                  )}
                </div>
              </ResizablePanel>

              {/* Preview Panel */}
              <ResizableHandle className="w-[8px] bg-transparent border-0 after:hidden before:hidden [&>div]:hidden" />
              <ResizablePanel
                ref={previewPanelRef}
                defaultSize={0}
                minSize={30}
                maxSize={55}
                collapsible
                collapsedSize={0}
                id="explore-preview-v1"
                order={2}
              >
                <div className="h-full pr-3 py-3 pl-0">
                  {(previewPlay || previewGame || previewTeam || previewAthlete) && (
                    <PreviewModuleV1
                      play={previewPlay || undefined}
                      game={previewGame || undefined}
                      team={previewTeam || undefined}
                      athlete={previewAthlete || undefined}
                      onClose={handleClosePreview}
                      onFocusAthlete={handleFocusAthlete}
                      onFocusTeam={handleFocusTeam}
                    />
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </WatchProvider>
  )
}

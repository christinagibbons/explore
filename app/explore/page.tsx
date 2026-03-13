"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { WatchProvider, useWatchContext } from "@/components/watch/watch-context"
import { GridModule } from "@/components/grid-module"
import { FiltersModule } from "@/components/filters-module"
import { PreviewModule } from "@/components/preview-module"
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
import { TeamsBrowser } from "@/components/teams-browser"
import { TeamsFiltersModule, type TeamsFilterState } from "@/components/teams-filters-module"
import { TeamPreviewModule } from "@/components/team-preview-module"
import { GamesBrowser } from "@/components/games-browser"
import { GamesFiltersModule } from "@/components/games-filters-module"
import { GamePreviewModule } from "@/components/game-preview-module"
import { AthletePreviewModule } from "@/components/athlete-preview-module"
import type { GamesFilterState, Game } from "@/lib/games-data"
import type { League, Team } from "@/lib/sports-data"
import type { BreadcrumbItem } from "@/components/preview-module-shell"
import type { Athlete } from "@/types/athlete"

// Type for tracking preview navigation history
type PreviewNavItem = 
  | { type: "clip"; play: PlayData; label: string }
  | { type: "team"; team: Team; league: League; label: string }
  | { type: "game"; game: Game; label: string }
  | { type: "athlete"; athlete: Athlete; label: string }

const exploreTabs = [
  { value: "clips", label: "Clips" },
  { value: "games", label: "Games" },
  { value: "teams", label: "Teams" },
] as const

type ExploreTab = (typeof exploreTabs)[number]["value"]

function PreviewClipsButton() {
  const { selectedPlayIds, activeDataset, clearPlaySelection } = useWatchContext()
  const { setPendingPreviewClips } = useLibraryContext()
  const router = useRouter()

  if (selectedPlayIds.size === 0 || !activeDataset) return null

  const handlePreview = () => {
    // Collect the selected plays as ClipData
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

const FilterToggleIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2 2.25C2 2.11193 2.11193 2 2.25 2H13.75C13.8881 2 14 2.11193 14 2.25V3.34315C14 4.53662 13.5259 5.68121 12.682 6.52513L10 9.20711V13.75C10 13.8881 9.88807 14 9.75 14H6.25C6.11193 14 6 13.8881 6 13.75V9.20711L3.31802 6.52513C2.47411 5.68121 2 4.53662 2 3.34315V2.25ZM3 3V3.34315C3 4.2714 3.36875 5.16164 4.02513 5.81802L7 8.79289V13H9V8.79289L11.9749 5.81802C12.6313 5.16164 13 4.2714 13 3.34315V3H3Z" fill="currentColor"/>
  </svg>
)

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<ExploreTab>("clips")
  const [previewPlay, setPreviewPlay] = useState<PlayData | null>(null)
  const [previewTeam, setPreviewTeam] = useState<{ team: Team; league: League } | null>(null)
  const [previewGame, setPreviewGame] = useState<Game | null>(null)
  const [previewAthlete, setPreviewAthlete] = useState<Athlete | null>(null)
  const [previewNavStack, setPreviewNavStack] = useState<PreviewNavItem[]>([])
  const [showFilters, setShowFilters] = useState(true)
  const previewPanelRef = useRef<ImperativePanelHandle>(null)
  const filterPanelRef = useRef<ImperativePanelHandle>(null)
  
  // Teams tab filter state
  const [teamsFilters, setTeamsFilters] = useState<TeamsFilterState>({
    leagues: new Set(),
    conferences: new Set(),
  })
  
  // Games tab filter state
  const [gamesFilters, setGamesFilters] = useState<GamesFilterState>({
    leagues: new Set(),
    seasons: new Set(),
    teams: new Set(),
  })
  
  const toggleTeamsLeague = useCallback((league: League) => {
    setTeamsFilters((prev) => {
      const newLeagues = new Set(prev.leagues)
      if (newLeagues.has(league)) {
        newLeagues.delete(league)
      } else {
        newLeagues.add(league)
      }
      return { ...prev, leagues: newLeagues }
    })
  }, [])
  
  const toggleTeamsConference = useCallback((conferenceId: string) => {
    setTeamsFilters((prev) => {
      const newConferences = new Set(prev.conferences)
      if (newConferences.has(conferenceId)) {
        newConferences.delete(conferenceId)
      } else {
        newConferences.add(conferenceId)
      }
      return { ...prev, conferences: newConferences }
    })
  }, [])
  
  const clearTeamsFilters = useCallback(() => {
    setTeamsFilters({ leagues: new Set(), conferences: new Set() })
  }, [])
  
  const teamsFilterCount = teamsFilters.leagues.size + teamsFilters.conferences.size
  
  const toggleGamesLeague = useCallback((league: League) => {
    setGamesFilters((prev) => {
      const newLeagues = new Set(prev.leagues)
      if (newLeagues.has(league)) {
        newLeagues.delete(league)
      } else {
        newLeagues.add(league)
      }
      return { ...prev, leagues: newLeagues }
    })
  }, [])
  
  const toggleGamesSeason = useCallback((season: string) => {
    setGamesFilters((prev) => {
      const newSeasons = new Set(prev.seasons)
      if (newSeasons.has(season)) {
        newSeasons.delete(season)
      } else {
        newSeasons.add(season)
      }
      return { ...prev, seasons: newSeasons }
    })
  }, [])
  
  const clearGamesFilters = useCallback(() => {
    setGamesFilters({ leagues: new Set(), seasons: new Set(), teams: new Set() })
  }, [])
  
  const gamesFilterCount = gamesFilters.leagues.size + gamesFilters.seasons.size + gamesFilters.teams.size

  // Expand/collapse the preview panel when any preview is active
  // Mutual exclusion: opening preview closes filters, closing preview reopens filters
  const hasPreview = previewPlay || previewTeam || previewGame || previewAthlete
  
  // Unified preview handlers - only one preview can be open at a time
  // These clear the nav stack (fresh navigation)
  const openClipPreview = useCallback((play: PlayData) => {
    setPreviewTeam(null)
    setPreviewGame(null)
    setPreviewAthlete(null)
    setPreviewNavStack([])
    setPreviewPlay(play)
  }, [])
  
  const openTeamPreview = useCallback((team: Team, league: League) => {
    setPreviewPlay(null)
    setPreviewGame(null)
    setPreviewAthlete(null)
    setPreviewNavStack([])
    setPreviewTeam({ team, league })
  }, [])
  
  const openGamePreview = useCallback((game: Game) => {
    setPreviewPlay(null)
    setPreviewTeam(null)
    setPreviewAthlete(null)
    setPreviewNavStack([])
    setPreviewGame(game)
  }, [])
  
  // Drill-down navigation handlers - these push to the nav stack
  const pushCurrentToStack = useCallback((fromLabel: string) => {
    if (previewPlay) {
      setPreviewNavStack(prev => [...prev, { type: "clip", play: previewPlay, label: fromLabel }])
    } else if (previewTeam) {
      setPreviewNavStack(prev => [...prev, { type: "team", team: previewTeam.team, league: previewTeam.league, label: fromLabel }])
    } else if (previewGame) {
      setPreviewNavStack(prev => [...prev, { type: "game", game: previewGame, label: fromLabel }])
    } else if (previewAthlete) {
      setPreviewNavStack(prev => [...prev, { type: "athlete", athlete: previewAthlete, label: fromLabel }])
    }
  }, [previewPlay, previewTeam, previewGame, previewAthlete])

  const drillDownToTeam = useCallback((team: Team, league: League, fromLabel: string) => {
    pushCurrentToStack(fromLabel)
    setPreviewPlay(null)
    setPreviewGame(null)
    setPreviewAthlete(null)
    setPreviewTeam({ team, league })
  }, [pushCurrentToStack])
  
  const drillDownToGame = useCallback((game: Game, fromLabel: string) => {
    pushCurrentToStack(fromLabel)
    setPreviewPlay(null)
    setPreviewTeam(null)
    setPreviewAthlete(null)
    setPreviewGame(game)
  }, [pushCurrentToStack])
  
  const drillDownToAthlete = useCallback((athlete: Athlete, fromLabel: string) => {
    pushCurrentToStack(fromLabel)
    setPreviewPlay(null)
    setPreviewTeam(null)
    setPreviewGame(null)
    setPreviewAthlete(athlete)
  }, [pushCurrentToStack])
  
  // Navigate back to a specific breadcrumb
  const navigateToBreadcrumb = useCallback((index: number) => {
    const target = previewNavStack[index]
    // Restore the target preview and truncate the stack
    setPreviewPlay(null)
    setPreviewTeam(null)
    setPreviewGame(null)
    setPreviewAthlete(null)
    
    if (target.type === "clip") {
      setPreviewPlay(target.play)
    } else if (target.type === "team") {
      setPreviewTeam({ team: target.team, league: target.league })
    } else if (target.type === "game") {
      setPreviewGame(target.game)
    } else if (target.type === "athlete") {
      setPreviewAthlete(target.athlete)
    }
    setPreviewNavStack(previewNavStack.slice(0, index))
  }, [previewNavStack])
  
  // Build breadcrumbs from nav stack
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    return previewNavStack.map((item, index) => ({
      label: item.label,
      onClick: () => navigateToBreadcrumb(index),
    }))
  }, [previewNavStack, navigateToBreadcrumb])
  useEffect(() => {
    if (hasPreview) {
      // Resize to 50% so grid and preview share space equally
      previewPanelRef.current?.resize(50)
      setShowFilters(false)
    } else {
      previewPanelRef.current?.collapse()
      setShowFilters(true)
    }
  }, [hasPreview])

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => {
      const next = !prev
      // Mutual exclusion: opening filters closes preview
      if (next && hasPreview) {
        setPreviewPlay(null)
        setPreviewTeam(null)
        setPreviewGame(null)
        setPreviewAthlete(null)
        setPreviewNavStack([])
      }
      return next
    })
  }, [hasPreview])

  // Sync the imperative panel with the showFilters state (matches watch page pattern)
  useEffect(() => {
    if (showFilters) {
      filterPanelRef.current?.expand()
    } else {
      filterPanelRef.current?.collapse()
    }
  }, [showFilters])

  // Memoize the base dataset so it's only computed once (mock data is static)
  const allClipsDataset = useMemo(() => getAllUniqueClips(), [])
  
  // Use hook to filter clips
  const { filters, rangeFilters, toggleFilter, toggleAllInCategory, setRangeFilter, clearFilters, filteredPlays, uniqueGames, activeFilterCount, isFiltering } = useExploreFilters(allClipsDataset.plays)

  // Memoize the filtered dataset so children only re-render when filteredPlays changes
  const filteredDataset = useMemo(
    () => ({ ...allClipsDataset, plays: filteredPlays }),
    [allClipsDataset, filteredPlays]
  )

  return (
    <WatchProvider initialTabs={[allClipsDataset]}>
      <div className="flex flex-col h-full w-full bg-sidebar">
        <ResizablePanelGroup direction="horizontal" className="flex-1 [&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out">
          {/* Filters - collapsible full height left panel */}
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
              {activeTab === "teams" ? (
                <TeamsFiltersModule
                  filters={teamsFilters}
                  onToggleLeague={toggleTeamsLeague}
                  onToggleConference={toggleTeamsConference}
                  onClear={clearTeamsFilters}
                  activeFilterCount={teamsFilterCount}
                />
              ) : activeTab === "games" ? (
                <GamesFiltersModule
                  filters={gamesFilters}
                  onToggleLeague={toggleGamesLeague}
                  onToggleSeason={toggleGamesSeason}
                  onClear={clearGamesFilters}
                  activeFilterCount={gamesFilterCount}
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

          {/* Right panel: Tabs + Content + Preview */}
          <ResizablePanel defaultSize={78}>
            <ResizablePanelGroup direction="horizontal" className="h-full [&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out">
              {/* Main content area */}
              <ResizablePanel defaultSize={100} minSize={40} id="explore-main" order={1}>
                <div className={cn("h-full flex flex-col py-3", !previewPlay && "pr-3")}>
                  {/* Explore Tabs + Filter Toggle */}
                  <div className="flex items-center gap-2 px-3 pt-3 pb-2 bg-background rounded-t-lg">
                    {/* Filter toggle button – matches Watch toolbar ToggleBtn style */}
                    <button
                      onClick={handleToggleFilters}
                      className={cn(
                        "relative flex items-center justify-center rounded-md transition-colors h-8 w-8 shrink-0",
                        showFilters
                          ? "bg-foreground/90 text-background dark:bg-white/90 dark:text-sidebar"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      aria-label={showFilters ? "Hide filters" : "Show filters"}
                    >
                      <FilterToggleIcon className="w-4 h-4" />
                      {!showFilters && (activeTab === "teams" ? teamsFilterCount : activeTab === "games" ? gamesFilterCount : activeFilterCount) > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold leading-none bg-blue-600 text-white rounded-full">
                          {activeTab === "teams" ? teamsFilterCount : activeTab === "games" ? gamesFilterCount : activeFilterCount}
                        </span>
                      )}
                    </button>

                    <div className="w-px h-6 bg-border/50 shrink-0" />

                    {exploreTabs.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200",
                          activeTab === tab.value
                            ? "bg-foreground text-background shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === "clips" ? (
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
                        onClickPlay={openClipPreview}
                        activePlayId={previewPlay?.id}
                      />
                      {/* Subtle overlay while deferred filter computation catches up */}
                      {isFiltering && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none z-10">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Filtering...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : activeTab === "games" ? (
                    <div className="flex-1 min-h-0 bg-background rounded-b-lg overflow-hidden">
                      <GamesBrowser
                        filters={gamesFilters}
                        onSelectGame={openGamePreview}
                        activeGameId={previewGame?.id}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 bg-background rounded-b-lg overflow-hidden">
                      <TeamsBrowser 
                        filters={teamsFilters} 
                        onSelectTeam={openTeamPreview}
                        activeTeamId={previewTeam?.team.id}
                      />
                    </div>
                  )}
                </div>
              </ResizablePanel>

              {/* Preview Panel (collapsible right) */}
              <ResizableHandle className="w-[8px] bg-transparent border-0 after:hidden before:hidden [&>div]:hidden" />
              <ResizablePanel
                ref={previewPanelRef}
                defaultSize={0}
                minSize={30}
                maxSize={55}
                collapsible
                collapsedSize={0}
                id="explore-preview"
                order={2}
              >
                <div className="h-full pr-3 py-3 pl-0">
                  {previewPlay && (
                    <PreviewModule
                      play={previewPlay}
                      onClose={() => { setPreviewPlay(null); setPreviewNavStack([]) }}
                      breadcrumbs={breadcrumbs}
                      onNavigateToTeam={(team, league) => drillDownToTeam(team, league, `Clip ${previewPlay.playNumber}`)}
                    />
                  )}
                  {previewTeam && (
                    <TeamPreviewModule
                      team={previewTeam.team}
                      league={previewTeam.league}
                      onClose={() => { setPreviewTeam(null); setPreviewNavStack([]) }}
                      breadcrumbs={breadcrumbs}
                      onNavigateToGame={(game) => drillDownToGame(game, previewTeam.team.name)}
                      onNavigateToAthlete={(athlete) => drillDownToAthlete(athlete, previewTeam.team.name)}
                    />
                  )}
                  {previewGame && (
                    <GamePreviewModule
                      game={previewGame}
                      onClose={() => { setPreviewGame(null); setPreviewNavStack([]) }}
                      breadcrumbs={breadcrumbs}
                      onNavigateToTeam={(team, league) => drillDownToTeam(team, league, `${previewGame.awayTeam.abbreviation} @ ${previewGame.homeTeam.abbreviation}`)}
                    />
                  )}
                  {previewAthlete && (
                    <AthletePreviewModule
                      athlete={previewAthlete}
                      onClose={() => { setPreviewAthlete(null); setPreviewNavStack([]) }}
                      breadcrumbs={breadcrumbs}
                      onNavigateToTeam={(team, league) => drillDownToTeam(team, league, previewAthlete.name)}
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

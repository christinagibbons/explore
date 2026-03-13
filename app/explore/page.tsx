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

const exploreTabs = [
  { value: "clips", label: "Clips" },
  { value: "practice", label: "Practice" },
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

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
      <Icon name="folder" className="w-10 h-10 opacity-40" />
      <p className="text-sm">{label} content coming soon</p>
    </div>
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
  const [showFilters, setShowFilters] = useState(true)
  const previewPanelRef = useRef<ImperativePanelHandle>(null)
  const filterPanelRef = useRef<ImperativePanelHandle>(null)

  // Expand/collapse the preview panel when previewPlay changes
  // Mutual exclusion: opening preview closes filters, closing preview reopens filters
  useEffect(() => {
    if (previewPlay) {
      // Resize to 50% so grid and preview share space equally
      previewPanelRef.current?.resize(50)
      setShowFilters(false)
    } else {
      previewPanelRef.current?.collapse()
      setShowFilters(true)
    }
  }, [previewPlay])

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => {
      const next = !prev
      // Mutual exclusion: opening filters closes preview
      if (next && previewPlay) {
        setPreviewPlay(null)
      }
      return next
    })
  }, [previewPlay])

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
                      {!showFilters && activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold leading-none bg-blue-600 text-white rounded-full">
                          {activeFilterCount}
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
                        onClickPlay={(play) => setPreviewPlay(play)}
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
                  ) : activeTab === "practice" ? (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <EmptyTabState label="Practice" />
                    </div>
                  ) : activeTab === "games" ? (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <EmptyTabState label="Games" />
                    </div>
                  ) : (
                    <div className="flex-1 bg-background rounded-b-lg overflow-hidden">
                      <TeamsBrowser />
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
                      onClose={() => setPreviewPlay(null)}
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

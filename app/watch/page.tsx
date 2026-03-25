"use client"

import { useEffect, useRef } from "react"
import { LibraryView } from "@/components/library-view"
import { GridModule } from "@/components/grid-module"
import { VideoModule } from "@/components/video-module"
import { ReportsModule } from "@/components/reports-module"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { WatchProvider, useWatchContext } from "@/components/watch/watch-context"
import { WatchToolbar } from "@/components/watch/watch-toolbar"
import { AddToPlaylistMenu } from "@/components/add-to-playlist-menu"
import { ExploreBreadcrumbs } from "@/components/explore/explore-breadcrumbs"
import { useBreadcrumbContextOptional } from "@/lib/breadcrumb-context"
import type { ImperativePanelHandle } from "react-resizable-panels"

function WatchContent() {
  const { visibleModules, reportsPanelSize, setReportsPanelSize } = useWatchContext()
  const breadcrumbContext = useBreadcrumbContextOptional()
  const hasBreadcrumbs = breadcrumbContext && breadcrumbContext.breadcrumbs.length > 0

  const topPanelRef = useRef<ImperativePanelHandle>(null)
  const libraryPanelRef = useRef<ImperativePanelHandle>(null)
  const videoPanelRef = useRef<ImperativePanelHandle>(null)
  const gridPanelRef = useRef<ImperativePanelHandle>(null)
  const reportsPanelRef = useRef<ImperativePanelHandle>(null)

  // Collapse/expand the top wrapper panel based on whether either child is visible
  const topVisible = visibleModules.library || visibleModules.video
  useEffect(() => {
    if (topVisible) {
      topPanelRef.current?.expand()
    } else {
      topPanelRef.current?.collapse()
    }
  }, [topVisible])

  useEffect(() => {
    if (visibleModules.library) {
      libraryPanelRef.current?.expand()
    } else {
      libraryPanelRef.current?.collapse()
    }
  }, [visibleModules.library])

  useEffect(() => {
    if (visibleModules.video) {
      videoPanelRef.current?.expand()
    } else {
      videoPanelRef.current?.collapse()
    }
  }, [visibleModules.video])

  useEffect(() => {
    if (visibleModules.grid) {
      gridPanelRef.current?.expand()
    } else {
      gridPanelRef.current?.collapse()
    }
  }, [visibleModules.grid])

  useEffect(() => {
    if (visibleModules.reports) {
      reportsPanelRef.current?.expand()
    } else {
      reportsPanelRef.current?.collapse()
    }
  }, [visibleModules.reports])

  return (
    <div className="flex flex-col h-full w-full">
      {/* Breadcrumb bar - only show if we have breadcrumbs from explore */}
      {hasBreadcrumbs && (
        <div className="bg-sidebar px-4 py-2 border-b border-border/50 shrink-0">
          <ExploreBreadcrumbs />
        </div>
      )}
      
      <div className="flex flex-1 min-h-0 w-full">
        {/* Main Resizable Area — horizontal split: content | reports */}
        <div className="flex-1 min-w-0 bg-sidebar">
        <ResizablePanelGroup
          direction="horizontal"
          className="[&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out"
        >
          {/* LEFT: Existing vertical layout (library+video on top, grid on bottom) */}
          <ResizablePanel
            defaultSize={100 - reportsPanelSize}
            minSize={30}
            id="main-content-panel"
            order={1}
          >
            <ResizablePanelGroup
              direction="vertical"
              className="[&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out"
            >
              {/* TOP SECTION: Library + Video */}
              <ResizablePanel
                ref={topPanelRef}
                defaultSize={60}
                minSize={20}
                collapsible
                collapsedSize={0}
                id="top-panel"
                order={1}
              >
                <ResizablePanelGroup
                  direction="horizontal"
                  className="[&>div]:transition-all [&>div]:duration-300 [&>div]:ease-in-out"
                >
                  {/* Library Panel - always rendered, collapsible */}
                  <ResizablePanel
                    ref={libraryPanelRef}
                    defaultSize={30}
                    minSize={15}
                    collapsible
                    collapsedSize={0}
                    id="library-panel"
                    order={1}
                  >
                    <div className="h-full pr-1 pb-1 overflow-hidden">
                      <LibraryView />
                    </div>
                  </ResizablePanel>

                  <ResizableHandle className="bg-transparent" />

                  {/* Video Panel - always rendered, collapsible */}
                  <ResizablePanel
                    ref={videoPanelRef}
                    defaultSize={70}
                    minSize={15}
                    collapsible
                    collapsedSize={0}
                    id="video-panel"
                    order={2}
                  >
                    <div className="h-full pb-1 overflow-hidden">
                      <VideoModule />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle className="bg-transparent" />

              {/* BOTTOM SECTION: Grid - always rendered, collapsible */}
              <ResizablePanel
                ref={gridPanelRef}
                defaultSize={40}
                minSize={15}
                collapsible
                collapsedSize={0}
                id="grid-panel"
                order={2}
              >
                <div className="h-full overflow-hidden">
                  <GridModule selectionActions={<AddToPlaylistMenu />} editable />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="bg-transparent" />

          {/* RIGHT: Reports panel — collapsible, default closed */}
          <ResizablePanel
            ref={reportsPanelRef}
            defaultSize={reportsPanelSize}
            minSize={15}
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              if (size > 0) setReportsPanelSize(size)
            }}
            id="reports-panel"
            order={2}
          >
            <div className="h-full pl-1 overflow-hidden">
              <ReportsModule />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* RHS Toolbar */}
        <WatchToolbar />
      </div>
    </div>
  )
}

export default function WatchPage() {
  return (
    <WatchProvider consumeLibraryEvents>
      <div className="h-full w-full overflow-hidden bg-sidebar">
        <WatchContent />
      </div>
    </WatchProvider>
  )
}

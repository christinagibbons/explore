"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useLibraryContext } from "@/lib/library-context"
import { getDatasetForItem, getRandomVideoUrl, type PlayData } from "@/lib/mock-datasets"

import { useRouter } from "next/navigation"

// Extended Dataset type to support unsaved playlists
export interface Dataset {
  id: string
  name: string
  plays: PlayData[]
  isUnsaved?: boolean
}
import type { FolderData } from "@/components/folder"
import type { LibraryItemData } from "@/components/library-item"

interface WatchContextType {
  // Tab State
  tabs: Dataset[]
  activeTabId: string | null
  playingTabId: string | null

  // Derived Data
  activeDataset: Dataset | null
  playingDataset: Dataset | null
  currentPlay: PlayData | null

  videoUrl: string | null
  frameRate: number

  // Selection State
  selectedPlayIds: Set<string>
  togglePlaySelection: (playId: string) => void
  selectAllPlays: (plays?: { id: string }[]) => void
  clearPlaySelection: () => void

  // Actions
  activateTab: (tabId: string) => void
  closeTab: (tabId: string) => void
  playTab: (tabId: string) => void
  seekToPlay: (play: PlayData) => void
  setVideoUrl: (url: string) => void

  // Editing
  updatePlay: (playId: string, updates: Partial<PlayData>) => void

  // Unsaved preview
  previewClips: (clips: PlayData[]) => void
  replaceUnsavedTab: (savedId: string) => void

  // Module Visibility
  visibleModules: {
    library: boolean
    video: boolean
    grid: boolean
    reports: boolean
  }
  toggleModule: (module: "library" | "video" | "grid" | "reports") => void

  // Reports panel size (persisted for session)
  reportsPanelSize: number
  setReportsPanelSize: (size: number) => void
}

const WatchContext = createContext<WatchContextType | undefined>(undefined)

function findItemById(folders: FolderData[], itemId: string): LibraryItemData | null {
  for (const folder of folders) {
    // Check items in this folder
    if (folder.items) {
      const foundItem = folder.items.find((i) => i.id === itemId)
      if (foundItem) return foundItem
    }
    // Check children folders
    if (folder.children) {
      const foundInChild = findItemById(folder.children, itemId)
      if (foundInChild) return foundInChild
    }
  }
  return null
}

export function WatchProvider({ 
  children,
  initialTabs = [],
  consumeLibraryEvents = false,
}: { 
  children: ReactNode
  initialTabs?: Dataset[]
  consumeLibraryEvents?: boolean
}) {
  const router = useRouter()
  const { activeWatchItemId, activeWatchItems, folders, rootItems, getMediaItem, setWatchItem, mediaItems, pendingPreviewClips, pendingPreviewName, setPendingPreviewClips } = useLibraryContext()

  // Stable refs so useEffects don't re-fire when these change
  const foldersRef = useRef(folders)
  foldersRef.current = folders
  const rootItemsRef = useRef(rootItems)
  rootItemsRef.current = rootItems
  const getMediaItemRef = useRef(getMediaItem)
  getMediaItemRef.current = getMediaItem

  // Initialize with provided tabs if any
  const [tabs, setTabs] = useState<Dataset[]>(initialTabs)
  
  // Set initial active/playing tab if initialTabs exist
  const [activeTabId, setActiveTabId] = useState<string | null>(
    initialTabs.length > 0 ? initialTabs[0].id : null
  )
  const [playingTabId, setPlayingTabId] = useState<string | null>(
    initialTabs.length > 0 ? initialTabs[0].id : null
  )
  const [currentPlay, setCurrentPlay] = useState<PlayData | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const frameRate = 30

  // Selection state
  const [selectedPlayIds, setSelectedPlayIds] = useState<Set<string>>(new Set())

  const [visibleModules, setVisibleModules] = useState({
    library: true,
    video: true,
    grid: true,
    reports: false,
  })

  const [reportsPanelSize, setReportsPanelSize] = useState(25)

  const toggleModule = (module: "library" | "video" | "grid" | "reports") => {
    setVisibleModules((prev) => {
      const next = { ...prev, [module]: !prev[module] }
      // Prevent closing all core modules -- at least one must stay visible
      // (reports is independent and doesn't count toward the minimum)
      const anyCoreVisible = next.library || next.video || next.grid
      if (!anyCoreVisible) return prev
      return next
    })
  }

  const playRandomVideo = () => {
    setVideoUrl((prev) => getRandomVideoUrl(prev))
  }

  // Keep a ref to the current tabs so we can read them synchronously in effects
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  useEffect(() => {
    if (!consumeLibraryEvents) return
    if (!activeWatchItemId) return

    // Synchronous check: if already open, just switch the active tab and bail
    const existingTab = tabsRef.current.find((t) => t.id === activeWatchItemId)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      // Clear after consuming so it doesn't re-trigger on future mounts
      setWatchItem(null)
      return
    }

    // Look up the item across all sources
    const folderItem = findItemById(foldersRef.current, activeWatchItemId)
    const rootItem = !folderItem ? rootItemsRef.current.find((i) => i.id === activeWatchItemId) : null
    const item = folderItem || rootItem || null
    // Always look up the mediaItem -- the folder-tree item has the name but
    // only the mediaItem stores actual clips.
    const mediaItem = getMediaItemRef.current(activeWatchItemId)

    const isPlaylist = (item && item.type === "playlist") || (mediaItem && mediaItem.type === "playlist")
    let datasetWithId: Dataset

    if (isPlaylist) {
      const existingClips: PlayData[] = mediaItem
        ? mediaItem.clips.map((clip, idx) => ({
            id: clip.id,
            playNumber: clip.playNumber ?? idx + 1,
            odk: clip.odk ?? "O",
            quarter: clip.quarter ?? 1,
            down: clip.down ?? 1,
            distance: clip.distance ?? 10,
            yardLine: clip.yardLine ?? "",
            yardLineNumeric: 0,
            hash: clip.hash ?? "M",
            yards: clip.yards ?? 0,
            result: clip.result ?? "",
            gainLoss: clip.gainLoss ?? "Gn",
            defFront: clip.defFront ?? "",
            defStr: clip.defStr ?? "",
            coverage: clip.coverage ?? "",
            blitz: clip.blitz ?? "",
            game: clip.game ?? "",
            epa: 0,
            successRate: false,
            explosivePlay: false,
            formationName: "",
            isShotgun: false,
            isTwoMinuteDrill: false,
            offenseIds: [],
            defenseIds: [],
            playType: clip.playType ?? "Pass",
            passResult: clip.passResult,
            runDirection: clip.runDirection,
            personnelO: clip.personnelO ?? "11",
            personnelD: clip.personnelD ?? "Base",
            isTouchdown: clip.isTouchdown ?? false,
            isFirstDown: clip.isFirstDown ?? false,
            isPenalty: clip.isPenalty ?? false,
            penaltyType: clip.penaltyType,
          }))
        : []

      datasetWithId = {
        id: activeWatchItemId,
        name: mediaItem?.name || item?.name || "Untitled Playlist",
        plays: existingClips,
      }
    } else {
      const newDataset = getDatasetForItem(activeWatchItemId)
      datasetWithId = {
        ...newDataset,
        id: activeWatchItemId,
        name: item?.name || newDataset.name,
      }
    }

    // Batch all state updates together
    setTabs((prev) => [datasetWithId, ...prev])
    setActiveTabId(datasetWithId.id)
    setPlayingTabId(datasetWithId.id)

    if (isPlaylist && datasetWithId.plays.length === 0) {
      setVideoUrl(null)
      setCurrentPlay(null)
    } else {
      setVideoUrl((prev) => getRandomVideoUrl(prev))
      if (datasetWithId.plays.length > 0) {
        setCurrentPlay(datasetWithId.plays[0])
      }
    }

    // Clear after consuming so it doesn't re-trigger on future mounts
    setWatchItem(null)
  }, [activeWatchItemId])

  useEffect(() => {
    if (!consumeLibraryEvents) return
    if (!activeWatchItems || activeWatchItems.length === 0) return
    
    const currentTabs = tabsRef.current
    const newDatasets: Dataset[] = []
    let firstNewId: string | null = null
    let firstNewIsPlaylist = false

    for (const itemId of activeWatchItems) {
      // Skip if already open
      if (currentTabs.some((t) => t.id === itemId)) continue

      const folderItem = findItemById(foldersRef.current, itemId)
      const rootItem = !folderItem ? rootItemsRef.current.find((i) => i.id === itemId) : null
      const item = folderItem || rootItem || null
      // Always look up mediaItem -- it stores the actual clips
      const mediaItem = getMediaItemRef.current(itemId)
      const isPlaylist = (item && item.type === "playlist") || (mediaItem && mediaItem.type === "playlist")

      let datasetWithId: Dataset

      if (isPlaylist) {
        const existingClips: PlayData[] = mediaItem
          ? mediaItem.clips.map((clip, idx) => ({
              id: clip.id,
              playNumber: clip.playNumber ?? idx + 1,
              odk: clip.odk ?? "O",
              quarter: clip.quarter ?? 1,
              down: clip.down ?? 1,
              distance: clip.distance ?? 10,
              yardLine: clip.yardLine ?? "",
              yardLineNumeric: 0,
              hash: clip.hash ?? "M",
              yards: clip.yards ?? 0,
              result: clip.result ?? "",
              gainLoss: clip.gainLoss ?? "Gn",
              defFront: clip.defFront ?? "",
              defStr: clip.defStr ?? "",
              coverage: clip.coverage ?? "",
              blitz: clip.blitz ?? "",
              game: clip.game ?? "",
              epa: 0,
              successRate: false,
              explosivePlay: false,
              formationName: "",
              isShotgun: false,
              isTwoMinuteDrill: false,
              offenseIds: [],
              defenseIds: [],
              playType: clip.playType ?? "Pass",
              passResult: clip.passResult,
              runDirection: clip.runDirection,
              personnelO: clip.personnelO ?? "11",
              personnelD: clip.personnelD ?? "Base",
              isTouchdown: clip.isTouchdown ?? false,
              isFirstDown: clip.isFirstDown ?? false,
              isPenalty: clip.isPenalty ?? false,
              penaltyType: clip.penaltyType,
            }))
          : []

        datasetWithId = {
          id: itemId,
          name: mediaItem?.name || item?.name || "Untitled Playlist",
          plays: existingClips,
        }
        if (!firstNewId) firstNewIsPlaylist = existingClips.length === 0
      } else {
        const newDataset = getDatasetForItem(itemId)
        datasetWithId = {
          ...newDataset,
          id: itemId,
          name: item?.name || newDataset.name,
        }
      }

      if (!firstNewId) firstNewId = itemId
      newDatasets.push(datasetWithId)
    }

    if (newDatasets.length === 0) return

    setTabs((prev) => [...newDatasets, ...prev])

    if (firstNewId) {
      setActiveTabId(firstNewId)
      setPlayingTabId(firstNewId)

      const firstDataset = newDatasets.find((t) => t.id === firstNewId)
      if (firstNewIsPlaylist && (!firstDataset || firstDataset.plays.length === 0)) {
        setVideoUrl(null)
        setCurrentPlay(null)
      } else {
        setVideoUrl((prev) => getRandomVideoUrl(prev))
        if (firstDataset && firstDataset.plays.length > 0) {
          setCurrentPlay(firstDataset.plays[0])
        }
      }
    }
  }, [activeWatchItems])

  // On mount, if there are pending preview clips from the Explore page,
  // create an unsaved tab with those clips and collapse the library.
  const pendingPreviewClipsRef = useRef(pendingPreviewClips)
  pendingPreviewClipsRef.current = pendingPreviewClips
  const hasMountedPreview = useRef(false)

  useEffect(() => {
    if (!consumeLibraryEvents) return
    if (hasMountedPreview.current) return
    const clips = pendingPreviewClipsRef.current
    if (clips.length === 0) return
    hasMountedPreview.current = true

    const plays: PlayData[] = clips.map((clip, idx) => ({
      id: clip.id,
      playNumber: clip.playNumber ?? idx + 1,
      odk: clip.odk ?? "O",
      quarter: clip.quarter ?? 1,
      down: clip.down ?? 1,
      distance: clip.distance ?? 10,
      yardLine: clip.yardLine ?? "",
      yardLineNumeric: 0,
      hash: clip.hash ?? "M",
      yards: clip.yards ?? 0,
      result: clip.result ?? "",
      gainLoss: clip.gainLoss ?? "Gn",
      defFront: clip.defFront ?? "",
      defStr: clip.defStr ?? "",
      coverage: clip.coverage ?? "",
      blitz: clip.blitz ?? "",
      game: clip.game ?? "",
      epa: 0,
      successRate: false,
      explosivePlay: false,
      formationName: "",
      isShotgun: false,
      isTwoMinuteDrill: false,
      offenseIds: [],
      defenseIds: [],
      playType: clip.playType ?? "Pass",
      passResult: clip.passResult,
      runDirection: clip.runDirection,
      personnelO: clip.personnelO ?? "11",
      personnelD: clip.personnelD ?? "Base",
      isTouchdown: clip.isTouchdown ?? false,
      isFirstDown: clip.isFirstDown ?? false,
      isPenalty: clip.isPenalty ?? false,
      penaltyType: clip.penaltyType,
    }))

    const playlistName = pendingPreviewClipsRef.current.length > 0 ? pendingPreviewName : null
    const unsavedTab: Dataset = {
      id: `unsaved-${Date.now()}`,
      name: playlistName || "Unsaved Playlist",
      plays,
      isUnsaved: true,
    }
    setTabs((prev) => [unsavedTab, ...prev])
    setActiveTabId(unsavedTab.id)
    setPlayingTabId(unsavedTab.id)
    if (plays.length > 0) {
      setVideoUrl((prev) => getRandomVideoUrl(prev))
      setCurrentPlay(plays[0])
    }
    setVisibleModules((prev) => ({ ...prev, library: false }))
    // Clear pending so it doesn't re-trigger
    setPendingPreviewClips([], undefined)
  }, [setPendingPreviewClips])

  // Keep open playlist tabs in sync with the mediaItems store so that
  // clips added via "Add to Playlist" are reflected in the Grid Module.
  useEffect(() => {
    setTabs((prev) => {
      let changed = false
      const next = prev.map((tab) => {
        const mi = mediaItems.find((m) => m.id === tab.id)
        if (!mi) return tab // not a media-item-backed playlist

        const newPlays: PlayData[] = mi.clips.map((clip, idx) => ({
          id: clip.id,
          playNumber: clip.playNumber ?? idx + 1,
          odk: clip.odk ?? "O",
          quarter: clip.quarter ?? 1,
          down: clip.down ?? 1,
          distance: clip.distance ?? 10,
          yardLine: clip.yardLine ?? "",
          yardLineNumeric: 0,
          hash: clip.hash ?? "M",
          yards: clip.yards ?? 0,
          result: clip.result ?? "",
          gainLoss: clip.gainLoss ?? "Gn",
          defFront: clip.defFront ?? "",
          defStr: clip.defStr ?? "",
          coverage: clip.coverage ?? "",
          blitz: clip.blitz ?? "",
          game: clip.game ?? "",
          epa: 0,
          successRate: false,
          explosivePlay: false,
          formationName: "",
          isShotgun: false,
          isTwoMinuteDrill: false,
          offenseIds: [],
          defenseIds: [],
          playType: clip.playType ?? "Pass",
          passResult: clip.passResult,
          runDirection: clip.runDirection,
          personnelO: clip.personnelO ?? "11",
          personnelD: clip.personnelD ?? "Base",
          isTouchdown: clip.isTouchdown ?? false,
          isFirstDown: clip.isFirstDown ?? false,
          isPenalty: clip.isPenalty ?? false,
          penaltyType: clip.penaltyType,
        }))

        // Update if clip count changed OR the clip IDs differ (e.g. new clips added)
        const idsChanged =
          newPlays.length !== tab.plays.length ||
          newPlays.some((p, i) => p.id !== tab.plays[i]?.id)

        if (idsChanged || mi.name !== tab.name) {
          changed = true
          return { ...tab, plays: newPlays, name: mi.name }
        }
        return tab
      })
      return changed ? next : prev
    })
  }, [mediaItems])

  const updatePlay = (playId: string, updates: Partial<PlayData>) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId) return tab
        const updatedPlays = tab.plays.map((play) => {
          if (play.id !== playId) return play
          return { ...play, ...updates }
        })
        return { ...tab, plays: updatedPlays }
      })
    )
    // Also update currentPlay if it's the one being edited
    setCurrentPlay((prev) => {
      if (prev && prev.id === playId) {
        return { ...prev, ...updates }
      }
      return prev
    })
  }

  const previewClips = (clips: PlayData[]) => {
    const unsavedTab: Dataset = {
      id: `unsaved-${Date.now()}`,
      name: "Unsaved Playlist",
      plays: clips,
      isUnsaved: true,
    }
    setTabs((prev) => [unsavedTab, ...prev])
    setActiveTabId(unsavedTab.id)
    setPlayingTabId(unsavedTab.id)
    if (clips.length > 0) {
      setVideoUrl((prev) => getRandomVideoUrl(prev))
      setCurrentPlay(clips[0])
    }
    // Collapse library module for preview
    setVisibleModules((prev) => ({ ...prev, library: false }))
  }

  const replaceUnsavedTab = (savedId: string) => {
    setTabs((prev) => {
      const unsavedIdx = prev.findIndex((t) => t.isUnsaved)
      if (unsavedIdx === -1) return prev
      return prev.filter((t) => !t.isUnsaved)
    })
    // Open the saved playlist as a normal tab via the library context
    setWatchItem(savedId)
  }

  const activateTab = (tabId: string) => {
    setActiveTabId(tabId)
  }

  const playTab = (tabId: string) => {
    setPlayingTabId(tabId)
    playRandomVideo()
  }

  const closeTab = (tabId: string) => {
    const currentTabs = tabsRef.current
    const closedIndex = currentTabs.findIndex((t) => t.id === tabId)
    const newTabs = currentTabs.filter((t) => t.id !== tabId)
    setTabs(newTabs)

    // Clear the library-context watch ID so the item can be re-opened
    if (activeWatchItemId === tabId) {
      setWatchItem(null)
    }

    if (newTabs.length === 0) {
      // Last tab closed -- clear everything
      setActiveTabId(null)
      setPlayingTabId(null)
      setVideoUrl(null)
      setCurrentPlay(null)
    } else {
      // Pick the next tab: prefer the one that was to the right, else the last one
      const nextTab = newTabs[Math.min(closedIndex, newTabs.length - 1)]

      if (activeTabId === tabId) {
        setActiveTabId(nextTab.id)
      }

      if (playingTabId === tabId) {
        // Switch playback to the next tab
        setPlayingTabId(nextTab.id)
        if (nextTab.plays.length > 0) {
          setVideoUrl((prev) => getRandomVideoUrl(prev))
          setCurrentPlay(nextTab.plays[0])
        } else {
          setVideoUrl(null)
          setCurrentPlay(null)
        }
      }
    }
  }

  const seekToPlay = (play: PlayData) => {
    console.log("Play selected:", play.playNumber)

    // 1. Ensure the video player knows we are now playing from the Active Grid Tab
    if (activeTabId && activeTabId !== playingTabId) {
      setPlayingTabId(activeTabId)
    }

    // 2. Pick a NEW random video for this clip
    playRandomVideo()

    // 3. Set the play data
    setCurrentPlay(play)
  }

  const activeDataset = tabs.find((t) => t.id === activeTabId) || null
  const playingDataset = tabs.find((t) => t.id === playingTabId) || null

  // Selection handlers
  const togglePlaySelection = (playId: string) => {
    setSelectedPlayIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(playId)) {
        newSet.delete(playId)
      } else {
        newSet.add(playId)
      }
      return newSet
    })
  }

  const selectAllPlays = (plays?: { id: string }[]) => {
    const playsToSelect = plays || activeDataset?.plays
    if (playsToSelect) {
      setSelectedPlayIds(new Set(playsToSelect.map((p) => p.id)))
    }
  }

  const clearPlaySelection = () => {
    setSelectedPlayIds(new Set())
  }

  return (
    <WatchContext.Provider
      value={{
        tabs,
        activeTabId,
        playingTabId,
        activeDataset,
        playingDataset,
        currentPlay,
        videoUrl,
        frameRate,
        selectedPlayIds,
        togglePlaySelection,
        selectAllPlays,
        clearPlaySelection,
        activateTab,
        closeTab,
        playTab,
        seekToPlay,
        setVideoUrl,
        updatePlay,
        previewClips,
        replaceUnsavedTab,
        visibleModules,
        toggleModule,
        reportsPanelSize,
        setReportsPanelSize,
      }}
    >
      {children}
    </WatchContext.Provider>
  )
}

export function useWatchContext() {
  const context = useContext(WatchContext)
  if (!context) throw new Error("useWatchContext must be used within WatchProvider")
  return context
}

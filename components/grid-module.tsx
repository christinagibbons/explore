"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useWatchContext } from "@/components/watch/watch-context"
import { useLibraryContext } from "@/lib/library-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/icon"
import { SortDefaultIcon, SortAscendingIcon, SortDescendingIcon, SortHighFreqIcon, SortLowFreqIcon } from "@/components/sort-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical } from "lucide-react"
import type { LibraryItemData } from "@/components/library-item"
import type { PlayData, Dataset } from "@/lib/mock-datasets"
import type { ClipData } from "@/types/library"

// --- Gain/Loss auto-derivation ---
function deriveGainLoss(yards: number, result?: string): "Gn" | "Ls" {
  if (yards > 0) return "Gn"
  if (yards < 0) return "Ls"
  // yards === 0: lean on result
  const lower = (result ?? "").toLowerCase()
  if (lower.includes("incomplete") || lower.includes("sack") || lower.includes("interception")) return "Ls"
  return "Gn"
}

// --- Column edit config ---
type EditMode = "dropdown" | "number" | "text" | "none" | "auto"

interface ColumnConfig {
  key: keyof PlayData
  editMode: EditMode
  options?: string[]
  min?: number
  max?: number
}

const COLUMN_CONFIGS: ColumnConfig[] = [
  { key: "playNumber", editMode: "none" },
  { key: "odk", editMode: "dropdown", options: ["O", "D", "K"] },
  { key: "quarter", editMode: "dropdown", options: ["1", "2", "3", "4", "OT"] },
  { key: "down", editMode: "dropdown", options: ["1", "2", "3", "4"] },
  { key: "distance", editMode: "text" },
  { key: "yardLine", editMode: "number", min: -49, max: 49 },
  { key: "hash", editMode: "dropdown", options: ["L", "M", "R"] },
  { key: "yards", editMode: "number", min: -200, max: 200 },
  { key: "result", editMode: "text" },
  { key: "gainLoss", editMode: "auto" },
  { key: "defFront", editMode: "text" },
  { key: "defStr", editMode: "text" },
  { key: "coverage", editMode: "text" },
  { key: "blitz", editMode: "text" },
  { key: "game", editMode: "none" },
]

function getColumnConfig(key: keyof PlayData): ColumnConfig | undefined {
  return COLUMN_CONFIGS.find((c) => c.key === key)
}

// --- Inline editing cell component ---
interface EditableCellProps {
  play: PlayData
  columnKey: keyof PlayData
  value: string | number
  onCommit: (playId: string, updates: Partial<PlayData>) => void
  isPlaying: boolean
  className?: string
}

function EditableCell({ play, columnKey, value, onCommit, isPlaying, className }: EditableCellProps) {
  const config = getColumnConfig(columnKey)
  const [editing, setEditing] = useState(false)
  const [localValue, setLocalValue] = useState(String(value))
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  // Sync local value when the play data changes externally
  useEffect(() => {
    if (!editing) setLocalValue(String(value))
  }, [value, editing])

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [editing])

  const commitEdit = useCallback(() => {
    setEditing(false)
    const trimmed = localValue.trim()

    if (config?.editMode === "number") {
      const num = Number(trimmed)
      if (isNaN(num)) return // discard invalid
      const clamped = Math.max(config.min ?? -Infinity, Math.min(config.max ?? Infinity, num))
      const updates: Partial<PlayData> = { [columnKey]: clamped } as Partial<PlayData>
      // Auto-derive gainLoss when yards changes
      if (columnKey === "yards") {
        updates.gainLoss = deriveGainLoss(clamped, play.result)
      }
      onCommit(play.id, updates)
    } else if (config?.editMode === "dropdown") {
      // For dropdown columns, parse the value to the correct type
      if (columnKey === "down" || columnKey === "quarter") {
        const parsed = trimmed === "OT" ? trimmed : Number(trimmed)
        onCommit(play.id, { [columnKey]: parsed } as Partial<PlayData>)
      } else {
        onCommit(play.id, { [columnKey]: trimmed } as Partial<PlayData>)
      }
    } else {
      // text
      const updates: Partial<PlayData> = { [columnKey]: trimmed } as Partial<PlayData>
      // Auto-derive gainLoss when result changes
      if (columnKey === "result") {
        updates.gainLoss = deriveGainLoss(play.yards, trimmed)
      }
      onCommit(play.id, updates)
    }
  }, [localValue, config, columnKey, play, onCommit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      commitEdit()
    }
    if (e.key === "Escape") {
      setEditing(false)
      setLocalValue(String(value))
    }
  }

  // Non-editable or auto-derived cells
  if (!config || config.editMode === "none" || config.editMode === "auto") {
    return (
      <span className={className}>
        {value}
      </span>
    )
  }

  // Read mode
  if (!editing) {
    return (
      <span
        className={cn(
          "cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors inline-block min-w-[1.5rem]",
          isPlaying && "hover:bg-white/10",
          className,
        )}
        onClick={(e) => {
          if (isPlaying) {
            // Row is already the active clip -- enter edit mode immediately
            e.stopPropagation()
            setEditing(true)
          }
          // Otherwise let the click bubble to the row to activate the clip
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (isPlaying) {
              setEditing(true)
            }
          }
        }}
      >
        {value || "\u00A0"}
      </span>
    )
  }

  // Edit mode -- dropdown
  if (config.editMode === "dropdown") {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value)
          // Commit immediately on selection
          setEditing(false)
          const val = e.target.value
          if (columnKey === "down" || columnKey === "quarter") {
            const parsed = val === "OT" ? val : Number(val)
            onCommit(play.id, { [columnKey]: parsed } as Partial<PlayData>)
          } else {
            onCommit(play.id, { [columnKey]: val } as Partial<PlayData>)
          }
        }}
        onBlur={commitEdit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-background border border-border rounded text-xs px-1 py-0.5 outline-none focus:ring-1 focus:ring-ring w-full",
          isPlaying && "bg-[#0260bd] text-white border-white/30",
        )}
      >
        {config.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  // Edit mode -- number or text input
  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={config.editMode === "number" ? "number" : "text"}
      value={localValue}
      min={config.min}
      max={config.max}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "bg-background border border-border rounded text-xs px-1 py-0.5 outline-none focus:ring-1 focus:ring-ring w-full",
        isPlaying && "bg-[#0260bd] text-white border-white/30",
      )}
    />
  )
}

// --- Sort logic ---
type SortMode = "alpha-asc" | "alpha-desc" | "freq-high" | "freq-low"
const SORT_CYCLE: (SortMode | null)[] = ["alpha-asc", "alpha-desc", "freq-high", "freq-low", null]

function nextSortMode(current: SortMode | null): SortMode | null {
  const idx = SORT_CYCLE.indexOf(current)
  return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]
}

function sortPlays(plays: PlayData[], column: keyof PlayData | null, mode: SortMode | null): PlayData[] {
  if (!column || !mode) return plays

  const sorted = [...plays]

  if (mode === "alpha-asc" || mode === "alpha-desc") {
    sorted.sort((a, b) => {
      const aVal = a[column]
      const bVal = b[column]
      // numeric comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return mode === "alpha-asc" ? aVal - bVal : bVal - aVal
      }
      // string comparison
      const aStr = String(aVal ?? "").toLowerCase()
      const bStr = String(bVal ?? "").toLowerCase()
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true })
      return mode === "alpha-asc" ? cmp : -cmp
    })
  } else {
    // frequency sort -- count occurrences of each value, then sort by count
    const freq = new Map<string, number>()
    for (const play of plays) {
      const key = String(play[column] ?? "")
      freq.set(key, (freq.get(key) ?? 0) + 1)
    }
    sorted.sort((a, b) => {
      const aFreq = freq.get(String(a[column] ?? "")) ?? 0
      const bFreq = freq.get(String(b[column] ?? "")) ?? 0
      if (aFreq !== bFreq) {
        return mode === "freq-high" ? bFreq - aFreq : aFreq - bFreq
      }
      // tie-break alphabetically
      return String(a[column] ?? "").localeCompare(String(b[column] ?? ""), undefined, { numeric: true })
    })
  }

  return sorted
}

// --- Sortable header component ---
interface SortableHeaderProps {
  label: string
  columnKey: keyof PlayData
  activeColumn: keyof PlayData | null
  activeMode: SortMode | null
  onSort: (column: keyof PlayData, mode: SortMode | null) => void
  className?: string
}

function SortableHeader({ label, columnKey, activeColumn, activeMode, onSort, className }: SortableHeaderProps) {
  const isActive = activeColumn === columnKey
  const currentMode = isActive ? activeMode : null
  const [menuOpen, setMenuOpen] = useState(false)

  function getSortIcon() {
    switch (currentMode) {
      case "alpha-asc": return <SortAscendingIcon size={16} />
      case "alpha-desc": return <SortDescendingIcon size={16} />
      case "freq-high": return <SortHighFreqIcon size={16} />
      case "freq-low": return <SortLowFreqIcon size={16} />
      default: return null
    }
  }

  function handleMenuSort(mode: SortMode) {
    if (isActive && currentMode === mode) {
      // Toggle off if already active
      onSort(columnKey, null)
    } else {
      onSort(columnKey, mode)
    }
    setMenuOpen(false)
  }

  return (
    <TableHead
      className={cn(
        "text-xs uppercase tracking-wider font-semibold text-foreground cursor-pointer select-none hover:text-foreground transition-colors group/sort relative bg-muted/30",
        className,
      )}
      onClick={() => {
        if (!menuOpen) {
          const next = isActive ? nextSortMode(activeMode) : "alpha-asc"
          onSort(columnKey, next)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenuOpen(true)
      }}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && currentMode ? (
          <span className="text-foreground shrink-0">
            {getSortIcon()}
          </span>
        ) : (
          <span className="opacity-0 group-hover/sort:opacity-80 transition-opacity shrink-0">
            <SortDefaultIcon size={16} />
          </span>
        )}
      </div>

      {/* 3-dot menu trigger */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted/80 transition-opacity focus:outline-none",
              menuOpen ? "opacity-100" : "opacity-0 group-hover/sort:opacity-100",
            )}
            onClick={(e) => {
              e.stopPropagation()
            }}
            aria-label={`Column options for ${label}`}
          >
            <EllipsisVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4}>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Sort</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMenuSort("alpha-asc")}>
                <SortAscendingIcon size={14} />
                <span>Ascending (A-Z)</span>
                {currentMode === "alpha-asc" && <span className="ml-auto text-foreground">&#10003;</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuSort("alpha-desc")}>
                <SortDescendingIcon size={14} />
                <span>Descending (Z-A)</span>
                {currentMode === "alpha-desc" && <span className="ml-auto text-foreground">&#10003;</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuSort("freq-high")}>
                <SortHighFreqIcon size={14} />
                <span>Frequency High</span>
                {currentMode === "freq-high" && <span className="ml-auto text-foreground">&#10003;</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuSort("freq-low")}>
                <SortLowFreqIcon size={14} />
                <span>Frequency Low</span>
                {currentMode === "freq-low" && <span className="ml-auto text-foreground">&#10003;</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableHead>
  )
}

interface GridModuleProps {
  showTabs?: boolean
  selectionActions?: React.ReactNode | null
  dataset?: Dataset | null
  /** Optional clip data passed directly, decoupled from WatchContext. */
  clips?: ClipData[] | null
  onClearFilters?: () => void
  /** Enable inline cell editing (Watch page only) */
  editable?: boolean
  /** Callback fired on single-click of a play row (e.g. to open Preview Module on Explore page). */
  onClickPlay?: (play: PlayData) => void
  /** Callback fired on double-click of a play row (e.g. to open Preview Module). */
  onDoubleClickPlay?: (play: PlayData) => void
  /** ID of the play currently being previewed (for active state styling). */
  activePlayId?: string | null
}

export function GridModule({ showTabs = true, selectionActions, dataset: datasetProp, clips: clipsProp, onClearFilters, editable = false, onClickPlay, onDoubleClickPlay, activePlayId }: GridModuleProps) {
  const { 
    tabs, 
    activeTabId, 
    playingTabId, 
    activeDataset: contextDataset, 
    currentPlay, 
    activateTab, 
    closeTab, 
    seekToPlay,
    selectedPlayIds,
    togglePlaySelection,
    selectAllPlays,
    clearPlaySelection,
    replaceUnsavedTab,
    updatePlay,
  } = useWatchContext()
  const { openCreatePlaylistModal } = useLibraryContext()
  const lastSelectedGridIndexRef = useRef<number | null>(null)

  // Bridge: if clipsProp is provided, wrap it into a Dataset shape so the
  // rest of the component works unchanged. This decouples GridModule from
  // WatchContext when used in Library/Explore views.
  const clipsAsDataset: Dataset | null = clipsProp
    ? {
        id: "clips-prop",
        name: "Clips",
        plays: clipsProp.map((clip, idx) => ({
          id: clip.id,
          playNumber: clip.playNumber ?? idx + 1,
          odk: clip.odk ?? "O",
          quarter: clip.quarter ?? 1,
          down: clip.down ?? 1,
          distance: clip.distance ?? 10,
          yardLine: clip.yardLine ?? "",
          hash: clip.hash ?? "M",
          yards: clip.yards ?? 0,
          result: clip.result ?? "",
          gainLoss: clip.gainLoss ?? "Gn",
          defFront: clip.defFront ?? "",
          defStr: clip.defStr ?? "",
          coverage: clip.coverage ?? "",
          blitz: clip.blitz ?? "",
          game: clip.game ?? "",
          playType: clip.playType ?? "Pass",
          passResult: clip.passResult,
          runDirection: clip.runDirection,
          personnelO: clip.personnelO ?? "11",
          personnelD: clip.personnelD ?? "Base",
          isTouchdown: clip.isTouchdown ?? false,
          isFirstDown: clip.isFirstDown ?? false,
          isPenalty: clip.isPenalty ?? false,
          penaltyType: clip.penaltyType,
        })),
      }
    : null

  // Use prop if provided, otherwise context
  const activeDataset = clipsAsDataset || datasetProp || contextDataset

  // Sort state
  const [sortColumn, setSortColumn] = useState<keyof PlayData | null>(null)
  const [sortMode, setSortMode] = useState<SortMode | null>(null)

  const handleSort = useCallback((column: keyof PlayData, mode: SortMode | null) => {
    if (mode === null) {
      setSortColumn(null)
      setSortMode(null)
    } else {
      setSortColumn(column)
      setSortMode(mode)
    }
  }, [])

  const handleSaveAsPlaylist = () => {
    if (!activeDataset) return

    // Convert PlayData to ClipData for the create modal
    const clips: ClipData[] = activeDataset.plays.map((play) => ({
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

    if (activeDataset.isUnsaved) {
      // When saving from an unsaved preview, pass a callback that replaces
      // the unsaved tab with the newly created saved playlist.
      openCreatePlaylistModal(undefined, clips, (createdId: string) => {
        replaceUnsavedTab(createdId)
      })
    } else {
      openCreatePlaylistModal(undefined, clips)
    }
  }

  if (!activeDataset) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-background rounded-xl border border-border">
        No Data Selected
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-background rounded-xl border border-border shadow-sm overflow-hidden pt-0 border-none">
      {showTabs && (
        <div className="flex items-center gap-1 p-1 bg-muted/30 border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            const isPlaying = tab.id === playingTabId

            return (
              <div
                key={tab.id}
                onClick={() => activateTab(tab.id)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-all min-w-[140px] max-w-[200px] border select-none relative",
                  isActive
                    ? "bg-background text-foreground border-border shadow-sm"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/50",
                )}
              >
                {/* Playing Indicator - Green dot */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-colors",
                    isPlaying ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-transparent",
                  )}
                />

                <span className="truncate flex-1">{tab.name}</span>

                {/* Close Button (Visible on Hover or Active) */}
                <button
                  className={cn(
                    "w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center hover:bg-muted/80",
                    isActive && "opacity-100",
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" />
                  </svg>
                </button>

                {/* Active Stripe Bottom */}
                {isActive && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-t-full" />}
              </div>
            )
          })}
        </div>
      )}

      <div className="px-4 py-2 border-b border-border flex items-center bg-background">
        {selectedPlayIds.size > 0 ? (
          <div className="flex items-center gap-3">
            <button
              onClick={clearPlaySelection}
              className="w-6 h-6 rounded flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Clear selection"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" />
              </svg>
            </button>
            <span className="text-sm font-medium text-[#0273e3]">
              {selectedPlayIds.size} Selected
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/50">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {selectionActions}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">{activeDataset.plays.length} Events</span>
            {activeDataset.isUnsaved && activeDataset.plays.length > 0 && (
              <Button size="sm" onClick={handleSaveAsPlaylist} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save Playlist
              </Button>
            )}
          </div>
        )}
      </div>

      {/* --- GRID TABLE or EMPTY STATE --- */}
      <div className="flex-1 overflow-auto bg-background">
        {activeDataset.plays.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
            {onClearFilters ? (
              <>
                <p className="text-sm">No clips match these filters</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                >
                  Clear all filters
                </Button>
              </>
            ) : (
              <>
                <Icon name="playlist" className="w-12 h-12 opacity-20" />
                <p>This playlist is empty</p>
                <p className="text-xs opacity-60">Add clips from the Library to build your playlist.</p>
              </>
            )}
          </div>
        ) : (
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[40px] text-center bg-muted/30 border-r border-border/50">
                {/* Row number header - empty */}
              </TableHead>
              <TableHead className="w-[40px] px-3 border-r border-border/50 bg-muted/30">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={activeDataset.plays.length > 0 && activeDataset.plays.every(p => selectedPlayIds.has(p.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllPlays(activeDataset.plays)
                      } else {
                        clearPlaySelection()
                      }
                    }}
                  />
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-left text-xs uppercase tracking-wider font-semibold text-foreground border-r border-border/50 bg-muted/30">
                #
              </TableHead>
              <SortableHeader label="ODK" columnKey="odk" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[50px] border-r border-border/50" />
              <SortableHeader label="Qtr" columnKey="quarter" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[50px] border-r border-border/50" />
              <SortableHeader label="Dn" columnKey="down" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[50px] border-r border-border/50" />
              <SortableHeader label="Dist" columnKey="distance" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[60px] border-r border-border/50" />
              <SortableHeader label="Yard Ln" columnKey="yardLine" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[70px] border-r border-border/50" />
              <SortableHeader label="Hash" columnKey="hash" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[50px] border-r border-border/50" />
              <SortableHeader label="Yds" columnKey="yards" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[50px] border-r border-border/50" />
              <SortableHeader label="Result" columnKey="result" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[80px] border-r border-border/50" />
              <SortableHeader label="Gn/Ls" columnKey="gainLoss" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[60px] border-r border-border/50" />
              <SortableHeader label="Def Front" columnKey="defFront" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[80px] border-r border-border/50" />
              <SortableHeader label="Def Str" columnKey="defStr" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[70px] border-r border-border/50" />
              <SortableHeader label="Coverage" columnKey="coverage" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[80px] border-r border-border/50" />
              <SortableHeader label="Blitz" columnKey="blitz" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[50px] border-r border-border/50" />
              <SortableHeader label="League" columnKey="league" activeColumn={sortColumn} activeMode={sortMode} onSort={handleSort} className="w-[70px] border-r border-border/50" />
              <TableHead className="min-w-[120px] text-xs uppercase tracking-wider font-semibold text-foreground bg-muted/30">
                Game
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortPlays(activeDataset.plays, sortColumn, sortMode).map((play, rowIndex) => {
              const isPlaying = currentPlay?.id === play.id && activeTabId === playingTabId

              return (
                <TableRow
                  key={play.id}
                  className={cn(
                    "cursor-pointer transition-colors border-b border-border/50",
                    isPlaying ? "bg-[#0273e3] hover:bg-[#0273e3] text-white" 
                      : activePlayId === play.id ? "bg-[#0273e3]/15 hover:bg-[#0273e3]/20" 
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => {
                    if (onClickPlay) {
                      onClickPlay(play)
                    } else {
                      seekToPlay(play)
                    }
                  }}
                  onDoubleClick={() => onDoubleClickPlay?.(play)}
                >
                  <TableCell className={cn("text-center py-1.5 text-xs text-muted-foreground border-r border-border/50", isPlaying ? "bg-[#0260bd]" : "bg-muted/30")}>
                    {rowIndex + 1}
                  </TableCell>
                  <TableCell
                    className="py-1.5 px-3 border-r border-border/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      const sortedPlays = sortPlays(activeDataset.plays, sortColumn, sortMode)
                      if (e.shiftKey && lastSelectedGridIndexRef.current !== null) {
                        const start = Math.min(lastSelectedGridIndexRef.current, rowIndex)
                        const end = Math.max(lastSelectedGridIndexRef.current, rowIndex)
                        for (let i = start; i <= end; i++) {
                          const p = sortedPlays[i]
                          if (p && !selectedPlayIds.has(p.id)) {
                            togglePlaySelection(p.id)
                          }
                        }
                        lastSelectedGridIndexRef.current = rowIndex
                      } else {
                        togglePlaySelection(play.id)
                        lastSelectedGridIndexRef.current = rowIndex
                      }
                    }}
                  >
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedPlayIds.has(play.id)}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium py-1.5 border-r border-border/50">{play.playNumber}</TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="odk" value={play.odk} onCommit={updatePlay} isPlaying={isPlaying} /> : play.odk}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="quarter" value={play.quarter} onCommit={updatePlay} isPlaying={isPlaying} /> : play.quarter}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="down" value={play.down} onCommit={updatePlay} isPlaying={isPlaying} /> : play.down}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="distance" value={play.distance} onCommit={updatePlay} isPlaying={isPlaying} /> : play.distance}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="yardLine" value={play.yardLine} onCommit={updatePlay} isPlaying={isPlaying} /> : play.yardLine}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="hash" value={play.hash} onCommit={updatePlay} isPlaying={isPlaying} /> : play.hash}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="yards" value={play.yards} onCommit={updatePlay} isPlaying={isPlaying} /> : play.yards}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="result" value={play.result} onCommit={updatePlay} isPlaying={isPlaying} /> : play.result}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "py-1.5 border-r border-border/50",
                      play.gainLoss === "Gn" ? "text-green-600" : "text-red-500",
                      isPlaying && "text-white",
                    )}
                  >
                    {play.gainLoss}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="defFront" value={play.defFront} onCommit={updatePlay} isPlaying={isPlaying} /> : play.defFront}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="defStr" value={play.defStr} onCommit={updatePlay} isPlaying={isPlaying} /> : play.defStr}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="coverage" value={play.coverage} onCommit={updatePlay} isPlaying={isPlaying} /> : play.coverage}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50">
                    {editable ? <EditableCell play={play} columnKey="blitz" value={play.blitz} onCommit={updatePlay} isPlaying={isPlaying} /> : play.blitz}
                  </TableCell>
                  <TableCell className="py-1.5 border-r border-border/50 text-xs">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      play.league === "NFL" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                      play.league === "College" && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
                      play.league === "HighSchool" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                      !play.league && "bg-muted text-muted-foreground"
                    )}>
                      {play.league === "HighSchool" ? "HS" : play.league || "NFL"}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 text-xs opacity-70">{play.game}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        )}
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { TooltipProvider } from "@/components/ui/tooltip"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/checkbox"
import { Icon } from "@/components/icon"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { useDensity, getDensitySpacing } from "@/lib/density-context"
import { useLibraryContext } from "@/lib/library-context"

export interface LibraryItemData {
  id: string
  name: string
  thumbnailUrl?: string
  type: "video" | "pdf" | "image" | "audio" | "document" | "playlist"
  dateModified?: string
  hasData?: boolean
  itemCount?: number
  duration?: string
  size?: string
  createdDate?: string
  angles?: number
  comments?: number
  items?: LibraryItemData[]
}

interface LibraryItemProps {
  item: LibraryItemData
  level?: number
  index?: number
  flatIndex?: number
  onSelect?: (itemId: string, selected: boolean, flatIndex?: number, shiftKey?: boolean) => void
  selectedItems?: Set<string>
  importedItems?: Set<string>
  onUpdateImported?: (id: string, type: "folder" | "item") => void
  density?: string
  onMove?: (movedId: string, targetId: string, type: "folder" | "item") => void
  onOpen?: (itemId: string) => void
}

const DataIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M11.0833 2.33325H2.91667C2.27233 2.33325 1.75 2.85559 1.75 3.49992V11.6666C1.75 12.3109 2.27233 12.8333 2.91667 12.8333H11.0833C11.7277 12.8333 12.25 12.3109 12.25 11.6666V3.49992C12.25 2.85559 11.7277 2.33325 11.0833 2.33325Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4.66602 1.16675V3.50008" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.33398 1.16675V3.50008" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.75 5.83325H12.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M5.25 8.16675L6.41667 9.33341L8.75 7.00008"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const AnglesIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0_angles)">
      <path
        d="M12.8333 9.91667C12.8333 10.227 12.7101 10.5245 12.4913 10.7433C12.2725 10.9621 11.975 11.0833 11.6647 11.0833H3.50033C3.18991 11.0833 2.89236 10.9621 2.67357 10.7433C2.45478 10.5245 2.33366 10.227 2.33366 9.91667V4.66667C2.33366 4.35624 2.45478 4.0587 2.67357 3.83991C2.89236 3.62111 3.18991 3.5 3.50033 3.5H5.25033L6.41699 5.25H11.6647C11.975 5.25 12.2725 5.37111 12.4913 5.58991C12.7101 5.8087 12.8333 6.10624 12.8333 6.41667V9.91667Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.83301 8.16675H9.33301" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.58301 6.41675V9.91675" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4.66699 3.49992V2.33325C4.66699 2.02383 4.78911 1.72629 5.0079 1.50749C5.22669 1.2887 5.52424 1.16659 5.83366 1.16659H10.5003C10.8098 1.16659 11.1073 1.2887 11.3261 1.50749C11.5449 1.72629 11.667 2.02383 11.667 2.33325V5.24992"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_angles">
        <rect width="14" height="14" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const CommentsIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12.25 6.70841C12.2524 7.40094 12.0929 8.08401 11.7842 8.70258C11.4134 9.44867 10.843 10.0769 10.1365 10.5175C9.42992 10.9582 8.61494 11.1943 7.78167 11.2001C7.08914 11.2024 6.40607 11.0429 5.7875 10.7342L1.75 12.2501L3.26583 8.21258C2.95713 7.59401 2.79764 6.91094 2.8 6.21841C2.80577 5.38514 3.04193 4.57016 3.48254 3.86362C3.92316 3.15708 4.55141 2.58666 5.2975 2.21591C5.91607 1.90721 6.59914 1.74772 7.29167 1.75008H7.58333C8.68237 1.81013 9.72603 2.26194 10.5238 3.0196C11.3215 3.77726 11.8215 4.79563 11.9333 5.89008C11.944 5.9955 11.9499 6.10136 11.9507 6.20728L12.25 6.70841Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function LibraryItem({
  item,
  level = 0,
  index = 0,
  flatIndex,
  onSelect,
  selectedItems = new Set(),
  importedItems = new Set(),
  onUpdateImported,
  onMove,
  onOpen,
}: LibraryItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isSelected = selectedItems.has(item.id)
  const isImported = importedItems.has(item.id)

  const { density } = useDensity()
  const spacing = getDensitySpacing(density)
  const { columns, openMoveModal, openPermissionsModal } = useLibraryContext()

  const isAlternate = index % 2 === 1
  const indentMargin = (level || 0) * spacing.indent
  const isVideo = item.type === "video"

  const totalRowWidth =
    columns.reduce((sum, col) => (col.visible ? sum + col.width : sum), 0) +
    (columns.filter((c) => c.visible).length - 1) * 12 +
    16 +
    8 +
    12 +
    16

  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(item.id, checked, flatIndex)
  }

  // Capture phase handler intercepts shift+click BEFORE Radix processes it
  const handleRowClickCapture = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.stopPropagation()
      e.preventDefault()
      onSelect?.(item.id, true, flatIndex, true)
    }
  }

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest('[role="checkbox"]')) {
      return
    }

    // Double-click opens the item in Watch page
    if (e.detail === 2) {
      onOpen?.(item.id)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.setData("application/json", JSON.stringify({ id: item.id, type: "item" }))
    e.dataTransfer.effectAllowed = "move"
  }

  const renderCell = (columnId: string) => {
    switch (columnId) {
      case "name":
        return (
          <div className="flex items-center flex-1 min-w-0">
            {/* Indentation Spacer */}
            <div style={{ width: `${indentMargin}px` }} className="flex-shrink-0 transition-[width] duration-200" />

            {/* Checkbox Container (w-6) - Matches Folder */}
            <div className="flex-shrink-0 w-6 flex justify-center">
              {!isImported && <Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />}
            </div>

            {/* Icon/Thumbnail - fixed width */}
            <div className="flex items-center justify-center flex-shrink-0 rounded overflow-hidden h-5 w-9 ml-0 relative">
              {item.type === "playlist" ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Icon name="menu" size={14} className={cn(isSelected ? "text-white" : "text-foreground")} />
                </div>
              ) : (
                <>
                  {/* Always render the static thumbnail so layout never shifts */}
                  <div className="w-full h-full bg-muted">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-green-600 to-green-800 w-full" />
                    )}
                  </div>

                  {/* Play button overlay on hover -- absolutely positioned so it causes no layout shift */}
                  {isHovered && item.type === "video" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen?.(item.id)
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-muted rounded transition-colors"
                      aria-label={`Play ${item.name}`}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-4 h-4 rounded-full border-[1.5px]",
                        isSelected
                          ? "border-white text-white"
                          : "border-foreground/70 text-foreground/70",
                      )}>
                        <Icon name="play" size={8} className="fill-current ml-px" />
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 flex items-center gap-2 min-w-0 ml-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn("text-sm font-medium truncate block", isSelected ? "text-white" : "text-foreground")}
                  >
                    {item.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{item.name}</TooltipContent>
              </Tooltip>
              {isImported && <span className="text-xs text-green-600 font-medium">Imported</span>}
              {item.type === "playlist" && typeof item.itemCount === "number" && (
                <span className={cn("text-xs tabular-nums", isSelected ? "text-white/60" : "text-muted-foreground")}>
                  {item.itemCount} {item.itemCount === 1 ? "clip" : "clips"}
                </span>
              )}
            </div>
          </div>
        )
      case "dateModified":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm truncate block", isSelected ? "text-white/80" : "text-muted-foreground")}>
                {item.dateModified || ""}
              </span>
            </TooltipTrigger>
            {item.dateModified && <TooltipContent>{item.dateModified}</TooltipContent>}
          </Tooltip>
        )
      case "type":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm truncate block", isSelected ? "text-white/80" : "text-muted-foreground")}>
                {formatItemType(item.type)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{formatItemType(item.type)}</TooltipContent>
          </Tooltip>
        )
      case "hasData":
        return isVideo ? (
          item.hasData ? (
            <DataIcon className={cn("w-4 h-4", isSelected ? "text-white" : "text-muted-foreground")} />
          ) : null
        ) : (
          <span className={cn("text-sm", isSelected ? "text-white/80" : "text-muted-foreground")}></span>
        )
      case "itemCount":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "text-sm text-left truncate block",
                  isSelected ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {isVideo ? (item.itemCount ?? "") : ""}
              </span>
            </TooltipTrigger>
            {isVideo && item.itemCount !== undefined && <TooltipContent>{item.itemCount}</TooltipContent>}
          </Tooltip>
        )
      case "angles":
        return isVideo && item.angles !== undefined ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <AnglesIcon
                  className={cn("w-3.5 h-3.5 flex-shrink-0", isSelected ? "text-white" : "text-muted-foreground")}
                />
                <span className={cn("text-sm truncate block", isSelected ? "text-white/80" : "text-muted-foreground")}>
                  {item.angles}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{item.angles} Angles</TooltipContent>
          </Tooltip>
        ) : (
          <span className={cn("text-sm", isSelected ? "text-white/80" : "text-muted-foreground")}></span>
        )
      case "duration":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm truncate block", isSelected ? "text-white/80" : "text-muted-foreground")}>
                {isVideo ? (item.duration ?? "") : ""}
              </span>
            </TooltipTrigger>
            {isVideo && item.duration && <TooltipContent>{item.duration}</TooltipContent>}
          </Tooltip>
        )
      case "size":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm truncate block", isSelected ? "text-white/80" : "text-muted-foreground")}>
                {isVideo ? (item.size ?? "") : ""}
              </span>
            </TooltipTrigger>
            {isVideo && item.size && <TooltipContent>{item.size}</TooltipContent>}
          </Tooltip>
        )
      case "comments":
        return isVideo ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <CommentsIcon
                  className={cn("w-3.5 h-3.5 flex-shrink-0", isSelected ? "text-white" : "text-muted-foreground")}
                />
                <span className={cn("text-sm truncate block", isSelected ? "text-white/80" : "text-muted-foreground")}>
                  {item.comments ?? 0}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{item.comments ?? 0} Comments</TooltipContent>
          </Tooltip>
        ) : (
          <span className={cn("text-sm", isSelected ? "text-white/80" : "text-muted-foreground")}></span>
        )
      case "createdDate":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm truncate block", isSelected ? "text-white/80" : "text-muted-foreground")}>
                {item.createdDate || ""}
              </span>
            </TooltipTrigger>
            {item.createdDate && <TooltipContent>{item.createdDate}</TooltipContent>}
          </Tooltip>
        )
      default:
        return null
    }
  }

  const showActions = isHovered || isSelected || isMenuOpen

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TooltipProvider>
          <div
            className={cn(
              `flex items-center ${spacing.py} cursor-pointer transition-colors relative`,
              isSelected && !isHovered && "bg-[#0D2959]",
              isSelected && isHovered && "bg-[#0D2959]",
              !isSelected && isHovered && "bg-muted",
              !isSelected && !isHovered && isAlternate && "bg-muted/20",
              !isSelected && !isHovered && !isAlternate && "bg-background",
            )}
            style={{ minWidth: "100%" }}
            onClickCapture={handleRowClickCapture}
            onClick={handleRowClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable
            onDragStart={handleDragStart}
          >
            <div className="flex items-center flex-1 min-w-0 pl-4">
              {columns.map((column, idx) =>
                column.visible ? (
                  <div
                    key={column.id}
                    className={cn("flex-shrink-0", {
                      "flex justify-center": column.align === "center",
                      "text-left": column.align === "left",
                      "text-right": column.align === "right",
                      "ml-3": idx > 0,
                    })}
                    style={{ width: column.width, minWidth: column.width }}
                  >
                    {renderCell(column.id)}
                  </div>
                ) : null,
              )}
            </div>

            <div
              className={cn(
                "sticky right-0 flex items-center justify-center w-12 flex-shrink-0 z-10",
                isSelected || isMenuOpen
                  ? "bg-[#0D2959]"
                  : isHovered
                    ? "bg-muted"
                    : "bg-transparent",
              )}
            >
              {isImported ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateImported?.(item.id, "item")
                  }}
                >
                  Update
                </Button>
              ) : (
                <div
                  className={cn(
                    "transition-opacity duration-200",
                    showActions ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                  )}
                >
                  <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "h-6 w-6 flex items-center justify-center rounded-md transition-colors",
                          isSelected || isMenuOpen
                            ? "hover:bg-white/20 text-white"
                            : "bg-black/5 hover:bg-black/10 text-muted-foreground hover:text-foreground",
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-0.5">
                          <div
                            className={cn(
                              "w-0.5 h-0.5 rounded-full",
                              isSelected || isMenuOpen ? "bg-white" : "bg-current",
                            )}
                          />
                          <div
                            className={cn(
                              "w-0.5 h-0.5 rounded-full",
                              isSelected || isMenuOpen ? "bg-white" : "bg-current",
                            )}
                          />
                          <div
                            className={cn(
                              "w-0.5 h-0.5 rounded-full",
                              isSelected || isMenuOpen ? "bg-white" : "bg-current",
                            )}
                          />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen?.(item.id)
                        }}
                      >
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openPermissionsModal(item.id)
                        }}
                      >
                        Share...
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openMoveModal([{ id: item.id, type: "item" }])
                        }}
                      >
                        Move
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onOpen?.(item.id)}>Open</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openPermissionsModal(item.id)}>Share...</ContextMenuItem>
        <ContextMenuItem onClick={() => openMoveModal([{ id: item.id, type: "item" }])}>Move</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const formatItemType = (type: string): string => {
  const typeMap: Record<string, string> = {
    video: "Video",
    pdf: "PDF",
    image: "Image",
    audio: "Audio",
    document: "Document",
    playlist: "Playlist",
  }
  return typeMap[type] || type
}

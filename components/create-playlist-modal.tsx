"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/icon"
import { useLibraryContext } from "@/lib/library-context"
import { LibraryBreadcrumbs } from "@/components/library-breadcrumbs"
import { cn } from "@/lib/utils"
import type { FolderData } from "@/components/folder"
import type { ClipData } from "@/types/library"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useRouter } from "next/navigation"

export function CreatePlaylistModal() {
  const { isCreatePlaylistModalOpen, closeCreatePlaylistModal, createPlaylist, folders, setWatchItem, pendingPlaylistClips, onPlaylistCreatedCallback } = useLibraryContext()
  const { toast } = useToast()
  const router = useRouter()
  const [playlistName, setPlaylistName] = useState("")
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null)

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeCreatePlaylistModal()
      setPlaylistName("")
      setCurrentFolderId(null)
      setHoveredFolderId(null)
    }
  }

  // Find folder by ID recursively
  const findFolderById = (nodes: FolderData[], id: string): FolderData | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findFolderById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Get current folder's children
  const currentChildren = useMemo(() => {
    if (currentFolderId === null) {
      return folders
    }
    const current = findFolderById(folders, currentFolderId)
    return current?.children || []
  }, [folders, currentFolderId])

  // Build breadcrumbs path to current folder
  const breadcrumbs = useMemo(() => {
    if (currentFolderId === null) return []

    const path: Array<{ id: string; name: string }> = []

    const findPath = (
      nodes: FolderData[],
      targetId: string,
      currentPath: Array<{ id: string; name: string }>,
    ): boolean => {
      for (const folder of nodes) {
        const newPath = [...currentPath, { id: folder.id, name: folder.name }]
        if (folder.id === targetId) {
          path.push(...newPath)
          return true
        }
        if (folder.children && findPath(folder.children, targetId, newPath)) {
          return true
        }
      }
      return false
    }

    findPath(folders, currentFolderId, [])
    return path
  }, [folders, currentFolderId])

  const handleCreate = () => {
    if (playlistName.trim()) {
      const clipsToSave = pendingPlaylistClips.length > 0 ? pendingPlaylistClips : undefined
      const callback = onPlaylistCreatedCallback
      const createdId = createPlaylist(currentFolderId, playlistName.trim(), clipsToSave)
      setPlaylistName("")
      setCurrentFolderId(null)

      if (callback) {
        // Unsaved-preview scenario: replace the unsaved tab with the saved playlist
        callback(createdId)
        toast({ description: "New playlist created." })
      } else {
        // Normal scenario: show toast with "Open Playlist" action
        toast({
          description: "New playlist created.",
          action: (
            <ToastAction
              altText="Open Playlist"
              onClick={() => {
                setWatchItem(createdId)
                router.push("/watch")
              }}
              className="h-7 px-2 text-xs"
            >
              Open Playlist
            </ToastAction>
          ),
        })
      }
    }
  }

  // Helper to count items in a folder
  const getFolderItemCount = (folder: FolderData): number => {
    return (folder.items?.length || 0) + (folder.children?.length || 0)
  }

  return (
    <Dialog open={isCreatePlaylistModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 flex flex-col h-[600px]">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-2xl font-semibold text-foreground">New Playlist</h2>
        </div>

        <div className="border-t border-border" />

        <div className="px-6 pt-4 pb-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input 
              placeholder="Enter playlist name..." 
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              autoFocus
              className="border border-border"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <LibraryBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={(id) => setCurrentFolderId(id)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-border">
          <div className="px-6">
            <div className="flex flex-col">
              {currentChildren.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {currentFolderId === null ? "No folders in library" : "No subfolders"}
                </div>
              ) : (
                currentChildren.map((child) => {
                  const childItemCount = getFolderItemCount(child)
                  return (
                    <button
                      key={child.id}
                      onClick={() => setCurrentFolderId(child.id)}
                      onMouseEnter={() => setHoveredFolderId(child.id)}
                      onMouseLeave={() => setHoveredFolderId(null)}
                      className={cn(
                        "flex items-center justify-between py-3 text-left w-full border-b border-dashed border-border",
                        hoveredFolderId === child.id && "bg-[#dbeafe]",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="folder" className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-foreground">{child.name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{childItemCount} Items</span>
                      </div>
                      {hoveredFolderId === child.id && (
                        <Icon name="chevronRight" className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border mt-auto">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!playlistName.trim()} className="bg-primary text-primary-foreground">
            Create Playlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

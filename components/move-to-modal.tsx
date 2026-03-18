"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/icon"
import { useLibraryContext } from "@/lib/library-context"
import type { FolderData } from "@/components/folder"
import { cn } from "@/lib/utils"
import { LibraryBreadcrumbs } from "@/components/library-breadcrumbs"

export function MoveToModal() {
  const { isMoveModalOpen, closeMoveModal, moveItemsToFolder, folders, itemsToMove, createSubfolderInMove } =
    useLibraryContext()

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null)

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeMoveModal()
      setCurrentFolderId(null)
      setSearchQuery("")
      setIsCreatingFolder(false)
      setNewFolderName("")
      setHoveredFolderId(null)
    }
  }

  const { title, itemName, itemCount } = useMemo(() => {
    const folderCount = itemsToMove.filter((m) => m.type === "folder").length
    const itemCountNum = itemsToMove.filter((m) => m.type === "item").length
    const totalCount = folderCount + itemCountNum

    if (totalCount === 0) {
      return { title: "Move", itemName: "", itemCount: "" }
    }

    if (folderCount > 0 && itemCountNum === 0) {
      // Only folders
      if (folderCount === 1) {
        const folderId = itemsToMove.find((m) => m.type === "folder")?.id
        const folderName = findFolderName(folders, folderId || "") || "Folder"
        const childCount = findFolderChildCount(folders, folderId || "")
        return {
          title: "Move Folder",
          itemName: folderName,
          itemCount: `${childCount} Items`,
        }
      }
      return {
        title: "Move Folders",
        itemName: `${folderCount} Folders`,
        itemCount: "",
      }
    }

    if (itemCountNum > 0 && folderCount === 0) {
      // Only items
      if (itemCountNum === 1) {
        return {
          title: "Move Item",
          itemName: itemsToMove[0]?.name || "Item",
          itemCount: "",
        }
      }
      return {
        title: "Move Items",
        itemName: `${itemCountNum} Items`,
        itemCount: "",
      }
    }

    // Mixed
    return {
      title: "Move",
      itemName: `${totalCount} Items`,
      itemCount: "",
    }
  }, [itemsToMove, folders])

  // Helper to find folder name by ID
  function findFolderName(nodes: FolderData[], id: string): string | null {
    for (const node of nodes) {
      if (node.id === id) return node.name
      if (node.children) {
        const found = findFolderName(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Helper to count items in a folder
  function findFolderChildCount(nodes: FolderData[], id: string): number {
    for (const node of nodes) {
      if (node.id === id) {
        return (node.items?.length || 0) + (node.children?.length || 0)
      }
      if (node.children) {
        const found = findFolderChildCount(node.children, id)
        if (found >= 0) return found
      }
    }
    return 0
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

  // Get current folder's children and items
  const { currentChildren, currentItems } = useMemo(() => {
    if (currentFolderId === null) {
      return { currentChildren: folders, currentItems: [] }
    }
    const current = findFolderById(folders, currentFolderId)
    return {
      currentChildren: current?.children || [],
      currentItems: current?.items || [],
    }
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

  // Flatten all folders for search with their paths
  const flattenedFolders = useMemo(() => {
    const result: Array<{ folder: FolderData; path: string }> = []

    const traverse = (nodes: FolderData[], path: string[]) => {
      for (const node of nodes) {
        // Skip folders that are being moved
        if (itemsToMove.some((m) => m.type === "folder" && m.id === node.id)) continue

        result.push({
          folder: node,
          path: [...path, node.name].join(" / "),
        })
        if (node.children) {
          traverse(node.children, [...path, node.name])
        }
      }
    }

    traverse(folders, [])
    return result
  }, [folders, itemsToMove])

  // Filter folders by search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return flattenedFolders.filter(
      ({ folder, path }) => folder.name.toLowerCase().includes(query) || path.toLowerCase().includes(query),
    )
  }, [flattenedFolders, searchQuery])

  const handleMove = () => {
    // Allow moving to root (currentFolderId is null)
    moveItemsToFolder(currentFolderId)
    setCurrentFolderId(null)
    setSearchQuery("")
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    const newId = createSubfolderInMove(currentFolderId, newFolderName.trim())
    setIsCreatingFolder(false)
    setNewFolderName("")
    setCurrentFolderId(newId)
  }

  const handleSearchResultClick = (folderId: string) => {
    setCurrentFolderId(folderId)
    setSearchQuery("")
  }

  // Filter out folders that are being moved from the display
  const displayChildren = currentChildren.filter(
    (folder) => !itemsToMove.some((m) => m.type === "folder" && m.id === folder.id),
  )

  return (
    <Dialog open={isMoveModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 flex flex-col h-[600px]">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        </div>

        <div className="border-t border-border" />

        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{itemName}</span>
            {itemCount && <span className="text-muted-foreground">{itemCount}</span>}
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a folder"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border"
            />
          </div>
        </div>

        <div className="px-6 py-2 border-b border-border/40">
          <LibraryBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={(id) => setCurrentFolderId(id)} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6">
            {/* Search Results Mode */}
            {searchQuery ? (
              <div className="flex flex-col">
                {searchResults.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No folders found matching "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map(({ folder, path }) => (
                    <button
                      key={folder.id}
                      onClick={() => handleSearchResultClick(folder.id)}
                      onMouseEnter={() => setHoveredFolderId(folder.id)}
                      onMouseLeave={() => setHoveredFolderId(null)}
                      className={cn(
                        "flex items-center justify-between py-3 text-left w-full border-b border-dashed border-border",
                        hoveredFolderId === folder.id && "bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="folder" className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{folder.name}</span>
                          <span className="text-xs text-muted-foreground">{path}</span>
                        </div>
                      </div>
                      {hoveredFolderId === folder.id && (
                        <Icon name="chevronRight" className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  ))
                )}
              </div>
            ) : (
              // Folder and Item listing
              <div className="flex flex-col">
                {displayChildren.length === 0 && currentItems.length === 0 && !isCreatingFolder ? (
                  <div className="text-center text-muted-foreground py-8">
                    {currentFolderId === null ? "No folders in library" : "No subfolders or items"}
                  </div>
                ) : (
                  <>
                    {displayChildren.map((child) => {
                      const childItemCount = (child.items?.length || 0) + (child.children?.length || 0)
                      return (
                        <button
                          key={child.id}
                          onClick={() => setCurrentFolderId(child.id)}
                          onMouseEnter={() => setHoveredFolderId(child.id)}
                          onMouseLeave={() => setHoveredFolderId(null)}
                          className={cn(
                            "flex items-center justify-between py-3 text-left w-full border-b border-dashed border-border",
                            hoveredFolderId === child.id && "bg-muted/50",
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
                    })}

                    {currentItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-3 border-b border-dashed border-border">
                        <div className="w-10 h-6 bg-muted rounded flex-shrink-0 overflow-hidden">
                          <img
                            src={item.thumbnail || "/placeholder.svg?height=24&width=40&query=video thumbnail"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-foreground">{item.name}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Inline New Folder Creator */}
                {isCreatingFolder && (
                  <div className="flex items-center gap-3 py-3 bg-muted/30 border-b border-dashed border-border">
                    <Icon name="folder" className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <Input
                      autoFocus
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFolder()
                        if (e.key === "Escape") {
                          setIsCreatingFolder(false)
                          setNewFolderName("")
                        }
                      }}
                      className="h-8 flex-1 border-0 bg-transparent focus-visible:ring-0"
                    />
                    <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                      Create
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border mt-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setIsCreatingFolder(true)
            }}
            className="text-primary hover:text-primary"
          >
            <Icon name="plus" className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove} className="bg-primary text-primary-foreground">
              Move Here
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

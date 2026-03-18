/**
 * Centralized data types for the Library architecture.
 *
 * Separates Structure (FolderNode) from Content (MediaItemData).
 * Media items live in a flat list with parentId references instead of
 * being nested inside folder objects.
 */

// ---------------------------------------------------------------------------
// Clip-level data
// ---------------------------------------------------------------------------

export interface ClipData {
  /** Globally unique clip identifier */
  id: string

  /** Foreign key to Game.id - the game this clip belongs to */
  gameId?: string

  /** 
   * Athletes featured in this clip (subset of players from the teams in the game).
   * References athlete IDs from athletes-data.ts.
   */
  athleteIds?: string[]

  // --- Play-level fields (mirrors PlayData from mock-datasets) ---
  playNumber?: number
  odk?: "O" | "D" | "K"
  quarter?: number
  down?: number
  distance?: number
  yardLine?: string
  hash?: "L" | "R" | "M"
  yards?: number
  result?: string
  gainLoss?: "Gn" | "Ls"
  defFront?: string
  defStr?: string
  coverage?: string
  blitz?: string
  game?: string
  playType?: "Pass" | "Run" | "Special Teams"
  passResult?: "Complete" | "Incomplete" | "Sack" | "Interception" | "Throwaway"
  runDirection?: "Left" | "Middle" | "Right"
  personnelO?: "11" | "12" | "21" | "22" | "10" | "Empty"
  personnelD?: "Base" | "Nickel" | "Dime" | "Goal Line"
  isTouchdown?: boolean
  isFirstDown?: boolean
  isPenalty?: boolean
  penaltyType?: string

  // --- Media fields ---
  videoUrl?: string
  startTime?: number
  duration?: number
}

// ---------------------------------------------------------------------------
// Media Item (Content) -- flat list, references parent folder via parentId
// ---------------------------------------------------------------------------

export interface MediaItemData {
  id: string
  name: string
  type: "video" | "playlist"
  /** Folder this item belongs to. null = library root. */
  parentId: string | null
  clips: ClipData[]
  createdAt: string
  modifiedAt: string
}

// ---------------------------------------------------------------------------
// Folder (Structure) -- tree of folders, NO embedded media items
// ---------------------------------------------------------------------------

export interface FolderNode {
  id: string
  name: string
  parentId: string | null
  children?: FolderNode[]
  // Note: MediaItems are NOT stored here -- use getMediaItemsByFolderId
}

// ---------------------------------------------------------------------------
// Legacy compatibility re-exports
// ---------------------------------------------------------------------------

/**
 * @deprecated Use the new types directly from this module instead of
 * importing from component files. Kept temporarily so existing consumers
 * continue to work while we migrate.
 */
export interface CreatedLibraryItem {
  id: string
  name: string
  type: "playlist"
  parentId: string | null
  clips: ClipData[]
  metadata: {
    clipCount: number
    duration?: string
    createdDate: string
    modifiedDate: string
  }
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Generate a unique clip id using a timestamp + random suffix. */
export function generateUniqueClipId(): string {
  return `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/** Deep-copy an array of clips, assigning each copy a new unique id. */
export function copyClipsWithNewIds(clips: ClipData[]): ClipData[] {
  return clips.map((clip) => ({
    ...clip,
    id: generateUniqueClipId(),
  }))
}

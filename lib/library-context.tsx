"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"
import type { FolderData } from "@/components/folder"
import type { LibraryItemData } from "@/components/library-item"
import { useMediaItems } from "@/hooks/use-media-items"
import type { ClipData, MediaItemData } from "@/types/library"
import { copyClipsWithNewIds } from "@/types/library"

export type SortDirection = "asc" | "desc" | null

export interface Column {
  id: string
  label: string
  visible: boolean
  width: number
  align?: "left" | "center" | "right"
  fixed?: boolean
}

// --- DATA GENERATORS ---

const TEAMS = [
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GB",
  "HOU",
  "IND",
  "JAX",
  "KC",
  "LV",
  "LAC",
  "LAR",
  "MIA",
  "MIN",
  "NE",
  "NO",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SF",
  "SEA",
  "TB",
  "TEN",
  "WAS",
]

const generateLeafItems = (year: number, folderId: string): LibraryItemData[] => {
  // 1. Random count between 1 and 10
  const count = Math.floor(Math.random() * 10) + 1

  const items: LibraryItemData[] = []
  const baseMonth = 8 // August (Preseason/Start)

  for (let i = 0; i < count; i++) {
    const month = baseMonth + Math.floor(Math.random() * 5)
    const day = Math.floor(Math.random() * 28) + 1
    const dateStr = `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year.toString().slice(-2)}`

    // 2. Generate Unique Name with home/away teams
    const home = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    let away = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    while (away === home) {
      away = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    }

    const type = Math.random() > 0.7 ? "Practice" : "Game"
    const name = type === "Game" ? `${dateStr} ${away} @ ${home}` : `${dateStr} ${home} Practice ${i + 1}`

    // Randomize metadata
    const durationMin = 20 + Math.floor(Math.random() * 100)
    const sizeGB = (1 + Math.random() * 4).toFixed(1)

    items.push({
      id: `item-${folderId}-${i}`,
      name: name,
      type: "video",
      dateModified: `Oct ${10 + i}, ${year}`,
      createdDate: `Sep ${day}, ${year}`,
      hasData: Math.random() > 0.3,
      itemCount: Math.floor(Math.random() * 150) + 50,
      duration: `${Math.floor(durationMin / 60)}:${String(durationMin % 60).padStart(2, "0")}:00`,
      size: `${sizeGB} GB`,
      angles: 2 + Math.floor(Math.random() * 3),
      comments: Math.floor(Math.random() * 20),
      thumbnailUrl: "/football-field.png",
    })
  }
  return items
}

function createSelfScoutSubfolderStructure(year: number, parentId: string): FolderData[] {
  const baseId = `${parentId}-sub`

  const structure: { name: string; children?: { name: string }[] }[] = [
    { name: "Masters Work" },
    { name: "Masters" },
    { name: "Practice Masters" },
    { name: "Offensive Reporting" },
    { name: "Defensive Reporting" },
    { name: "Special Team Reporting" },
    {
      name: "Offense Share",
      children: [
        { name: "Games" },
        { name: "Preseason Games" },
        { name: "Cutups" },
        { name: "Hot Folder" },
        { name: "Meetings" },
        { name: "Practice Drills" },
        { name: "Player Profiles" },
        { name: "Situational Masters" },
      ],
    },
    { name: "Defense Share" },
    { name: "Special Teams Share" },
    { name: "Gameday" },
    { name: "Temp Plane Work" },
    { name: "Work" },
  ]

  return structure.map((f, i) => {
    const id = `${baseId}-${i}`
    const children = f.children
      ? f.children.map((c, j) => ({
          id: `${id}-${j}`,
          name: c.name,
          dateModified: `Dec ${10 + j}, ${year}`,
          items: generateLeafItems(year, `${id}-${j}`),
        }))
      : undefined

    return {
      id,
      name: f.name,
      dateModified: `Dec ${5 + i}, ${year}`,
      children,
      items: children ? undefined : generateLeafItems(year, id),
    }
  })
}

function createTrainingCampStructure(year: number, parentId: string): FolderData[] {
  const baseId = `${parentId}-tc`

  const structure: { name: string; children?: { name: string }[] }[] = [
    { name: "Masters Work" },
    { name: "Meeting Masters" },
    {
      name: "Practice Masters",
      children: [{ name: "Practice Masters Today" }],
    },
    { name: "Offense Share" },
    { name: "Defense Share" },
    { name: "Special Teams Share" },
    { name: "Work" },
  ]

  return structure.map((f, i) => {
    const id = `${baseId}-${i}`
    const children = f.children
      ? f.children.map((c, j) => ({
          id: `${id}-${j}`,
          name: c.name,
          dateModified: `Jul 25, ${year}`,
          items: generateLeafItems(year, `${id}-${j}`),
        }))
      : undefined

    return {
      id,
      name: f.name,
      dateModified: `Jul ${15 + i}, ${year}`,
      children,
      items: children ? undefined : generateLeafItems(year, id),
    }
  })
}

function createOffseasonStudiesStructure(year: number, parentId: string): FolderData[] {
  const baseId = `${parentId}-off`

  const structure: { name: string; children?: { name: string }[] }[] = [
    {
      name: "Offense Share",
      children: [
        { name: "Hot Folder" },
        { name: "13 GB OFF PFF Cutups" },
        { name: `${year} LaFleur Cutups` },
        { name: `${year.toString().slice(-2)} CIN OFF PFF Cutups` },
        { name: `${year.toString().slice(-2)} LA OFF PFF Cutups` },
      ],
    },
    { name: "Defense Share" },
    { name: "Special Teams Share" },
    { name: "Work" },
  ]

  return structure.map((f, i) => {
    const id = `${baseId}-${i}`
    const children = f.children
      ? f.children.map((c, j) => ({
          id: `${id}-${j}`,
          name: c.name,
          dateModified: `Feb ${5 + j}, ${year}`,
          items: generateLeafItems(year, `${id}-${j}`),
        }))
      : undefined

    return {
      id,
      name: f.name,
      dateModified: `Jan ${10 + i}, ${year}`,
      children,
      items: children ? undefined : generateLeafItems(year, id),
    }
  })
}

function createMiniCampOTAStructure(year: number, parentId: string): FolderData[] {
  const baseId = `${parentId}-ota`

  const structure: { name: string; children?: { name: string }[] }[] = [
    { name: "Masters Work" },
    { name: "Meeting Masters" },
    { name: "Practice Masters" },
    {
      name: "Offense Share",
      children: [
        { name: "Mini Camp OTA Installs" },
        { name: "Hot Folder" },
        { name: "Workouts" },
        { name: "Meetings" },
        { name: "Cutups" },
        { name: "Phase 1 Field Work Week 01" },
        { name: "Phase 1 Field Work Week 02" },
        { name: "Phase 2 Practice Week 01" },
        { name: "Phase 2 Practice Week 02" },
        { name: "Phase 3 Practice Week 01" },
        { name: "Mauicamp Practice" },
        { name: "Practice Drills" },
      ],
    },
    { name: "Defense Share" },
    { name: "Special Teams Share" },
    { name: "Work" },
  ]

  return structure.map((f, i) => {
    const id = `${baseId}-${i}`
    const children = f.children
      ? f.children.map((c, j) => ({
          id: `${id}-${j}`,
          name: c.name,
          dateModified: `May ${25 + j}, ${year}`,
          items: generateLeafItems(year, `${id}-${j}`),
        }))
      : undefined

    return {
      id,
      name: f.name,
      dateModified: `May ${15 + i}, ${year}`,
      children,
      items: children ? undefined : generateLeafItems(year, id),
    }
  })
}

function createSelfScoutYearFolders(): FolderData[] {
  const yearFolders: FolderData[] = []

  for (let year = 2025; year >= 2023; year--) {
    const yearId = `self-scout-${year}`
    yearFolders.push({
      id: yearId,
      name: year.toString(),
      dateModified: `Dec 31, ${year}`,
      children: [
        {
          id: `${yearId}-offseason`,
          name: "Offseason Studies",
          dateModified: `Feb 28, ${year}`,
          children: createOffseasonStudiesStructure(year, `${yearId}-offseason`),
        },
        {
          id: `${yearId}-minicamp`,
          name: "Mini-Camp OTA",
          dateModified: `Jun 15, ${year}`,
          children: createMiniCampOTAStructure(year, `${yearId}-minicamp`),
        },
        {
          id: `${yearId}-training-camp`,
          name: "Training Camp",
          dateModified: `Aug 15, ${year}`,
          children: createTrainingCampStructure(year, `${yearId}-training-camp`),
        },
        {
          id: `${yearId}-self-scout`,
          name: "Self Scout",
          dateModified: `Dec 31, ${year}`,
          children: createSelfScoutSubfolderStructure(year, `${yearId}-self-scout`),
        },
      ],
    })
  }
  return yearFolders
}

function createDetailedOpponentStructure(year: number, teamName: string, parentId: string): FolderData[] {
  const teamSlug = teamName.toLowerCase().replace(/\s+/g, "-")
  const baseId = `${parentId}-${year}-${teamSlug}`

  const createStandardSubfolders = (sectionId: string): FolderData[] =>
    [
      { name: "Games" },
      { name: "Breakdown Games" },
      { name: "Cutups" },
      { name: "Meetings" },
      { name: "Practice 01" },
      { name: "Practice 02" },
      { name: "Practice 03" },
    ].map((f, i) => ({
      id: `${sectionId}-${i}`,
      name: f.name,
      dateModified: `Dec 14, ${year}`,
      items: generateLeafItems(year, `${sectionId}-${i}`),
    }))

  const structure: { name: string; children?: FolderData[] }[] = [
    { name: "Masters Work" },
    { name: "Meeting Masters" },
    { name: "Practice Masters" },
    { name: "Offensive Reporting" },
    { name: "Special Teams Reporting" },
    {
      name: "Offense Share",
      children: createStandardSubfolders(`${baseId}-off`),
    },
    {
      name: "Defense Share",
      children: createStandardSubfolders(`${baseId}-def`),
    },
    {
      name: "Special Teams Share",
      children: createStandardSubfolders(`${baseId}-st`),
    },
    { name: "Work" },
  ]

  return structure.map((f, i) => {
    const id = `${baseId}-${i}`
    return {
      id,
      name: f.name,
      dateModified: `Dec 14, ${year}`,
      children: f.children,
      items: f.children ? undefined : generateLeafItems(year, id),
    }
  })
}

function createTeamStructure(teamName: string, teamNickname: string): FolderData {
  const years: FolderData[] = []
  const teamId = teamName.toLowerCase().replace(/\s+/g, "-")

  for (let year = 2023; year <= 2025; year++) {
    const yearId = `${teamId}-${year}`
    years.push({
      id: yearId,
      name: `${year} ${teamNickname}`,
      dateModified: `Dec 14, ${year}`,
      children: createDetailedOpponentStructure(year, teamNickname, yearId),
    })
  }

  return {
    id: teamId,
    name: teamName,
    dateModified: "Dec 14, 2024",
    children: years,
  }
}

function createCollegeScoutingStructure(yearRange: string): FolderData[] {
  const parentId = `scouting-${yearRange}`
  const yearStr = yearRange.split("-")[1] || "2025"
  const year = Number.parseInt(yearStr)

  const createSchoolFolders = (prefix: string): FolderData[] => {
    const schools = [
      "A Schools",
      "C Schools",
      "D Schools",
      "F Schools",
      "G Schools",
      "H Schools",
      "I Schools",
      "K Schools",
      "L Schools",
      "M Schools",
      "N Schools",
      "O Schools",
      "P Schools",
      "R Schools",
      "S Schools",
      "T Schools",
      "U Schools",
      "V Schools",
      "W Schools",
    ]
    return schools.map((school, i) => ({
      id: `${prefix}-${i}`,
      name: school,
      dateModified: "Feb 15, 2025",
      items: generateLeafItems(year, `${prefix}-${i}`, 2),
    }))
  }

  interface ScoutingFolder {
    name: string
    items?: boolean
    children?: ScoutingFolder[]
  }

  const structure: ScoutingFolder[] = [
    { name: "Masters", items: true },
    { name: "Masters Working", items: true },
    {
      name: "College Games",
      children: [
        { name: "Division I", children: createSchoolFolders(`${parentId}-div1`) as unknown as ScoutingFolder[] },
        {
          name: "Division II - Others",
          children: createSchoolFolders(`${parentId}-div2`) as unknown as ScoutingFolder[],
        },
      ],
    },
    {
      name: "All Star Games",
      children: [
        {
          name: "Senior Bowl",
          children: [
            { name: "Hot Folder", items: true },
            { name: "Game", items: true },
            { name: "American Team Practice", items: true },
            { name: "National Team Practice", items: true },
            { name: "TV Content", items: true },
            { name: "American Player Profiles", items: true },
            { name: "National Player Profiles", items: true },
          ],
        },
        {
          name: "East-West Shrine Bowl",
          children: [
            { name: "Hot Folder", items: true },
            { name: "Game", items: true },
            { name: "East Team Practice", items: true },
            { name: "West Team Practice", items: true },
          ],
        },
        { name: "Hula Bowl", items: true },
        { name: "Tropical Bowl", items: true },
        { name: "HBCU Legacy Bowl", items: true },
        { name: "FCS Bowl", items: true },
        { name: "College Gridiron Showcase", items: true },
      ],
    },
    {
      name: "Combine",
      children: [
        { name: "Informal Interviews", items: true },
        { name: "Position Workouts", items: true },
        { name: "TV Broadcast", items: true },
        { name: "International Pipeline Players", items: true },
      ],
    },
    { name: "Pro Days", items: true },
    {
      name: "NFL Games",
      children: [
        "ARZ O-D-K",
        "ATL O-D-K",
        "BLT O-D-K",
        "BUF O-D-K",
        "CAR O-D-K",
        "CHI O-D-K",
        "CIN O-D-K",
        "CLV O-D-K",
        "DAL O-D-K",
        "DEN O-D-K",
        "DET O-D-K",
        "GB O-D-K",
        "HST O-D-K",
        "IND O-D-K",
        "JAX O-D-K",
        "KC O-D-K",
        "LA O-D-K",
        "LAC O-D-K",
        "LV O-D-K",
        "MIA O-D-K",
        "MIN O-D-K",
        "NE O-D-K",
        "NO O-D-K",
        "NYG O-D-K",
        "NYJ O-D-K",
        "PHI O-D-K",
        "PIT O-D-K",
        "SEA O-D-K",
        "SF O-D-K",
        "TB O-D-K",
        "TEN O-D-K",
        "WAS O-D-K",
      ].map((n) => ({ name: n, items: true })),
    },
    {
      name: "CFL Games",
      children: [
        "British Columbia",
        "Calgary",
        "Edmonton",
        "Hamilton",
        "Montreal",
        "Ottawa",
        "Saskatchewan",
        "Toronto",
        "Winnipeg",
      ].map((n) => ({ name: n, items: true })),
    },
    { name: "UFL Games", items: true },
    { name: "FA Workouts", items: true },
    { name: "NFS Cutups", items: true },
  ]

  return structure.map((f, i) => {
    const id = `${parentId}-${i}`

    let children: FolderData[] | undefined = undefined
    if (f.children) {
      children = f.children.map((c, j) => {
        const childId = `${id}-${j}`
        const grandChildren = (c as ScoutingFolder).children
          ? (c as ScoutingFolder).children!.map((gc, k) => ({
              id: `${childId}-${k}`,
              name: gc.name,
              dateModified: `Feb 8, ${year}`,
              items: gc.items ? generateLeafItems(year, `${childId}-${k}`) : undefined,
              children: (gc as ScoutingFolder).children as FolderData[] | undefined,
            }))
          : undefined

        return {
          id: childId,
          name: c.name,
          dateModified: `Feb 8, ${year}`,
          items: c.items ? generateLeafItems(year, childId) : undefined,
          children: grandChildren,
        }
      }) as FolderData[]
    }

    return {
      id,
      name: f.name,
      dateModified: `Feb 8, ${year}`,
      items: f.items ? generateLeafItems(year, id) : undefined,
      children,
    }
  })
}

function createScoutingFolders(): FolderData[] {
  const folders: FolderData[] = []
  for (let year = 2026; year >= 2024; year--) {
    const yearRange = `${year - 1}-${year}`
    folders.push({
      id: `scouting-${yearRange}`,
      name: yearRange,
      dateModified: `May 15, ${year}`,
      children: createCollegeScoutingStructure(yearRange),
    })
  }
  return folders
}

const generateRamsLibrary = (): FolderData[] => {
  return [
    {
      id: "self-scout",
      name: "Self Scout",
      dateModified: "Dec 15, 2024",
      createdDate: "Sep 1, 2010",
      children: createSelfScoutYearFolders(),
    },
    {
      id: "opponent-scout",
      name: "Opponent Scout",
      dateModified: "Dec 14, 2024",
      children: [
        createTeamStructure("Arizona Cardinals", "Cardinals"),
        createTeamStructure("Atlanta Falcons", "Falcons"),
        createTeamStructure("Baltimore Ravens", "Ravens"),
        createTeamStructure("Buffalo Bills", "Bills"),
        createTeamStructure("Carolina Panthers", "Panthers"),
        createTeamStructure("Chicago Bears", "Bears"),
        createTeamStructure("Cincinnati Bengals", "Bengals"),
        createTeamStructure("Cleveland Browns", "Browns"),
        createTeamStructure("Dallas Cowboys", "Cowboys"),
        createTeamStructure("Denver Broncos", "Broncos"),
        createTeamStructure("Detroit Lions", "Lions"),
        createTeamStructure("Green Bay Packers", "Packers"),
        createTeamStructure("Houston Texans", "Texans"),
        createTeamStructure("Indianapolis Colts", "Colts"),
        createTeamStructure("Jacksonville Jaguars", "Jaguars"),
        createTeamStructure("Kansas City Chiefs", "Chiefs"),
        createTeamStructure("Las Vegas Raiders", "Raiders"),
        createTeamStructure("Los Angeles Chargers", "Chargers"),
        createTeamStructure("Miami Dolphins", "Dolphins"),
        createTeamStructure("Minnesota Vikings", "Vikings"),
        createTeamStructure("New England Patriots", "Patriots"),
        createTeamStructure("New Orleans Saints", "Saints"),
        createTeamStructure("New York Giants", "Giants"),
        createTeamStructure("New York Jets", "Jets"),
        createTeamStructure("Philadelphia Eagles", "Eagles"),
        createTeamStructure("Pittsburgh Steelers", "Steelers"),
        createTeamStructure("San Francisco 49ers", "49ers"),
        createTeamStructure("Seattle Seahawks", "Seahawks"),
        createTeamStructure("Tampa Bay Buccaneers", "Buccaneers"),
        createTeamStructure("Tennessee Titans", "Titans"),
        createTeamStructure("Washington Commanders", "Commanders"),
      ],
    },
    {
      id: "scouting",
      name: "Scouting",
      dateModified: "Dec 13, 2024",
      children: createScoutingFolders(),
    },
    // --- EMPTY ROOT FOLDERS (No items, just structure) ---
    {
      id: "visitor-share",
      name: "Visitor Share",
      dateModified: "Dec 12, 2024",
      items: [], // Removed items
    },
    {
      id: "practice",
      name: "Practice",
      dateModified: "Dec 11, 2024",
      items: [], // Removed items
    },
    {
      id: "cge-network",
      name: "CGE Network",
      dateModified: "Dec 10, 2024",
      items: [], // Removed items
    },
    {
      id: "coaches-project",
      name: "Coaches Project",
      dateModified: "Dec 9, 2024",
      items: [], // Removed items
    },
    {
      id: "special-projects",
      name: "Special Projects",
      dateModified: "Dec 8, 2024",
      items: [], // Removed items
    },
    {
      id: "offense-play-concepts",
      name: "99-05_OFFENSE Play Concepts",
      dateModified: "Dec 7, 2024",
      items: [], // Removed items
    },
    {
      id: "analytics",
      name: "PERFORMANCE ANALYTICS",
      dateModified: "Dec 6, 2024",
      items: [], // Removed items
    },
  ]
}

// --- CONTEXT ---

export interface RecentPlaylist {
  id: string
  name: string
  folderId: string | null
}

interface LibraryContextType {
  columns: Column[]
  sort: { columnId: string; direction: SortDirection }
  folderOrder: Record<string, string[]>
  activeWatchItemId: string | null
  activeWatchItems: string[]
  renamingId: string | null
  folders: FolderData[]
  rootItems: LibraryItemData[]
  libraryView: "team" | "my"
  selectedFolders: Set<string>
  selectedItems: Set<string>
  expandedFolders: Set<string>
  currentFolderId: string | null
  breadcrumbs: Array<{ id: string; name: string }>
  clipboard: { mode: "full" | "structure"; data: FolderData } | null
  viewMode: "folder" | "schedule"
  scheduleFolders: FolderData[]
  isMoveModalOpen: boolean
  itemsToMove: MoveItem[]
  isPermissionsModalOpen: boolean
  itemForPermissions: string | null
  layoutMode: "list" | "grid"
  isCreatePlaylistModalOpen: boolean
  pendingPlaylistItems: LibraryItemData[]
  pendingPlaylistClips: ClipData[]
  pendingPreviewClips: ClipData[]
  pendingPreviewName: string | null
  setPendingPreviewClips: (clips: ClipData[], name?: string) => void
  recentPlaylists: RecentPlaylist[]
  addToPlaylist: (playlistId: string, clipIds: string[]) => void
  setSort: (columnId: string) => void
  toggleColumnVisibility: (columnId: string) => void
  setColumns: (columns: Column[]) => void
  updateFolderOrder: (parentId: string, newOrder: string[]) => void
  resizeColumn: (columnId: string, width: number) => void
  moveColumn: (dragIndex: number, hoverIndex: number) => void
  setWatchItem: (itemId: string | null) => void
  setWatchItems: (ids: string[]) => void
  setRenamingId: (id: string | null) => void
  setFolders: React.Dispatch<React.SetStateAction<FolderData[]>>
  setLibraryView: (view: "team" | "my") => void
  setSelectedFolders: (ids: Set<string>) => void
  setSelectedItems: (ids: Set<string>) => void
  setExpandedFolders: (ids: Set<string>) => void
  setCurrentFolderId: (id: string | null) => void
  setBreadcrumbs: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string }>>>
  navigateToFolder: (folderId: string | null) => void
  copyFolder: (id: string, mode: "full" | "structure") => void
  pasteFolder: (targetId: string) => void
  setFolderColor: (folderId: string, color: string | null) => void
  setViewMode: (mode: "folder" | "schedule") => void
  openMoveModal: (items: MoveItem[]) => void
  closeMoveModal: () => void
  moveItemsToFolder: (targetFolderId: string) => void
  createSubfolderInMove: (parentId: string | null, name: string) => string
  openPermissionsModal: (id: string) => void
  closePermissionsModal: () => void
  setLayoutMode: (mode: "list" | "grid") => void
  onPlaylistCreatedCallback: ((createdId: string) => void) | null
  openCreatePlaylistModal: (initialItems?: LibraryItemData[], initialClips?: ClipData[], onCreated?: (createdId: string) => void) => void
  closeCreatePlaylistModal: () => void
  createPlaylist: (targetFolderId: string | null, name: string, initialClips?: ClipData[]) => string
  clearPendingPlaylistItems: () => void

  // --- Segregated Data/Structure model ---
  mediaItems: MediaItemData[]
  getMediaItemsByFolderId: (folderId: string | null) => MediaItemData[]
  getMediaItem: (id: string) => MediaItemData | undefined
  addClipsToPlaylist: (playlistId: string, clips: ClipData[]) => void
  removeClipsFromPlaylist: (playlistId: string, clipIds: string[]) => void
  deleteMediaItem: (itemId: string) => void
  moveMediaItem: (itemId: string, newParentId: string | null) => void
}

export interface MoveItem {
  id: string
  type: "folder" | "item"
}

const defaultColumns: Column[] = [
  { id: "name", label: "Name", visible: true, width: 300, align: "left", fixed: true },
  { id: "dateModified", label: "Modified", visible: true, width: 120, align: "left" },
  { id: "type", label: "Type", visible: true, width: 80, align: "left" },
  { id: "hasData", label: "Data", visible: true, width: 60, align: "center" },
  { id: "itemCount", label: "Items", visible: true, width: 80, align: "left" },
  { id: "angles", label: "Angles", visible: true, width: 80, align: "left" },
  { id: "duration", label: "Duration", visible: true, width: 90, align: "left" },
  { id: "size", label: "Size", visible: true, width: 90, align: "left" },
  { id: "comments", label: "Comments", visible: true, width: 100, align: "left" },
  { id: "createdDate", label: "Created", visible: true, width: 120, align: "left" },
]

const LibraryContext = createContext<LibraryContextType | undefined>(undefined)

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [columns, setColumns] = useState<Column[]>(defaultColumns)
  const [sort, setSortState] = useState<{ columnId: string; direction: SortDirection }>({
    columnId: "",
    direction: null,
  })
  const [folderOrder, setFolderOrder] = useState<Record<string, string[]>>({})
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeWatchItemId, setActiveWatchItemId] = useState<string | null>(null)
  const [activeWatchItems, setActiveWatchItems] = useState<string[]>([])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [clipboard, setClipboard] = useState<{ mode: "full" | "structure"; data: FolderData } | null>(null)
  const [folderColors, setFolderColors] = useState<Record<string, string | null>>({})
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list")
  const [pendingPlaylistItems, setPendingPlaylistItems] = useState<LibraryItemData[]>([])
  const [pendingPlaylistClips, setPendingPlaylistClips] = useState<ClipData[]>([])
  const [onPlaylistCreatedCallback, setOnPlaylistCreatedCallback] = useState<((createdId: string) => void) | null>(null)
  const [pendingPreviewClips, setPendingPreviewClipsState] = useState<ClipData[]>([])
  const [pendingPreviewName, setPendingPreviewName] = useState<string | null>(null)
  const [recentPlaylists, setRecentPlaylists] = useState<RecentPlaylist[]>([])
  
  // Wrapper to set both clips and name
  const setPendingPreviewClips = (clips: ClipData[], name?: string) => {
    setPendingPreviewClipsState(clips)
    setPendingPreviewName(name || null)
  }

  // --- Segregated Data/Structure hooks ---
  const {
    mediaItems,
    createMediaItem,
    addClipsToMediaItem,
    removeClipsFromMediaItem,
    moveMediaItem: moveMediaItemHook,
    deleteMediaItem: deleteMediaItemHook,
    getMediaItemsByFolderId,
    getMediaItem,
  } = useMediaItems()

  const [folders, setFolders] = useState<FolderData[]>(generateRamsLibrary())
  const [rootItems, setRootItems] = useState<LibraryItemData[]>([])
  const [libraryView, setLibraryView] = useState<"team" | "my">("team")
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([])

  // Build the breadcrumb trail for a given folder by walking the folder tree
  const buildBreadcrumbsFromFolders = (folderId: string, folderTree: FolderData[]): Array<{ id: string; name: string }> => {
    const path: Array<{ id: string; name: string }> = []
    const findPath = (
      items: FolderData[],
      targetId: string,
      currentPath: Array<{ id: string; name: string }>,
    ): boolean => {
      for (const folder of items) {
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
    findPath(folderTree, folderId, [])
    return path
  }

  const navigateToFolder = (folderId: string | null) => {
    if (folderId === null) {
      setCurrentFolderId(null)
      setBreadcrumbs([])
    } else {
      setCurrentFolderId(folderId)
      setBreadcrumbs(buildBreadcrumbsFromFolders(folderId, folders))
    }
  }

  const [viewMode, setViewModeState] = useState<"folder" | "schedule">("folder")

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [itemsToMove, setItemsToMove] = useState<MoveItem[]>([])

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [itemForPermissions, setItemForPermissions] = useState<string | null>(null)
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false)

  const foldersWithColors = useMemo(() => {
    return folders.map((folder) => ({
      ...folder,
      color: folderColors[folder.id],
    }))
  }, [folders, folderColors])

  const scheduleFolders = useMemo(() => {
    // 1. Flatten all items first (including root items)
    const allItems: LibraryItemData[] = [...rootItems]
    const traverse = (nodes: FolderData[]) => {
      nodes.forEach((node) => {
        if (node.items) allItems.push(...node.items)
        if (node.children) traverse(node.children)
      })
    }
    traverse(folders)

    // 2. Generate Seasons (last 3 years)
    const seasons = [2025, 2024, 2023]

    // 3. Use a seeded shuffle for consistent ordering per session
    const shuffleArray = <T,>(arr: T[], seed: number): T[] => {
      const result = [...arr]
      let m = result.length
      while (m) {
        const i = Math.floor(((seed = (seed * 9301 + 49297) % 233280) / 233280) * m--)
        ;[result[m], result[i]] = [result[i], result[m]]
      }
      return result
    }

    const seasonFolders = seasons.map((year) => {
      const seasonName = `${year}-${year + 1}`

      // 4. Generate exactly 18 Opponents per season using shuffled TEAMS
      const seasonOpponents = shuffleArray([...TEAMS], year).slice(0, 18)

      const opponentFolders = seasonOpponents.map((team, index) => {
        const weekNum = index + 1
        const opponentName = `Week ${weekNum} vs ${team}`

        // 5. Find items that match this Year AND Team
        const relevantItems = allItems.filter((item) => {
          // Check Year (match year in createdDate or name)
          const yearStr = year.toString()
          const shortYear = yearStr.slice(-2)
          const itemYear =
            item.createdDate?.includes(yearStr) ||
            item.createdDate?.includes(`, ${year}`) ||
            item.name.includes(`/${shortYear} `) ||
            item.name.includes(`/${shortYear}`)

          // Check Team Name (does item name contain the team abbreviation?)
          const itemTeam = item.name.includes(team)

          return itemYear && itemTeam
        })

        // 6. Create the 4 Mandatory Sub-folders (always present, even if empty)
        const categories = [
          { name: "Game Footage", typeMatch: "Game" },
          { name: "Practice", typeMatch: "Practice" },
          { name: "Opponent Scout", typeMatch: "Scout" },
          { name: "Playlists", typeMatch: "Playlist" },
        ]

        const categoryFolders: FolderData[] = categories.map((cat) => {
          // Filter items for this specific category
          const catItems = relevantItems.filter((item) => {
            if (cat.typeMatch === "Game") {
              return !item.name.toLowerCase().includes("practice") && item.type !== "playlist"
            }
            if (cat.typeMatch === "Practice") {
              return item.name.toLowerCase().includes("practice")
            }
            if (cat.typeMatch === "Scout") {
              return item.type === "scout"
            }
            if (cat.typeMatch === "Playlist") {
              return item.type === "playlist"
            }
            return false
          })

          return {
            id: `cat-${seasonName}-${team}-${cat.name.replace(/\s+/g, "-").toLowerCase()}`,
            name: cat.name,
            icon: "folder" as const,
            isSystemGroup: true,
            items: catItems.slice(0, 10),
            dateModified: `Sep ${10 + index}, ${year}`,
          }
        })

        return {
          id: `opp-${seasonName}-${team}`,
          name: opponentName,
          icon: "user" as const,
          isSystemGroup: true,
          children: categoryFolders,
          dateModified: `Sep ${10 + index}, ${year}`,
        }
      })

      return {
        id: `season-${seasonName}`,
        name: seasonName,
        icon: "calendar" as const,
        isSystemGroup: true,
        children: opponentFolders,
        dateModified: `Aug 01, ${year}`,
      }
    })

    // 7. Add "Other Items" Group at the end
    const otherItemsFolder: FolderData = {
      id: "other-items",
      name: "Other Items",
      icon: "folder" as const,
      isSystemGroup: true,
      children: [
        { id: "end-season", name: "End of Season Analysis", icon: "folder" as const, isSystemGroup: true, items: [] },
        { id: "clinics", name: "Clinics", icon: "folder" as const, isSystemGroup: true, items: [] },
        { id: "misc", name: "Misc", icon: "folder" as const, isSystemGroup: true, items: [] },
        { id: "mobile", name: "Mobile Uploads", icon: "folder" as const, isSystemGroup: true, items: [] },
      ],
    }

    return [...seasonFolders, otherItemsFolder]
  }, [folders, rootItems])

  useEffect(() => {
    try {
      const savedColumnOrder = localStorage.getItem("library_column_order")
      const savedFolderOrder = localStorage.getItem("library_folder_order")
      const savedFolderColors = localStorage.getItem("library_folder_colors")

      if (savedColumnOrder) {
        const orderIds = JSON.parse(savedColumnOrder) as string[]
        const reordered: Column[] = []
        orderIds.forEach((id) => {
          const def = defaultColumns.find((c) => c.id === id)
          if (def) reordered.push({ ...def })
        })
        defaultColumns.forEach((def) => {
          if (!reordered.find((c) => c.id === def.id)) {
            reordered.push({ ...def })
          }
        })
        setColumns(reordered)
      } else {
        setColumns(defaultColumns.map((c) => ({ ...c })))
      }

      if (savedFolderOrder) {
        setFolderOrder(JSON.parse(savedFolderOrder))
      }

      if (savedFolderColors) {
        setFolderColors(JSON.parse(savedFolderColors))
      }
    } catch (e) {
      console.error("Failed to load library settings", e)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      const orderIds = columns.map((c) => c.id)
      localStorage.setItem("library_column_order", JSON.stringify(orderIds))
      localStorage.setItem("library_folder_order", JSON.stringify(folderOrder))
      localStorage.setItem("library_folder_colors", JSON.stringify(folderColors))
    }
  }, [columns, folderOrder, folderColors, isLoaded])

  const setSort = (columnId: string) => {
    setSortState((prev) => {
      if (prev.columnId === columnId) {
        if (prev.direction === "asc") return { columnId, direction: "desc" }
        if (prev.direction === "desc") return { columnId: "", direction: null }
      }
      return { columnId, direction: "asc" }
    })
  }

  const toggleColumnVisibility = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === columnId) {
          return { ...col, visible: !col.visible }
        }
        return col
      }),
    )
  }

  const updateFolderOrder = (parentId: string, newOrder: string[]) => {
    setFolderOrder((prev) => ({
      ...prev,
      [parentId]: newOrder,
    }))
  }

  const resizeColumn = (columnId: string, newWidth: number) => {
    setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, width: Math.max(50, newWidth) } : col)))
  }

  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    setColumns((prev) => {
      const newCols = [...prev]
      const targetCol = newCols[hoverIndex]
      const draggedCol = newCols[dragIndex]
      if (targetCol.fixed || draggedCol.fixed) return prev
      const [removed] = newCols.splice(dragIndex, 1)
      newCols.splice(hoverIndex, 0, removed)
      return newCols
    })
  }

  const setWatchItem = (itemId: string | null) => {
    setActiveWatchItemId(itemId)
  }

  const setWatchItems = (ids: string[]) => {
    setActiveWatchItems(ids)
  }

  const copyFolder = (id: string, mode: "full" | "structure") => {
    // Recursive finder
    const findFolder = (nodes: FolderData[]): FolderData | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findFolder(node.children)
          if (found) return found
        }
      }
      return null
    }

    const folderToCopy = findFolder(folders)
    if (!folderToCopy) return

    // Deep Clone
    const clone = JSON.parse(JSON.stringify(folderToCopy)) as FolderData

    // If Structure mode, strip items recursively
    if (mode === "structure") {
      const stripItems = (node: FolderData) => {
        node.items = []
        if (node.children) {
          node.children.forEach(stripItems)
        }
      }
      stripItems(clone)
    }

    setClipboard({ mode, data: clone })
  }

  const pasteFolder = (targetId: string) => {
    if (!clipboard) return

    // Recursive ID Regenerator to avoid duplicates
    const regenerateIds = (node: FolderData): FolderData => {
      const newNode = { ...node }
      newNode.id = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      if (newNode.items) {
        newNode.items = newNode.items.map((item) => ({
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }))
      }

      if (newNode.children) {
        newNode.children = newNode.children.map(regenerateIds)
      }
      return newNode
    }

    const payload = regenerateIds(clipboard.data)
    // Append "Copy" to top level name to distinguish
    payload.name = `${clipboard.data.name} (Copy)`

    // Insert into folders tree
    setFolders((prev) => {
      const newFolders = JSON.parse(JSON.stringify(prev)) as FolderData[]

      const insertInto = (nodes: FolderData[]): boolean => {
        for (const node of nodes) {
          if (node.id === targetId) {
            node.children = node.children || []
            node.children.push(payload)
            return true
          }
          if (node.children) {
            if (insertInto(node.children)) return true
          }
        }
        return false
      }

      insertInto(newFolders)
      return newFolders
    })

    // Auto-expand the target folder
    setExpandedFolders((prev) => new Set(prev).add(targetId))
  }

  const setFolderColor = (folderId: string, color: string | null) => {
    setFolders((prevFolders) => {
      const updateRecursive = (nodes: FolderData[]): FolderData[] => {
        return nodes.map((node) => {
          if (node.id === folderId) {
            return { ...node, color: color === null ? undefined : color }
          }
          if (node.children) {
            return { ...node, children: updateRecursive(node.children) }
          }
          return node
        })
      }
      return updateRecursive(prevFolders)
    })
  }

  const openMoveModal = (items: MoveItem[]) => {
    setItemsToMove(items)
    setIsMoveModalOpen(true)
  }

  const closeMoveModal = () => {
    setIsMoveModalOpen(false)
    setItemsToMove([])
  }

  const moveItemsToFolder = (targetFolderId: string | null) => {
    // Deep clone folders for safe mutation
    const newFolders = JSON.parse(JSON.stringify(folders)) as FolderData[]
    // Deep clone root items
    const newRootItems = [...rootItems]

    // Check if trying to move a folder into itself or its descendant
    const isDescendantOf = (parentId: string, targetId: string): boolean => {
      const findInChildren = (folder: FolderData): boolean => {
        if (folder.id === targetId) return true
        if (folder.children) {
          return folder.children.some(findInChildren)
        }
        return false
      }

      const findFolder = (nodes: FolderData[]): FolderData | null => {
        for (const node of nodes) {
          if (node.id === parentId) return node
          if (node.children) {
            const found = findFolder(node.children)
            if (found) return found
          }
        }
        return null
      }

      const parent = findFolder(newFolders)
      if (!parent || !parent.children) return false
      return parent.children.some(findInChildren)
    }

    // 1. Find and remove items from their old locations, collect them
    const collectedData: (FolderData | LibraryItemData)[] = []

    const removeRecursive = (nodes: FolderData[]) => {
      for (const node of nodes) {
        // Remove children folders that are being moved
        if (node.children) {
          const foldersToRemove = node.children.filter((child) =>
            itemsToMove.some((m) => m.type === "folder" && m.id === child.id),
          )
          collectedData.push(...foldersToRemove)
          node.children = node.children.filter(
            (child) => !itemsToMove.some((m) => m.type === "folder" && m.id === child.id),
          )
          removeRecursive(node.children)
        }
        // Remove items that are being moved
        if (node.items) {
          const itemsToRemoveFromNode = node.items.filter((item) =>
            itemsToMove.some((m) => m.type === "item" && m.id === item.id),
          )
          collectedData.push(...itemsToRemoveFromNode)
          node.items = node.items.filter((item) => !itemsToMove.some((m) => m.type === "item" && m.id === item.id))
        }
      }
    }

    // Remove from Root Folders
    const rootFoldersToMove = newFolders.filter((f) => itemsToMove.some((m) => m.type === "folder" && m.id === f.id))
    collectedData.push(...rootFoldersToMove)
    const filteredRootFolders = newFolders.filter((f) => !itemsToMove.some((m) => m.type === "folder" && m.id === f.id))

    // Remove from Root Items
    const rootItemsToMove = newRootItems.filter((i) => itemsToMove.some((m) => m.type === "item" && m.id === i.id))
    collectedData.push(...rootItemsToMove)
    const filteredRootItems = newRootItems.filter((i) => !itemsToMove.some((m) => m.type === "item" && m.id === i.id))

    removeRecursive(filteredRootFolders)

    // Validate: don't move folder into itself or descendant
    if (targetFolderId !== null) {
      for (const item of itemsToMove) {
        if (item.type === "folder") {
          if (item.id === targetFolderId || isDescendantOf(item.id, targetFolderId)) {
            console.error("Cannot move folder into itself or its descendant")
            return
          }
        }
      }
    }

    // 2. Add to Target
    if (targetFolderId === null) {
      // Move to Root
      collectedData.forEach((item) => {
        if ("children" in item || (item as FolderData).children !== undefined) {
          // It's a folder
          filteredRootFolders.push(item as FolderData)
        } else {
          // It's an item (Now allowed at root!)
          filteredRootItems.push(item as LibraryItemData)
        }
      })

      setFolders(filteredRootFolders)
      setRootItems(filteredRootItems)

      setIsMoveModalOpen(false)
      setItemsToMove([])
      setSelectedFolders(new Set())
      setSelectedItems(new Set())
      return
    }

    // Move into specific folder
    const addToTarget = (nodes: FolderData[]): boolean => {
      for (const node of nodes) {
        if (node.id === targetFolderId) {
          collectedData.forEach((item) => {
            if (
              "children" in item ||
              (item as FolderData).children !== undefined ||
              !("type" in item) ||
              (item as any).type === undefined
            ) {
              // It's a folder (has children property or no type property like LibraryItemData)
              if (
                !("type" in item) ||
                typeof (item as any).type !== "string" ||
                !["video", "pdf", "image", "audio", "document"].includes((item as any).type)
              ) {
                if (!node.children) node.children = []
                node.children.push(item as FolderData)
              } else {
                // It's an item
                if (!node.items) node.items = []
                node.items.push(item as LibraryItemData)
              }
            } else {
              // It's an item
              if (!node.items) node.items = []
              node.items.push(item as LibraryItemData)
            }
          })
          return true
        }
        if (node.children && addToTarget(node.children)) return true
      }
      return false
    }

    addToTarget(filteredRootFolders)

    setFolders(filteredRootFolders)
    setRootItems(filteredRootItems)
    setIsMoveModalOpen(false)
    setItemsToMove([])

    // Clear selection
    setSelectedFolders(new Set())
    setSelectedItems(new Set())
  }

  const createSubfolderInMove = (parentId: string | null, name: string): string => {
    const newFolderId = `folder-${Date.now()}`
    const newFolder: FolderData = {
      id: newFolderId,
      name: name,
      children: [],
      items: [],
      createdDate: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    }

    setFolders((prev) => {
      const newFolders = JSON.parse(JSON.stringify(prev)) as FolderData[]

      // If parentId is null, add to root level
      if (parentId === null) {
        newFolders.push(newFolder)
        return newFolders
      }

      const addToParent = (nodes: FolderData[]): boolean => {
        for (const node of nodes) {
          if (node.id === parentId) {
            if (!node.children) node.children = []
            node.children.push(newFolder)
            return true
          }
          if (node.children && addToParent(node.children)) return true
        }
        return false
      }

      addToParent(newFolders)
      return newFolders
    })

    return newFolderId
  }

  const openPermissionsModal = (id: string) => {
    setItemForPermissions(id)
    setIsPermissionsModalOpen(true)
  }

  const closePermissionsModal = () => {
    setIsPermissionsModalOpen(false)
    setItemForPermissions(null)
  }

  const openCreatePlaylistModal = (initialItems?: LibraryItemData[], initialClips?: ClipData[], onCreated?: (createdId: string) => void) => {
    setPendingPlaylistItems(initialItems || [])
    setPendingPlaylistClips(initialClips || [])
    setOnPlaylistCreatedCallback(() => onCreated || null)
    setIsCreatePlaylistModalOpen(true)
  }
  const closeCreatePlaylistModal = () => {
    setIsCreatePlaylistModalOpen(false)
    setPendingPlaylistItems([])
    setPendingPlaylistClips([])
    setOnPlaylistCreatedCallback(null)
  }
  const clearPendingPlaylistItems = () => {
    setPendingPlaylistItems([])
    setPendingPlaylistClips([])
    setOnPlaylistCreatedCallback(null)
  }

  const createPlaylist = (targetFolderId: string | null, name: string, initialClips?: ClipData[]) => {
    // Determine which clips to seed: explicit initialClips > pendingPlaylistClips > pendingPlaylistItems (converted) > empty
    const seedClips: ClipData[] = initialClips
      ? initialClips
      : pendingPlaylistClips.length > 0
        ? pendingPlaylistClips
        : pendingPlaylistItems.length > 0
          ? pendingPlaylistItems.map((item, idx) => ({
              id: `clip-${Date.now()}-${idx}`,
              game: item.name,
              duration: item.duration ? parseFloat(item.duration) : undefined,
            } as ClipData))
          : []

    // Create via the flat media-items list (copy-on-add happens inside the hook)
    const created = createMediaItem(name, targetFolderId, seedClips)

    // Also insert a matching LibraryItemData into the folder/root tree so the
    // existing folder UI continues to render it alongside static data.
    const newPlaylist: LibraryItemData = {
      id: created.id,
      name: name,
      type: "playlist",
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      dateModified: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      itemCount: seedClips.length,
      thumbnailUrl: "/placeholder-logo.png",
      items: pendingPlaylistItems,
    }

    if (targetFolderId === null) {
      setRootItems((prev) => [...prev, newPlaylist])
    } else {
      setFolders((prev) => {
        const updateRecursive = (nodes: FolderData[]): FolderData[] => {
          return nodes.map((node) => {
            if (node.id === targetFolderId) {
              return { ...node, items: [...(node.items || []), newPlaylist] }
            }
            if (node.children) {
              return { ...node, children: updateRecursive(node.children) }
            }
            return node
          })
        }
        return updateRecursive(prev)
      })
    }
    closeCreatePlaylistModal()
    return created.id
  }

  const addToPlaylist = (playlistId: string, clipIds: string[]) => {
    // Find the playlist in folders or rootItems
    let playlistName = ""
    let playlistFolderId: string | null = null

    // Search in rootItems first
    const rootPlaylist = rootItems.find(item => item.id === playlistId && item.type === "playlist")
    if (rootPlaylist) {
      playlistName = rootPlaylist.name
      playlistFolderId = null
    } else {
      // Search recursively in folders
      const findPlaylist = (nodes: FolderData[], parentId: string | null): { name: string; folderId: string | null } | null => {
        for (const node of nodes) {
          if (node.items) {
            const playlist = node.items.find(item => item.id === playlistId && item.type === "playlist")
            if (playlist) {
              return { name: playlist.name, folderId: node.id }
            }
          }
          if (node.children) {
            const found = findPlaylist(node.children, node.id)
            if (found) return found
          }
        }
        return null
      }
      const found = findPlaylist(folders, null)
      if (found) {
        playlistName = found.name
        playlistFolderId = found.folderId
      }
    }

    // Update recent playlists (keep last 5, most recent first)
    if (playlistName) {
      setRecentPlaylists(prev => {
        const filtered = prev.filter(p => p.id !== playlistId)
        return [{ id: playlistId, name: playlistName, folderId: playlistFolderId }, ...filtered].slice(0, 5)
      })
    }
  }

  // --- Clip-level helpers (delegate to useMediaItems) ---

  /** Add clips to a playlist using Copy on Add (new unique IDs). */
  const addClipsToPlaylist = (playlistId: string, clips: ClipData[]) => {
    addClipsToMediaItem(playlistId, clips)

    // Also update the itemCount on the legacy folder-tree representation
    const updateCount = (items: LibraryItemData[]): LibraryItemData[] =>
      items.map((item) =>
        item.id === playlistId ? { ...item, itemCount: (item.itemCount ?? 0) + clips.length } : item,
      )

    setRootItems((prev) => updateCount(prev))
    setFolders((prev) => {
      const walk = (nodes: FolderData[]): FolderData[] =>
        nodes.map((node) => ({
          ...node,
          items: node.items ? updateCount(node.items) : node.items,
          children: node.children ? walk(node.children) : node.children,
        }))
      return walk(prev)
    })
  }

  /** Remove clips from a playlist by id. */
  const removeClipsFromPlaylist = (playlistId: string, clipIds: string[]) => {
    removeClipsFromMediaItem(playlistId, clipIds)
  }

  /** Move a media item to a different folder. */
  const moveMediaItem = (itemId: string, newParentId: string | null) => {
    moveMediaItemHook(itemId, newParentId)
  }

  /** Delete a media item entirely. */
  const deleteMediaItem = (itemId: string) => {
    deleteMediaItemHook(itemId)
    // Also remove from legacy folder tree / rootItems
    setRootItems((prev) => prev.filter((item) => item.id !== itemId))
    setFolders((prev) => {
      const walk = (nodes: FolderData[]): FolderData[] =>
        nodes.map((node) => ({
          ...node,
          items: node.items ? node.items.filter((item) => item.id !== itemId) : node.items,
          children: node.children ? walk(node.children) : node.children,
        }))
      return walk(prev)
    })
  }

  const handleSetViewMode = (mode: "folder" | "schedule") => {
    setViewModeState(mode)
    // Reset Navigation
    setCurrentFolderId(null)
    setBreadcrumbs([])
    // Reset Selection & Expansion
    setSelectedFolders(new Set())
    setSelectedItems(new Set())
    setExpandedFolders(new Set())
  }

  const setViewMode = (mode: "folder" | "schedule") => {
    handleSetViewMode(mode)
  }

  return (
    <LibraryContext.Provider
      value={{
        columns,
        sort,
        folderOrder,
        activeWatchItemId,
        activeWatchItems,
        renamingId,
        folders: foldersWithColors,
        rootItems,
        libraryView,
        selectedFolders,
        selectedItems,
        expandedFolders,
        currentFolderId,
        breadcrumbs,
        clipboard,
        viewMode,
        scheduleFolders,
        isMoveModalOpen,
        itemsToMove,
        isPermissionsModalOpen,
        itemForPermissions,
        layoutMode,
        isCreatePlaylistModalOpen,
        pendingPlaylistItems,
        pendingPlaylistClips,
        pendingPreviewClips,
        pendingPreviewName,
        setPendingPreviewClips,
        recentPlaylists,
        addToPlaylist,
        setSort,
        toggleColumnVisibility,
        setColumns,
        updateFolderOrder,
        resizeColumn,
        moveColumn,
        setWatchItem,
        setWatchItems,
        setRenamingId,
        setFolders,
        setLibraryView,
        setSelectedFolders,
        setSelectedItems,
        setExpandedFolders,
        setCurrentFolderId,
        setBreadcrumbs,
        navigateToFolder,
        copyFolder,
        pasteFolder,
        setFolderColor,
        setViewMode: handleSetViewMode,
        openMoveModal,
        closeMoveModal,
        moveItemsToFolder,
        createSubfolderInMove,
        openPermissionsModal,
        closePermissionsModal,
        setLayoutMode,
        onPlaylistCreatedCallback,
        openCreatePlaylistModal,
        closeCreatePlaylistModal,
  createPlaylist,
  clearPendingPlaylistItems,

  // Segregated Data/Structure model
  mediaItems,
  getMediaItemsByFolderId,
  getMediaItem,
  addClipsToPlaylist,
  removeClipsFromPlaylist,
  deleteMediaItem,
  moveMediaItem,
  }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibraryContext() {
  const context = useContext(LibraryContext)
  if (context === undefined) {
    throw new Error("useLibraryContext must be used within a LibraryProvider")
  }
  return context
}

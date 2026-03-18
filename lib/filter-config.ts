// ---------------------------------------------------------------------------
// Filter configuration — single source of truth for every filter definition
// used by <FiltersModule>.
// ---------------------------------------------------------------------------

import type { FilterCategory, RangeCategory } from "@/types/filters"

// ---- Type definitions -----------------------------------------------------

/** A simple toggle chip (e.g. "1st", "2nd", "3rd", "4th") */
export interface ToggleItem {
  value: string
  label: string
}

/** A toggle-group filter: renders a row of toggle chips */
export interface ToggleFilterDef {
  type: "toggle"
  label: string
  count?: number
  category: FilterCategory
  allValues: string[]
  /** Groups of toggle items – each inner array renders as its own row. */
  groups: ToggleItem[][]
}

/** A toggle-group filter that also drives an associated range slider */
export interface ToggleWithRangeFilterDef {
  type: "toggleWithRange"
  label: string
  count?: number
  category: FilterCategory
  allValues: string[]
  /** Toggle chip groups */
  groups: ToggleItem[][]
  /** Map from chip value → [min, max] used to union-compute the slider */
  rangeMap: Record<string, [number, number]>
  /** Key used for the range state in `rangeFilters` */
  rangeCategory: RangeCategory
  /** Default slider range */
  rangeDefault: [number, number]
  /** Slider min/max */
  rangeMin: number
  rangeMax: number
}

/** A standalone range slider (e.g. "Yard line") */
export interface RangeFilterDef {
  type: "range"
  label: string
  count?: number
  rangeCategory: RangeCategory
  rangeDefault: [number, number]
  rangeMin: number
  rangeMax: number
}

/** A simple boolean toggle (renders only a circle checkbox, no children) */
export interface BooleanFilterDef {
  type: "boolean"
  label: string
  count?: number
}

/** A select dropdown filter */
export interface SelectFilterDef {
  type: "select"
  label: string
  count?: number
  placeholder: string
  options: { value: string; label: string }[]
}

export type FilterDef =
  | ToggleFilterDef
  | ToggleWithRangeFilterDef
  | RangeFilterDef
  | BooleanFilterDef
  | SelectFilterDef

export interface FilterSubsection {
  subsectionLabel?: string
  filters: FilterDef[]
}

export interface FilterSection {
  key: string
  title: string
  subsections: FilterSubsection[]
}

// ---- Range defaults -------------------------------------------------------

export const RANGE_DEFAULTS = {
  distanceRange: { min: 0, max: 100, default: [0, 100] as [number, number] },
  yardLine: { min: 0, max: 100, default: [0, 100] as [number, number] },
  yardsAfterContactRange: { min: 0, max: 100, default: [0, 100] as [number, number] },
  puntReturnRange: { min: 0, max: 100, default: [0, 100] as [number, number] },
  kickoffReturnRange: { min: 0, max: 100, default: [0, 100] as [number, number] },
  epaRange: { min: -4, max: 5, default: [-4, 5] as [number, number] },
} as const

// ---- Shared chip sets (reused across multiple filter defs) -----------------

const SHORT_MEDIUM_LONG_1: ToggleItem[] = [
  { value: "Short: 1-3", label: "Short: 1-3" },
  { value: "Medium: 4-7", label: "Medium: 4-7" },
  { value: "Long: 8+", label: "Long: 8+" },
]

const SHORT_MEDIUM_LONG_RANGE_MAP_1: Record<string, [number, number]> = {
  "Short: 1-3": [1, 3],
  "Medium: 4-7": [4, 7],
  "Long: 8+": [8, 100],
}

const SHORT_MEDIUM_LONG_RETURN: ToggleItem[] = [
  { value: "Short: 0-10", label: "Short: 0-10" },
  { value: "Medium: 10-20", label: "Medium: 10-20" },
  { value: "Long: 20+", label: "Long: 20+" },
]

const SHORT_MEDIUM_LONG_RETURN_RANGE_MAP: Record<string, [number, number]> = {
  "Short: 0-10": [0, 10],
  "Medium: 10-20": [10, 20],
  "Long: 20+": [20, 100],
}

// ---- Section definitions ---------------------------------------------------

export const FILTER_SECTIONS: FilterSection[] = [
  // ===================== League =====================
  {
    key: "league",
    title: "League",
    subsections: [
      {
        filters: [
          {
            type: "toggle",
            label: "League",
            category: "league",
            allValues: ["NFL", "College", "HighSchool"],
            groups: [
              [
                { value: "NFL", label: "NFL" },
                { value: "College", label: "College" },
                { value: "HighSchool", label: "High School" },
              ],
            ],
          },
        ],
      },
    ],
  },

  // ===================== Game Context =====================
  {
    key: "game-context",
    title: "Game Context",
    subsections: [
      {
        filters: [
          {
            type: "toggle",
            label: "Down",
            count: 123,
            category: "down",
            allValues: ["1", "2", "3", "4"],
            groups: [
              [
                { value: "1", label: "1st" },
                { value: "2", label: "2nd" },
                { value: "3", label: "3rd" },
                { value: "4", label: "4th" },
              ],
            ],
          },
          {
            type: "toggleWithRange",
            label: "Distance to first",
            count: 128,
            category: "distanceType",
            allValues: ["Short: 1-3", "Medium: 4-7", "Long: 8+"],
            groups: [SHORT_MEDIUM_LONG_1],
            rangeMap: SHORT_MEDIUM_LONG_RANGE_MAP_1,
            rangeCategory: "distanceRange",
            rangeDefault: [0, 100],
            rangeMin: 0,
            rangeMax: 100,
          },
          {
            type: "range",
            label: "Yard line",
            count: 128,
            rangeCategory: "yardLine",
            rangeDefault: [0, 100],
            rangeMin: 0,
            rangeMax: 100,
          },
          {
            type: "toggle",
            label: "Hash",
            count: 123,
            category: "hash",
            allValues: ["L", "M", "R"],
            groups: [
              [
                { value: "L", label: "Left" },
                { value: "M", label: "Middle" },
                { value: "R", label: "Right" },
              ],
            ],
          },
          { type: "boolean", label: "Two-minute drill" },
          {
            type: "range",
            label: "EPA",
            rangeCategory: "epaRange",
            rangeDefault: [-4, 5],
            rangeMin: -4,
            rangeMax: 5,
          },
        ],
      },
    ],
  },

  // ===================== Formation & Personnel =====================
  {
    key: "formation-personnel",
    title: "Formation & Personnel",
    subsections: [
      {
        filters: [
          {
            type: "toggle",
            label: "Formation",
            category: "formationName",
            allValues: ["Trey Left", "Deuce Right", "Empty Strong", "Trips Right", "I-Form Tight"],
            groups: [
              [
                { value: "Trey Left", label: "Trey Left" },
                { value: "Deuce Right", label: "Deuce Right" },
                { value: "Empty Strong", label: "Empty Strong" },
              ],
              [
                { value: "Trips Right", label: "Trips Right" },
                { value: "I-Form Tight", label: "I-Form Tight" },
              ],
            ],
          },
          {
            type: "toggle",
            label: "Personnel (Offense)",
            category: "personnelO",
            allValues: ["11", "12", "21", "22", "10", "Empty"],
            groups: [
              [
                { value: "11", label: "11" },
                { value: "12", label: "12" },
                { value: "21", label: "21" },
              ],
              [
                { value: "22", label: "22" },
                { value: "10", label: "10" },
                { value: "Empty", label: "Empty" },
              ],
            ],
          },
          {
            type: "toggle",
            label: "Personnel (Defense)",
            category: "personnelD",
            allValues: ["Base", "Nickel", "Dime", "Goal Line"],
            groups: [
              [
                { value: "Base", label: "Base" },
                { value: "Nickel", label: "Nickel" },
                { value: "Dime", label: "Dime" },
                { value: "Goal Line", label: "Goal Line" },
              ],
            ],
          },
          { type: "boolean", label: "Shotgun" },
        ],
      },
    ],
  },

  // ===================== Play Context =====================
  {
    key: "play-context",
    title: "Play Context",
    subsections: [
      {
        subsectionLabel: "Play Development",
        filters: [
          { type: "boolean", label: "Play-action", count: 123 },
          {
            type: "toggle",
            label: "RPO",
            count: 128,
            category: "playType",
            allValues: ["Pass", "Run"],
            groups: [
              [
                { value: "Pass", label: "Pass" },
                { value: "Run", label: "Run" },
              ],
            ],
          },
          { type: "boolean", label: "Screen", count: 123 },
          { type: "boolean", label: "Designed rollout", count: 123 },
          { type: "boolean", label: "Broken Play", count: 123 },
        ],
      },
      {
        subsectionLabel: "Play Result",
        filters: [
          {
            type: "toggle",
            label: "Touchdown",
            count: 123,
            category: "touchdownType",
            allValues: ["Pass", "Run", "Defensive"],
            groups: [
              [
                { value: "Pass", label: "Pass" },
                { value: "Run", label: "Run" },
                { value: "Defensive", label: "Defensive" },
              ],
            ],
          },
          {
            type: "toggle",
            label: "First down earned",
            count: 128,
            category: "firstDownType",
            allValues: ["Pass", "Run"],
            groups: [
              [
                { value: "Pass", label: "Pass" },
                { value: "Run", label: "Run" },
              ],
            ],
          },
          {
            type: "toggle",
            label: "Turnover",
            count: 123,
            category: "turnoverType",
            allValues: ["Fumble", "Interception", "On downs", "Safety"],
            groups: [
              [
                { value: "Fumble", label: "Fumble" },
                { value: "Interception", label: "Interception" },
                { value: "On downs", label: "On downs" },
              ],
              [{ value: "Safety", label: "Safety" }],
            ],
          },
          {
            type: "select",
            label: "Penalty",
            count: 123,
            placeholder: "Select penalty",
            options: [
              { value: "holding", label: "Holding" },
              { value: "false-start", label: "False Start" },
              { value: "offsides", label: "Offsides" },
              { value: "pass-interference", label: "Pass Interference" },
            ],
          },
        ],
      },
    ],
  },

  // ===================== Passing =====================
  {
    key: "passing",
    title: "Passing",
    subsections: [
      {
        subsectionLabel: "Passing (Quarterback)",
        filters: [
          {
            type: "toggle",
            label: "Pass thrown",
            count: 62,
            category: "passResult",
            allValues: ["Complete", "Incomplete"],
            groups: [
              [
                { value: "Complete", label: "Complete" },
                { value: "Incomplete", label: "Incomplete" },
              ],
            ],
          },
          {
            type: "toggle",
            label: "Pass thrown under pressure",
            count: 59,
            category: "passPressureResult",
            allValues: ["Complete", "Incomplete"],
            groups: [
              [
                { value: "Complete", label: "Complete" },
                { value: "Incomplete", label: "Incomplete" },
              ],
            ],
          },
          { type: "boolean", label: "Scramble", count: 17 },
          { type: "boolean", label: "Sack taken", count: 123 },
          { type: "boolean", label: "Throwaway", count: 123 },
          {
            type: "toggle",
            label: "Pass location",
            category: "passLocation",
            allValues: ["Left Sideline", "Left Numbers", "Middle", "Right Numbers", "Right Sideline"],
            groups: [
              [
                { value: "Left Sideline", label: "Left Sideline" },
                { value: "Left Numbers", label: "Left Numbers" },
                { value: "Middle", label: "Middle" },
              ],
              [
                { value: "Right Numbers", label: "Right Numbers" },
                { value: "Right Sideline", label: "Right Sideline" },
              ],
            ],
          },
        ],
      },
      {
        subsectionLabel: "Receiving",
        filters: [
          { type: "boolean", label: "Target / Pass targeted", count: 13 },
          { type: "boolean", label: "Reception", count: 7 },
          { type: "boolean", label: "Drop", count: 17 },
          { type: "boolean", label: "Contested catch", count: 123 },
          {
            type: "select",
            label: "Route type",
            count: 123,
            placeholder: "Select route type",
            options: [
              { value: "slant", label: "Slant" },
              { value: "go", label: "Go" },
              { value: "out", label: "Out" },
              { value: "curl", label: "Curl" },
              { value: "post", label: "Post" },
            ],
          },
          {
            type: "toggle",
            label: "Depth of target",
            count: 123,
            category: "depthOfTarget",
            allValues: ["Behind LOS", "0-10", "10-20", "20+"],
            groups: [
              [
                { value: "Behind LOS", label: "Behind LOS" },
                { value: "0-10", label: "0-10" },
                { value: "10-20", label: "10-20" },
                { value: "20+", label: "20+" },
              ],
            ],
          },
        ],
      },
      {
        subsectionLabel: "Pass Defense",
        filters: [
          { type: "boolean", label: "Pass defended / Breakup", count: 13 },
          { type: "boolean", label: "Interception", count: 7 },
          { type: "boolean", label: "Sack made", count: 17 },
          { type: "boolean", label: "Pressure generated", count: 123 },
          {
            type: "select",
            label: "Coverage",
            count: 123,
            placeholder: "Select coverage",
            options: [
              { value: "cov-1", label: "Cover 1" },
              { value: "cov-2", label: "Cover 2" },
              { value: "cov-3", label: "Cover 3" },
              { value: "cov-4", label: "Cover 4 / Quarters" },
            ],
          },
        ],
      },
    ],
  },

  // ===================== Rushing =====================
  {
    key: "rushing",
    title: "Rushing",
    subsections: [
      {
        subsectionLabel: "Rushing (Ball Carrier)",
        filters: [
          {
            type: "toggle",
            label: "Rush attempt",
            count: 62,
            category: "gainLoss",
            allValues: ["Gn", "Ls"],
            groups: [
              [
                { value: "Gn", label: "Gain" },
                { value: "Ls", label: "Loss / No gain" },
              ],
            ],
          },
          {
            type: "toggleWithRange",
            label: "Yards gained after contact",
            count: 128,
            category: "yardsAfterContact",
            allValues: ["Short: 1-3", "Medium: 4-7", "Long: 8+"],
            groups: [SHORT_MEDIUM_LONG_1],
            rangeMap: SHORT_MEDIUM_LONG_RANGE_MAP_1,
            rangeCategory: "yardsAfterContactRange",
            rangeDefault: [0, 100],
            rangeMin: 0,
            rangeMax: 100,
          },
          {
            type: "toggle",
            label: "Rush direction",
            count: 17,
            category: "runDirection",
            allValues: [
              "Left",
              "LeftTackle",
              "LeftGuard",
              "Middle",
              "RightGuard",
              "RightTackle",
              "Right",
            ],
            groups: [
              [
                { value: "Left", label: "Left end" },
                { value: "LeftTackle", label: "Left tackle" },
                { value: "LeftGuard", label: "Left guard" },
              ],
              [
                { value: "Middle", label: "Center" },
                { value: "RightGuard", label: "Right guard" },
                { value: "RightTackle", label: "Right tackle" },
              ],
              [{ value: "Right", label: "Right end" }],
            ],
          },
          {
            type: "toggle",
            label: "Run gap",
            category: "runGap",
            allValues: ["A-Gap", "B-Gap", "C-Gap", "D-Gap", "Outside"],
            groups: [
              [
                { value: "A-Gap", label: "A-Gap" },
                { value: "B-Gap", label: "B-Gap" },
                { value: "C-Gap", label: "C-Gap" },
              ],
              [
                { value: "D-Gap", label: "D-Gap" },
                { value: "Outside", label: "Outside" },
              ],
            ],
          },
        ],
      },
      {
        subsectionLabel: "Rush Defense",
        filters: [
          { type: "boolean", label: "Tackle made", count: 13 },
          { type: "boolean", label: "Tackle missed", count: 7 },
          { type: "boolean", label: "Tackle for loss made", count: 17 },
          { type: "boolean", label: "Forced fumble", count: 123 },
        ],
      },
    ],
  },

  // ===================== Blocking =====================
  {
    key: "blocking",
    title: "Blocking",
    subsections: [
      {
        subsectionLabel: "Offensive Line",
        filters: [
          { type: "boolean", label: "Pass block", count: 62 },
          { type: "boolean", label: "Run block", count: 128 },
          { type: "boolean", label: "Allowed pressure", count: 17 },
          { type: "boolean", label: "Allowed sack", count: 123 },
        ],
      },
    ],
  },

  // ===================== Special Teams =====================
  {
    key: "special-teams",
    title: "Special Teams",
    subsections: [
      {
        filters: [
          {
            type: "toggle",
            label: "Field goal attempt",
            count: 17,
            category: "fieldGoalResult",
            allValues: ["Made", "Missed", "Blocked", "Fake"],
            groups: [
              [
                { value: "Made", label: "Made" },
                { value: "Missed", label: "Missed" },
                { value: "Blocked", label: "Blocked" },
                { value: "Fake", label: "Fake" },
              ],
            ],
          },
          {
            type: "toggle",
            label: "PAT attempt",
            count: 17,
            category: "patResult",
            allValues: ["Made", "Missed", "Blocked"],
            groups: [
              [
                { value: "Made", label: "Made" },
                { value: "Missed", label: "Missed" },
                { value: "Blocked", label: "Blocked" },
              ],
            ],
          },
          {
            type: "toggle",
            label: "Punt",
            count: 62,
            category: "puntType",
            allValues: [
              "Regular",
              "Fake",
              "Touchback",
              "Out of bounds",
              "Returned",
              "Downed",
            ],
            groups: [
              [
                { value: "Regular", label: "Regular" },
                { value: "Fake", label: "Fake" },
                { value: "Touchback", label: "Touchback" },
              ],
              [
                { value: "Out of bounds", label: "Out of bounds" },
                { value: "Returned", label: "Returned" },
                { value: "Downed", label: "Downed" },
              ],
            ],
          },
          {
            type: "toggleWithRange",
            label: "Punt return",
            count: 128,
            category: "puntReturnYards",
            allValues: ["Short: 0-10", "Medium: 10-20", "Long: 20+"],
            groups: [SHORT_MEDIUM_LONG_RETURN],
            rangeMap: SHORT_MEDIUM_LONG_RETURN_RANGE_MAP,
            rangeCategory: "puntReturnRange",
            rangeDefault: [0, 100],
            rangeMin: 0,
            rangeMax: 100,
          },
          {
            type: "toggle",
            label: "Kickoff",
            count: 123,
            category: "kickoffType",
            allValues: [
              "Regular",
              "Onside",
              "Touchback",
              "Out of bounds",
              "Returned",
              "Downed",
            ],
            groups: [
              [
                { value: "Regular", label: "Regular" },
                { value: "Onside", label: "Onside" },
                { value: "Touchback", label: "Touchback" },
              ],
              [
                { value: "Out of bounds", label: "Out of bounds" },
                { value: "Returned", label: "Returned" },
                { value: "Downed", label: "Downed" },
              ],
            ],
          },
          {
            type: "toggleWithRange",
            label: "Kickoff return",
            count: 128,
            category: "kickoffReturnYards",
            allValues: ["Short: 0-10", "Medium: 10-20", "Long: 20+"],
            groups: [SHORT_MEDIUM_LONG_RETURN],
            rangeMap: SHORT_MEDIUM_LONG_RETURN_RANGE_MAP,
            rangeCategory: "kickoffReturnRange",
            rangeDefault: [0, 100],
            rangeMin: 0,
            rangeMax: 100,
          },
        ],
      },
    ],
  },
]

// ---- Helpers ---------------------------------------------------------------

/** Flat list of every category key referenced by toggle / toggleWithRange filters. */
export const ALL_FILTER_CATEGORIES: string[] = FILTER_SECTIONS.flatMap((section) =>
  section.subsections.flatMap((sub) =>
    sub.filters
      .filter(
        (f): f is ToggleFilterDef | ToggleWithRangeFilterDef =>
          f.type === "toggle" || f.type === "toggleWithRange"
      )
      .map((f) => f.category)
  )
)

/** Flat list of every range category key. */
export const ALL_RANGE_CATEGORIES: string[] = FILTER_SECTIONS.flatMap((section) =>
  section.subsections.flatMap((sub) =>
    sub.filters
      .filter(
        (f): f is ToggleWithRangeFilterDef | RangeFilterDef =>
          f.type === "toggleWithRange" || f.type === "range"
      )
      .map((f) => f.type === "toggleWithRange" ? f.rangeCategory : f.rangeCategory)
  )
)

/** Default accordion sections that should be open on mount. */
export const DEFAULT_OPEN_SECTIONS = ["league", "game-context", "play-context"]

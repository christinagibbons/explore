import type { PlayData } from "@/lib/mock-datasets"
import type {
  FilterState,
  RangeFilterState,
  AnyFilterCategory,
  RangeCategory,
} from "@/types/filters"

// --------------------------------------------------------------------------
// Value accessors -- pure functions that map a play to the value used by
// a given filter category.  No React dependencies.
// --------------------------------------------------------------------------

/**
 * Returns the string value of `play` for a given set-based filter category.
 * Falls back to `""` for unknown categories.
 */
export function getValueForCategory(play: PlayData, category: string): string {
  switch (category) {
    case "league":
      return play.league || "NFL"
    case "quarter":
      return String(play.quarter)
    case "down":
      return String(play.down)
    case "odk":
      return play.odk
    case "hash":
      return play.hash
    case "playType":
      return play.playType
    case "personnelO":
      return play.personnelO
    case "personnelD":
      return play.personnelD
    case "blitz":
      return play.blitz
    case "coverage":
      return play.coverage
    case "defFront":
      return play.defFront
    case "game":
      return play.game
    case "passResult":
      return play.passResult || ""
    case "runDirection":
      return play.runDirection || ""
    case "isTouchdown":
      return play.isTouchdown ? "Yes" : "No"
    case "isFirstDown":
      return play.isFirstDown ? "Yes" : "No"
    case "isPenalty":
      return play.isPenalty ? "Yes" : "No"
    case "gainLoss":
      return play.gainLoss
    // New data fields
    case "formationName":
      return play.formationName || ""
    case "personnelO":
      return play.personnelO || ""
    case "personnelD":
      return play.personnelD || ""
    case "passLocation":
      return play.passLocation || ""
    case "runGap":
      return play.runGap || ""
    case "isTwoMinuteDrill":
      return play.isTwoMinuteDrill ? "Yes" : "No"
    case "isShotgun":
      return play.isShotgun ? "Yes" : "No"
    default:
      return ""
  }
}

/**
 * Returns the numeric value of `play` for a given range-based filter
 * category, or `null` when the category is unrecognised.
 */
export function getNumericValueForRange(
  play: PlayData,
  category: string,
): number | null {
  switch (category) {
    case "yardLine":
      return play.yardLineNumeric
    case "distanceRange":
      return play.distance
    case "yardsAfterContactRange":
      return play.yards // approximate with yards gained
    case "puntReturnRange":
      return play.yards
    case "kickoffReturnRange":
      return play.yards
    case "epaRange":
      return play.epa
    default:
      return null
  }
}

// --------------------------------------------------------------------------
// Matching helpers
// --------------------------------------------------------------------------

/**
 * Returns `true` when `play` satisfies **all** active set-based filter
 * categories (AND logic across categories).
 */
export function matchesSetFilters(
  play: PlayData,
  activeCategories: [string, Set<string>][],
): boolean {
  return activeCategories.every(([category, selectedValues]) => {
    // Special handling for distance ranges (toggle chips)
    if (category === "distanceType") {
      const dist = play.distance
      if (selectedValues.has("Short: 1-3") && dist >= 1 && dist <= 3) return true
      if (selectedValues.has("Medium: 4-7") && dist >= 4 && dist <= 7) return true
      if (selectedValues.has("Long: 8+") && dist >= 8) return true
      return false
    }

    const value = getValueForCategory(play, category)
    return selectedValues.has(String(value))
  })
}

/**
 * Returns `true` when `play` satisfies **all** active range filters
 * (AND logic across ranges).
 */
export function matchesRangeFilters(
  play: PlayData,
  activeRanges: [string, [number, number]][],
): boolean {
  return activeRanges.every(([category, [lo, hi]]) => {
    const numericValue = getNumericValueForRange(play, category)
    if (numericValue === null) return false
    // Single-point filters use lo === hi
    if (lo === hi) return numericValue === lo
    return numericValue >= lo && numericValue <= hi
  })
}

// --------------------------------------------------------------------------
// Top-level API
// --------------------------------------------------------------------------

/**
 * Returns `true` when `play` matches **both** all active set-based filters
 * and all active range filters.
 */
export function matchesFilters(
  play: PlayData,
  filters: FilterState,
  rangeFilters: RangeFilterState,
): boolean {
  const activeCats = Object.entries(filters).filter(
    ([, values]) => values.size > 0,
  ) as [string, Set<string>][]
  const activeRanges = Object.entries(rangeFilters) as [string, [number, number]][]

  if (activeCats.length === 0 && activeRanges.length === 0) return true

  return (
    matchesSetFilters(play, activeCats) &&
    matchesRangeFilters(play, activeRanges)
  )
}

/**
 * Filters `plays` against the given set and range filters.
 * Returns the original array reference when no filters are active (avoids
 * downstream re-renders).
 */
export function filterPlays(
  plays: PlayData[],
  filters: FilterState,
  rangeFilters: RangeFilterState,
): PlayData[] {
  const activeCats = Object.entries(filters).filter(
    ([, values]) => values.size > 0,
  ) as [string, Set<string>][]
  const activeRanges = Object.entries(rangeFilters) as [string, [number, number]][]

  if (activeCats.length === 0 && activeRanges.length === 0) return plays

  return plays.filter((play) =>
    matchesSetFilters(play, activeCats) &&
    matchesRangeFilters(play, activeRanges),
  )
}

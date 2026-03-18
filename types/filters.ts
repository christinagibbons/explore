// ---------------------------------------------------------------------------
// Strict filter types — single source of truth for every filter & range key.
// Replaces the loose `Record<string, …>` types with bounded unions so that
// typos are caught at compile time and optional-chaining fallbacks (`|| false`,
// `|| [0,100]`) become unnecessary.
// ---------------------------------------------------------------------------

// ---- Set-based filter categories ------------------------------------------

/** Every valid set-based filter category key. */
export type FilterCategory =
  // League
  | "league"
  // Game Context
  | "down"
  | "distanceType"
  | "hash"
  // Play Context — development
  | "playType"
  // Play Context — result
  | "touchdownType"
  | "firstDownType"
  | "turnoverType"
  // Passing — quarterback
  | "passResult"
  | "passPressureResult"
  // Passing — receiving
  | "depthOfTarget"
  | "passLocation"
  // Rushing
  | "gainLoss"
  | "yardsAfterContact"
  | "runDirection"
  | "runGap"
  // Formation & Situation
  | "formationName"
  | "personnelO"
  | "personnelD"
  // Special Teams
  | "fieldGoalResult"
  | "patResult"
  | "puntType"
  | "puntReturnYards"
  | "kickoffType"
  | "kickoffReturnYards"

/**
 * Boolean-style filter categories derived from the label of "boolean" type
 * filter defs. These use the normalised `_filter_<label>` key pattern.
 */
export type BooleanFilterCategory =
  | "_filter_play-action"
  | "_filter_screen"
  | "_filter_designed_rollout"
  | "_filter_broken_play"
  | "_filter_scramble"
  | "_filter_sack_taken"
  | "_filter_throwaway"
  | "_filter_target_/_pass_targeted"
  | "_filter_reception"
  | "_filter_drop"
  | "_filter_contested_catch"
  | "_filter_pass_defended_/_breakup"
  | "_filter_interception"
  | "_filter_sack_made"
  | "_filter_pressure_generated"
  | "_filter_tackle_made"
  | "_filter_tackle_missed"
  | "_filter_tackle_for_loss_made"
  | "_filter_forced_fumble"
  | "_filter_pass_block"
  | "_filter_run_block"
  | "_filter_allowed_pressure"
  | "_filter_allowed_sack"
  // New boolean categories from expanded data
  | "_filter_two-minute_drill"
  | "_filter_shotgun"

/** Union of every key that can appear in `FilterState`. */
export type AnyFilterCategory = FilterCategory | BooleanFilterCategory

// ---- Range filter categories ----------------------------------------------

/** Every valid range filter category key. */
export type RangeCategory =
  | "distanceRange"
  | "yardLine"
  | "yardsAfterContactRange"
  | "puntReturnRange"
  | "kickoffReturnRange"
  | "epaRange"

// ---- State types ----------------------------------------------------------

/**
 * Strict set-based filter state.
 *
 * `Partial<…>` means a missing key signals "no filter active for that
 * category" — no need for optional chaining or `|| false` fallbacks when
 * used together with the {@link hasFilter} type guard.
 */
export type FilterState = Partial<Record<AnyFilterCategory, Set<string>>>

/**
 * Strict range filter state.
 *
 * A missing key means the range is at its default. Use
 * {@link getRangeValue} to read values with a typed default.
 */
export type RangeFilterState = Partial<Record<RangeCategory, [number, number]>>

// ---- Type guards & helpers ------------------------------------------------

/**
 * Returns `true` when the given `category` has an active set with the
 * given `value` selected. Narrows the optional `Set` so callers avoid
 * `?.has(…) || false`.
 */
export function hasFilter(
  filters: FilterState,
  category: AnyFilterCategory,
  value: string,
): boolean {
  const set = filters[category]
  return set !== undefined && set.has(value)
}

/**
 * Returns the active set for a category, or `undefined` when the category
 * is not in the state. Useful for checking `size > 0` without optional
 * chaining.
 */
export function getFilterSet(
  filters: FilterState,
  category: AnyFilterCategory,
): Set<string> | undefined {
  return filters[category]
}

/**
 * Returns the active range tuple, falling back to `defaultRange` when the
 * category is absent. Eliminates `|| [0, 100]` inline fallbacks.
 */
export function getRangeValue(
  rangeFilters: RangeFilterState,
  category: RangeCategory,
  defaultRange: [number, number],
): [number, number] {
  return rangeFilters[category] ?? defaultRange
}

/**
 * Returns `true` when the given `category` has an active (non-default) range
 * entry in the state.
 */
export function hasActiveRange(
  rangeFilters: RangeFilterState,
  category: RangeCategory,
): boolean {
  return category in rangeFilters
}

/**
 * Type guard: narrows an arbitrary string to `FilterCategory`.
 * Useful at module boundaries that still accept `string`.
 */
const FILTER_CATEGORIES: ReadonlySet<string> = new Set<FilterCategory>([
  "league", "down", "distanceType", "hash", "playType", "touchdownType",
  "firstDownType", "turnoverType", "passResult", "passPressureResult",
  "depthOfTarget", "passLocation", "gainLoss", "yardsAfterContact", "runDirection",
  "runGap", "formationName", "personnelO", "personnelD",
  "fieldGoalResult", "patResult", "puntType", "puntReturnYards",
  "kickoffType", "kickoffReturnYards",
])

export function isFilterCategory(key: string): key is FilterCategory {
  return FILTER_CATEGORIES.has(key)
}

/**
 * Type guard: narrows an arbitrary string to `RangeCategory`.
 */
const RANGE_CATEGORIES: ReadonlySet<string> = new Set<RangeCategory>([
  "distanceRange", "yardLine", "yardsAfterContactRange",
  "puntReturnRange", "kickoffReturnRange", "epaRange",
])

export function isRangeCategory(key: string): key is RangeCategory {
  return RANGE_CATEGORIES.has(key)
}

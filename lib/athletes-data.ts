import type { Athlete, Position } from "@/types/athlete"

// ---------------------------------------------------------------------------
// Full athlete dataset (NFL: 50, College: 20, High School: 20 = 90 players)
// ---------------------------------------------------------------------------

export const athletes: (Athlete & { id: string })[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // NFL PLAYERS (50)
  // ═══════════════════════════════════════════════════════════════════════

  // ── Quarterbacks ──────────────────────────────────────────────────────
  { id: "ath-001", name: "Lamar Jackson", league: "NFL", team: "BAL", position: "QB", jersey_number: 8, height: "6'2", weight: 215, college: "Louisville", stats: { passing_yards: 7851, passing_tds: 65, rushing_yards: 1625, rushing_tds: 11, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-002", name: "Josh Allen", league: "NFL", team: "BUF", position: "QB", jersey_number: 17, height: "6'5", weight: 237, college: "Wyoming", stats: { passing_yards: 8037, passing_tds: 57, rushing_yards: 1120, rushing_tds: 27, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-003", name: "Patrick Mahomes", league: "NFL", team: "KC", position: "QB", jersey_number: 15, height: "6'2", weight: 225, college: "Texas Tech", stats: { passing_yards: 8111, passing_tds: 53, rushing_yards: 780, rushing_tds: 2, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-004", name: "Jared Goff", league: "NFL", team: "DET", position: "QB", jersey_number: 16, height: "6'4", weight: 217, college: "California", stats: { passing_yards: 9204, passing_tds: 67, rushing_yards: 42, rushing_tds: 2, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-005", name: "Joe Burrow", league: "NFL", team: "CIN", position: "QB", jersey_number: 9, height: "6'4", weight: 215, college: "LSU", stats: { passing_yards: 7227, passing_tds: 58, rushing_yards: 210, rushing_tds: 1, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-006", name: "C.J. Stroud", league: "NFL", team: "HOU", position: "QB", jersey_number: 7, height: "6'3", weight: 218, college: "Ohio State", stats: { passing_yards: 8214, passing_tds: 48, rushing_yards: 340, rushing_tds: 5, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-007", name: "Brock Purdy", league: "NFL", team: "SF", position: "QB", jersey_number: 13, height: "6'1", weight: 220, college: "Iowa State", stats: { passing_yards: 8144, passing_tds: 59, rushing_yards: 290, rushing_tds: 4, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },

  // ── Running Backs ─────────────────────────────────────────────────────
  { id: "ath-008", name: "Saquon Barkley", league: "NFL", team: "PHI", position: "RB", jersey_number: 26, height: "6'0", weight: 232, college: "Penn State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 2967, rushing_tds: 19, receiving_yards: 620, receiving_tds: 6, tackles: 0, sacks: 0 } },
  { id: "ath-009", name: "Christian McCaffrey", league: "NFL", team: "SF", position: "RB", jersey_number: 23, height: "5'11", weight: 210, college: "Stanford", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 2192, rushing_tds: 21, receiving_yards: 1027, receiving_tds: 10, tackles: 0, sacks: 0 } },
  { id: "ath-010", name: "Derrick Henry", league: "NFL", team: "BAL", position: "RB", jersey_number: 22, height: "6'3", weight: 247, college: "Alabama", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 3088, rushing_tds: 28, receiving_yards: 380, receiving_tds: 2, tackles: 0, sacks: 0 } },
  { id: "ath-011", name: "James Cook", league: "NFL", team: "BUF", position: "RB", jersey_number: 4, height: "5'11", weight: 190, college: "Georgia", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 2245, rushing_tds: 10, receiving_yards: 890, receiving_tds: 5, tackles: 0, sacks: 0 } },
  { id: "ath-012", name: "Breece Hall", league: "NFL", team: "NYJ", position: "RB", jersey_number: 20, height: "6'1", weight: 220, college: "Iowa State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 2054, rushing_tds: 12, receiving_yards: 1391, receiving_tds: 8, tackles: 0, sacks: 0 } },
  { id: "ath-013", name: "Jahmyr Gibbs", league: "NFL", team: "DET", position: "RB", jersey_number: 5, height: "5'9", weight: 200, college: "Alabama", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 2357, rushing_tds: 26, receiving_yards: 680, receiving_tds: 2, tackles: 0, sacks: 0 } },
  { id: "ath-014", name: "Kyren Williams", league: "NFL", team: "LAR", position: "RB", jersey_number: 23, height: "5'9", weight: 194, college: "Notre Dame", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 2427, rushing_tds: 27, receiving_yards: 410, receiving_tds: 5, tackles: 0, sacks: 0 } },

  // ── Wide Receivers ────────────────────────────────────────────────────
  { id: "ath-015", name: "Justin Jefferson", league: "NFL", team: "MIN", position: "WR", jersey_number: 18, height: "6'1", weight: 195, college: "LSU", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 2607, receiving_tds: 15, tackles: 0, sacks: 0 } },
  { id: "ath-016", name: "Ja'Marr Chase", league: "NFL", team: "CIN", position: "WR", jersey_number: 1, height: "6'0", weight: 201, college: "LSU", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 2924, receiving_tds: 24, tackles: 0, sacks: 0 } },
  { id: "ath-017", name: "Tyreek Hill", league: "NFL", team: "MIA", position: "WR", jersey_number: 10, height: "5'10", weight: 191, college: "West Alabama", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 45, rushing_tds: 0, receiving_yards: 2758, receiving_tds: 19, tackles: 0, sacks: 0 } },
  { id: "ath-018", name: "Amon-Ra St. Brown", league: "NFL", team: "DET", position: "WR", jersey_number: 14, height: "6'0", weight: 202, college: "USC", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 2778, receiving_tds: 22, tackles: 0, sacks: 0 } },
  { id: "ath-019", name: "CeeDee Lamb", league: "NFL", team: "DAL", position: "WR", jersey_number: 88, height: "6'2", weight: 200, college: "Oklahoma", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 215, rushing_tds: 2, receiving_yards: 2943, receiving_tds: 18, tackles: 0, sacks: 0 } },
  { id: "ath-020", name: "Puka Nacua", league: "NFL", team: "LAR", position: "WR", jersey_number: 12, height: "6'2", weight: 205, college: "BYU", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 2476, receiving_tds: 9, tackles: 0, sacks: 0 } },
  { id: "ath-021", name: "Garrett Wilson", league: "NFL", team: "NYJ", position: "WR", jersey_number: 5, height: "6'0", weight: 192, college: "Ohio State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 2146, receiving_tds: 10, tackles: 0, sacks: 0 } },
  { id: "ath-022", name: "Drake London", league: "NFL", team: "ATL", position: "WR", jersey_number: 5, height: "6'4", weight: 213, college: "USC", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 2176, receiving_tds: 11, tackles: 0, sacks: 0 } },

  // ── Tight Ends ────────────────────────────────────────────────────────
  { id: "ath-023", name: "Travis Kelce", league: "NFL", team: "KC", position: "TE", jersey_number: 87, height: "6'5", weight: 250, college: "Cincinnati", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 1807, receiving_tds: 8, tackles: 0, sacks: 0 } },
  { id: "ath-024", name: "Sam LaPorta", league: "NFL", team: "DET", position: "TE", jersey_number: 87, height: "6'3", weight: 245, college: "Iowa", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 1678, receiving_tds: 14, tackles: 0, sacks: 0 } },
  { id: "ath-025", name: "Brock Bowers", league: "NFL", team: "LV", position: "TE", jersey_number: 89, height: "6'4", weight: 240, college: "Georgia", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 1194, receiving_tds: 5, tackles: 0, sacks: 0 } },
  { id: "ath-026", name: "George Kittle", league: "NFL", team: "SF", position: "TE", jersey_number: 85, height: "6'4", weight: 250, college: "Iowa", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 2126, receiving_tds: 14, tackles: 0, sacks: 0 } },

  // ── Defensive Ends ────────────────────────────────────────────────────
  { id: "ath-027", name: "Myles Garrett", league: "NFL", team: "CLE", position: "DE", jersey_number: 95, height: "6'4", weight: 272, college: "Texas A&M", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 98, sacks: 37.0 } },
  { id: "ath-028", name: "Maxx Crosby", league: "NFL", team: "LV", position: "DE", jersey_number: 98, height: "6'5", weight: 255, college: "Eastern Michigan", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 115, sacks: 22.0 } },
  { id: "ath-029", name: "Nick Bosa", league: "NFL", team: "SF", position: "DE", jersey_number: 97, height: "6'4", weight: 266, college: "Ohio State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 85, sacks: 21.0 } },
  { id: "ath-030", name: "Aidan Hutchinson", league: "NFL", team: "DET", position: "DE", jersey_number: 97, height: "6'7", weight: 268, college: "Michigan", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 65, sacks: 18.0 } },
  { id: "ath-031", name: "Danielle Hunter", league: "NFL", team: "HOU", position: "DE", jersey_number: 55, height: "6'5", weight: 263, college: "LSU", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 104, sacks: 28.5 } },
  { id: "ath-032", name: "Josh Hines-Allen", league: "NFL", team: "JAX", position: "DE", jersey_number: 41, height: "6'5", weight: 255, college: "Kentucky", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 106, sacks: 25.5 } },
  { id: "ath-033", name: "Trey Hendrickson", league: "NFL", team: "CIN", position: "DE", jersey_number: 91, height: "6'4", weight: 270, college: "Florida Atlantic", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 63, sacks: 35.0 } },

  // ── Defensive Tackles ─────────────────────────────────────────────────
  { id: "ath-034", name: "Chris Jones", league: "NFL", team: "KC", position: "DT", jersey_number: 95, height: "6'6", weight: 310, college: "Mississippi State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 59, sacks: 15.5 } },
  { id: "ath-035", name: "Dexter Lawrence", league: "NFL", team: "NYG", position: "DT", jersey_number: 97, height: "6'4", weight: 342, college: "Clemson", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 76, sacks: 13.5 } },
  { id: "ath-036", name: "Quinnen Williams", league: "NFL", team: "NYJ", position: "DT", jersey_number: 95, height: "6'3", weight: 303, college: "Alabama", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 94, sacks: 10.5 } },

  // ── Linebackers ───────────────────────────────────────────────────────
  { id: "ath-037", name: "T.J. Watt", league: "NFL", team: "PIT", position: "LB", jersey_number: 90, height: "6'4", weight: 252, college: "Wisconsin", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 108, sacks: 30.5 } },
  { id: "ath-038", name: "Micah Parsons", league: "NFL", team: "DAL", position: "LB", jersey_number: 11, height: "6'3", weight: 245, college: "Penn State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 103, sacks: 14.0 } },
  { id: "ath-039", name: "Fred Warner", league: "NFL", team: "SF", position: "LB", jersey_number: 54, height: "6'3", weight: 230, college: "BYU", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 132, sacks: 2.5 } },
  { id: "ath-040", name: "Roquan Smith", league: "NFL", team: "BAL", position: "LB", jersey_number: 0, height: "6'1", weight: 236, college: "Georgia", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 158, sacks: 1.5 } },

  // ── Defensive Backs (CB/S) ────────────────────────────────────────────
  { id: "ath-041", name: "Sauce Gardner", league: "NFL", team: "NYJ", position: "CB", jersey_number: 1, height: "6'3", weight: 200, college: "Cincinnati", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 57, sacks: 0 } },
  { id: "ath-042", name: "Patrick Surtain II", league: "NFL", team: "DEN", position: "CB", jersey_number: 2, height: "6'2", weight: 202, college: "Alabama", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 69, sacks: 0 } },
  { id: "ath-043", name: "Jalen Ramsey", league: "NFL", team: "MIA", position: "CB", jersey_number: 5, height: "6'1", weight: 208, college: "Florida State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 50, sacks: 0 } },
  { id: "ath-044", name: "Trent McDuffie", league: "NFL", team: "KC", position: "CB", jersey_number: 22, height: "5'11", weight: 193, college: "Washington", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 80, sacks: 3.0 } },
  { id: "ath-045", name: "Kyle Hamilton", league: "NFL", team: "BAL", position: "S", jersey_number: 14, height: "6'4", weight: 220, college: "Notre Dame", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 81, sacks: 3.0 } },
  { id: "ath-046", name: "Minkah Fitzpatrick", league: "NFL", team: "PIT", position: "S", jersey_number: 39, height: "6'1", weight: 207, college: "Alabama", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 64, sacks: 0 } },
  { id: "ath-047", name: "Derwin James", league: "NFL", team: "LAC", position: "S", jersey_number: 3, height: "6'2", weight: 215, college: "Florida State", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 125, sacks: 2.0 } },
  { id: "ath-048", name: "Jessie Bates III", league: "NFL", team: "ATL", position: "S", jersey_number: 3, height: "6'1", weight: 200, college: "Wake Forest", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 132, sacks: 0 } },
  { id: "ath-049", name: "Antoine Winfield Jr.", league: "NFL", team: "TB", position: "S", jersey_number: 31, height: "5'9", weight: 203, college: "Minnesota", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 122, sacks: 6.0 } },
  { id: "ath-050", name: "Justin Simmons", league: "NFL", team: "ATL", position: "S", jersey_number: 31, height: "6'2", weight: 202, college: "Boston College", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 70, sacks: 1.0 } },

  // ═══════════════════════════════════════════════════════════════════════
  // COLLEGE PLAYERS (20) - From 10 different teams
  // ═══════════════════════════════════════════════════════════════════════

  // ── Georgia Bulldogs ──────────────────────────────────────────────────
  { id: "ath-051", name: "Carson Beck", league: "College", team: "UGA", position: "QB", jersey_number: 15, height: "6'4", weight: 220, college: "Georgia", classYear: "Senior", stats: { passing_yards: 3941, passing_tds: 28, rushing_yards: 45, rushing_tds: 1, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-052", name: "Trevor Etienne", league: "College", team: "UGA", position: "RB", jersey_number: 1, height: "5'10", weight: 210, college: "Georgia", classYear: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1134, rushing_tds: 12, receiving_yards: 245, receiving_tds: 2, tackles: 0, sacks: 0 } },

  // ── Texas Longhorns ───────────────────────────────────────────────────
  { id: "ath-053", name: "Quinn Ewers", league: "College", team: "TEX", position: "QB", jersey_number: 3, height: "6'2", weight: 210, college: "Texas", classYear: "Junior", stats: { passing_yards: 3479, passing_tds: 29, rushing_yards: 78, rushing_tds: 2, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-054", name: "Cedric Baxter Jr.", league: "College", team: "TEX", position: "RB", jersey_number: 2, height: "6'1", weight: 215, college: "Texas", classYear: "Sophomore", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 892, rushing_tds: 9, receiving_yards: 156, receiving_tds: 1, tackles: 0, sacks: 0 } },

  // ── Ohio State Buckeyes ───────────────────────────────────────────────
  { id: "ath-055", name: "Will Howard", league: "College", team: "OSU", position: "QB", jersey_number: 18, height: "6'4", weight: 235, college: "Ohio State", classYear: "Senior", stats: { passing_yards: 3779, passing_tds: 33, rushing_yards: 456, rushing_tds: 8, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-056", name: "TreVeyon Henderson", league: "College", team: "OSU", position: "RB", jersey_number: 32, height: "5'10", weight: 212, college: "Ohio State", classYear: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1245, rushing_tds: 14, receiving_yards: 312, receiving_tds: 3, tackles: 0, sacks: 0 } },

  // ── Oregon Ducks ──────────────────────────────────────────────────────
  { id: "ath-057", name: "Dillon Gabriel", league: "College", team: "ORE", position: "QB", jersey_number: 8, height: "5'11", weight: 200, college: "Oregon", classYear: "Senior", stats: { passing_yards: 3857, passing_tds: 31, rushing_yards: 289, rushing_tds: 6, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-058", name: "Jordan James", league: "College", team: "ORE", position: "RB", jersey_number: 5, height: "5'10", weight: 205, college: "Oregon", classYear: "Sophomore", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1567, rushing_tds: 15, receiving_yards: 278, receiving_tds: 2, tackles: 0, sacks: 0 } },

  // ── Alabama Crimson Tide ──────────────────────────────────────────────
  { id: "ath-059", name: "Jalen Milroe", league: "College", team: "ALA", position: "QB", jersey_number: 4, height: "6'2", weight: 220, college: "Alabama", classYear: "Junior", stats: { passing_yards: 2834, passing_tds: 23, rushing_yards: 726, rushing_tds: 12, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-060", name: "Jam Miller", league: "College", team: "ALA", position: "RB", jersey_number: 26, height: "5'10", weight: 210, college: "Alabama", classYear: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 987, rushing_tds: 11, receiving_yards: 189, receiving_tds: 1, tackles: 0, sacks: 0 } },

  // ── Michigan Wolverines ───────────────────────────────────────────────
  { id: "ath-061", name: "Davis Warren", league: "College", team: "MICH", position: "QB", jersey_number: 16, height: "6'3", weight: 210, college: "Michigan", classYear: "Senior", stats: { passing_yards: 2156, passing_tds: 14, rushing_yards: 89, rushing_tds: 2, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-062", name: "Donovan Edwards", league: "College", team: "MICH", position: "RB", jersey_number: 7, height: "6'1", weight: 210, college: "Michigan", classYear: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1012, rushing_tds: 8, receiving_yards: 267, receiving_tds: 2, tackles: 0, sacks: 0 } },

  // ── Penn State Nittany Lions ──────────────────────────────────────────
  { id: "ath-063", name: "Drew Allar", league: "College", team: "PSU", position: "QB", jersey_number: 15, height: "6'5", weight: 235, college: "Penn State", classYear: "Junior", stats: { passing_yards: 3192, passing_tds: 24, rushing_yards: 134, rushing_tds: 4, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-064", name: "Nicholas Singleton", league: "College", team: "PSU", position: "RB", jersey_number: 10, height: "6'0", weight: 225, college: "Penn State", classYear: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1056, rushing_tds: 10, receiving_yards: 178, receiving_tds: 1, tackles: 0, sacks: 0 } },

  // ── Miami Hurricanes ──────────────────────────────────────────────────
  { id: "ath-065", name: "Cam Ward", league: "College", team: "MIAMI", position: "QB", jersey_number: 1, height: "6'2", weight: 220, college: "Miami", classYear: "Senior", stats: { passing_yards: 4313, passing_tds: 39, rushing_yards: 256, rushing_tds: 4, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-066", name: "Damien Martinez", league: "College", team: "MIAMI", position: "RB", jersey_number: 6, height: "5'11", weight: 215, college: "Miami", classYear: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 876, rushing_tds: 10, receiving_yards: 234, receiving_tds: 2, tackles: 0, sacks: 0 } },

  // ── Clemson Tigers ────────────────────────────────────────────────────
  { id: "ath-067", name: "Cade Klubnik", league: "College", team: "CLEM", position: "QB", jersey_number: 2, height: "6'2", weight: 195, college: "Clemson", classYear: "Junior", stats: { passing_yards: 3356, passing_tds: 33, rushing_yards: 412, rushing_tds: 7, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-068", name: "Phil Mafah", league: "College", team: "CLEM", position: "RB", jersey_number: 26, height: "6'1", weight: 235, college: "Clemson", classYear: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1345, rushing_tds: 13, receiving_yards: 167, receiving_tds: 1, tackles: 0, sacks: 0 } },

  // ── LSU Tigers ────────────────────────────────────────────────────────
  { id: "ath-069", name: "Garrett Nussmeier", league: "College", team: "LSU", position: "QB", jersey_number: 13, height: "6'2", weight: 195, college: "LSU", classYear: "Junior", stats: { passing_yards: 4045, passing_tds: 37, rushing_yards: 89, rushing_tds: 2, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-070", name: "Josh Williams", league: "College", team: "LSU", position: "RB", jersey_number: 27, height: "5'11", weight: 215, college: "LSU", classYear: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 734, rushing_tds: 8, receiving_yards: 145, receiving_tds: 1, tackles: 0, sacks: 0 } },

  // ═══════════════════════════════════════════════════════════════════════
  // HIGH SCHOOL PLAYERS (20) - From 10 different teams
  // ═══════════════════════════════════════════════════════════════════════

  // ── Mater Dei Monarchs (CA) ───────────────────────────────────────────
  { id: "ath-071", name: "Elijah Brown", league: "HighSchool", team: "MDM", position: "QB", jersey_number: 7, height: "6'3", weight: 195, college: "Mater Dei HS", grade: "Senior", stats: { passing_yards: 3456, passing_tds: 38, rushing_yards: 312, rushing_tds: 6, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-072", name: "Jordon Davison", league: "HighSchool", team: "MDM", position: "RB", jersey_number: 1, height: "5'10", weight: 185, college: "Mater Dei HS", grade: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1789, rushing_tds: 24, receiving_yards: 345, receiving_tds: 4, tackles: 0, sacks: 0 } },

  // ── St. John Bosco Braves (CA) ────────────────────────────────────────
  { id: "ath-073", name: "Koa Misi Jr.", league: "HighSchool", team: "SJB", position: "QB", jersey_number: 14, height: "6'1", weight: 200, college: "St. John Bosco HS", grade: "Senior", stats: { passing_yards: 2987, passing_tds: 32, rushing_yards: 567, rushing_tds: 9, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-074", name: "Cameron Jones", league: "HighSchool", team: "SJB", position: "WR", jersey_number: 2, height: "6'2", weight: 180, college: "St. John Bosco HS", grade: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 45, rushing_tds: 1, receiving_yards: 1234, receiving_tds: 14, tackles: 0, sacks: 0 } },

  // ── IMG Academy Ascenders (FL) ────────────────────────────────────────
  { id: "ath-075", name: "Jaylen Brown", league: "HighSchool", team: "IMG", position: "QB", jersey_number: 12, height: "6'4", weight: 210, college: "IMG Academy", grade: "Senior", stats: { passing_yards: 3678, passing_tds: 42, rushing_yards: 234, rushing_tds: 4, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-076", name: "Jerrick Gibson", league: "HighSchool", team: "IMG", position: "RB", jersey_number: 3, height: "5'9", weight: 175, college: "IMG Academy", grade: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1456, rushing_tds: 19, receiving_yards: 456, receiving_tds: 5, tackles: 0, sacks: 0 } },

  // ── Southlake Carroll Dragons (TX) ────────────────────────────────────
  { id: "ath-077", name: "Marcus Johnson", league: "HighSchool", team: "SLC", position: "QB", jersey_number: 10, height: "6'2", weight: 190, college: "Southlake Carroll HS", grade: "Senior", stats: { passing_yards: 3234, passing_tds: 35, rushing_yards: 456, rushing_tds: 7, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-078", name: "Owen Allen", league: "HighSchool", team: "SLC", position: "WR", jersey_number: 4, height: "6'0", weight: 175, college: "Southlake Carroll HS", grade: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 67, rushing_tds: 1, receiving_yards: 1098, receiving_tds: 12, tackles: 0, sacks: 0 } },

  // ── North Shore Mustangs (TX) ─────────────────────────────────────────
  { id: "ath-079", name: "Kaleb Bailey", league: "HighSchool", team: "NSM", position: "QB", jersey_number: 6, height: "6'1", weight: 195, college: "North Shore HS", grade: "Senior", stats: { passing_yards: 2876, passing_tds: 31, rushing_yards: 789, rushing_tds: 12, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-080", name: "David Amador", league: "HighSchool", team: "NSM", position: "RB", jersey_number: 21, height: "5'11", weight: 200, college: "North Shore HS", grade: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1654, rushing_tds: 22, receiving_yards: 234, receiving_tds: 3, tackles: 0, sacks: 0 } },

  // ── St. Thomas Aquinas Raiders (FL) ───────────────────────────────────
  { id: "ath-081", name: "Jake Simmons", league: "HighSchool", team: "STA", position: "QB", jersey_number: 8, height: "6'3", weight: 205, college: "St. Thomas Aquinas HS", grade: "Senior", stats: { passing_yards: 3098, passing_tds: 33, rushing_yards: 189, rushing_tds: 3, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-082", name: "Anthony Williams", league: "HighSchool", team: "STA", position: "WR", jersey_number: 11, height: "6'1", weight: 180, college: "St. Thomas Aquinas HS", grade: "Junior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 34, rushing_tds: 0, receiving_yards: 1345, receiving_tds: 16, tackles: 0, sacks: 0 } },

  // ── De La Salle Spartans (CA) ─────────────────────────────────────────
  { id: "ath-083", name: "Tyler Martinez", league: "HighSchool", team: "DLS", position: "QB", jersey_number: 3, height: "6'0", weight: 185, college: "De La Salle HS", grade: "Senior", stats: { passing_yards: 2654, passing_tds: 28, rushing_yards: 345, rushing_tds: 5, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-084", name: "Derrick Jackson", league: "HighSchool", team: "DLS", position: "RB", jersey_number: 22, height: "5'10", weight: 190, college: "De La Salle HS", grade: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1567, rushing_tds: 20, receiving_yards: 289, receiving_tds: 3, tackles: 0, sacks: 0 } },

  // ── Buford Wolves (GA) ────────────────────────────────────────────────
  { id: "ath-085", name: "Dylan Raiola", league: "HighSchool", team: "BUFD", position: "QB", jersey_number: 9, height: "6'3", weight: 220, college: "Buford HS", grade: "Senior", stats: { passing_yards: 3567, passing_tds: 40, rushing_yards: 278, rushing_tds: 5, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-086", name: "Justice Haynes", league: "HighSchool", team: "BUFD", position: "RB", jersey_number: 5, height: "5'10", weight: 200, college: "Buford HS", grade: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1876, rushing_tds: 26, receiving_yards: 312, receiving_tds: 4, tackles: 0, sacks: 0 } },

  // ── Katy Tigers (TX) ──────────────────────────────────────────────────
  { id: "ath-087", name: "Cole Tiffany", league: "HighSchool", team: "KATY", position: "QB", jersey_number: 16, height: "6'1", weight: 185, college: "Katy HS", grade: "Senior", stats: { passing_yards: 2876, passing_tds: 30, rushing_yards: 234, rushing_tds: 4, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-088", name: "Seth Davis", league: "HighSchool", team: "KATY", position: "RB", jersey_number: 24, height: "5'9", weight: 185, college: "Katy HS", grade: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1765, rushing_tds: 23, receiving_yards: 234, receiving_tds: 2, tackles: 0, sacks: 0 } },

  // ── Duncanville Panthers (TX) ─────────────────────────────────────────
  { id: "ath-089", name: "Keelon Russell", league: "HighSchool", team: "DUN", position: "QB", jersey_number: 1, height: "6'2", weight: 195, college: "Duncanville HS", grade: "Senior", stats: { passing_yards: 3456, passing_tds: 37, rushing_yards: 456, rushing_tds: 8, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 } },
  { id: "ath-090", name: "Caden Durham", league: "HighSchool", team: "DUN", position: "RB", jersey_number: 7, height: "5'10", weight: 195, college: "Duncanville HS", grade: "Senior", stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 1678, rushing_tds: 21, receiving_yards: 378, receiving_tds: 4, tackles: 0, sacks: 0 } },
];

// ---------------------------------------------------------------------------
// Lookup Helpers
// ---------------------------------------------------------------------------

export function getAthletesByTeam(teamAbbreviation: string) { return athletes.filter((a) => a.team === teamAbbreviation) }
export function getAthletesByPosition(position: Position) { return athletes.filter((a) => a.position === position) }
export function getAthleteByName(name: string) { return athletes.find((a) => a.name === name) }
export function getAthleteById(id: string) { return athletes.find((a) => a.id === id) }
export function searchAthletes(query: string) { return athletes.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())) }
export function getAllPositions(): Position[] { return [...new Set(athletes.map((a) => a.position))] }
export function getAllTeams(): string[] { return [...new Set(athletes.map((a) => a.team))] }

// ---------------------------------------------------------------------------
// League-specific Helpers
// ---------------------------------------------------------------------------

export function getAthletesByLeague(league: "NFL" | "College" | "HighSchool") { 
  return athletes.filter((a) => a.league === league) 
}

export function getNFLAthletes() { return getAthletesByLeague("NFL") }
export function getCollegeAthletes() { return getAthletesByLeague("College") }
export function getHighSchoolAthletes() { return getAthletesByLeague("HighSchool") }

export function getAthletesByLeagueAndTeam(league: "NFL" | "College" | "HighSchool", teamAbbreviation: string) {
  return athletes.filter((a) => a.league === league && a.team === teamAbbreviation)
}

export function getAthletesByLeagueAndPosition(league: "NFL" | "College" | "HighSchool", position: Position) {
  return athletes.filter((a) => a.league === league && a.position === position)
}

export type League = "NFL" | "NCAA (FBS)" | "High School"

export interface Team {
  id: string
  name: string
  abbreviation: string
  logoColor: string
}

export interface Conference {
  id: string
  name: string
  teams: Team[]
  subdivisions?: Conference[]
}

export const sportsData: Record<League, { seasons: string[]; conferences: Conference[] }> = {
  NFL: {
    seasons: ["2024", "2023", "2022", "2021", "2020"],
    conferences: [
      {
        id: "afc",
        name: "AFC",
        teams: [],
        subdivisions: [
          {
            id: "afc-north",
            name: "AFC North",
            teams: [
              { id: "bal", name: "Baltimore Ravens", abbreviation: "BAL", logoColor: "#241773" },
              { id: "cin", name: "Cincinnati Bengals", abbreviation: "CIN", logoColor: "#FB4F14" },
              { id: "cle", name: "Cleveland Browns", abbreviation: "CLE", logoColor: "#311D00" },
              { id: "pit", name: "Pittsburgh Steelers", abbreviation: "PIT", logoColor: "#FFB612" },
            ],
          },
          {
            id: "afc-east",
            name: "AFC East",
            teams: [
              { id: "buf", name: "Buffalo Bills", abbreviation: "BUF", logoColor: "#00338D" },
              { id: "mia", name: "Miami Dolphins", abbreviation: "MIA", logoColor: "#008E97" },
              { id: "ne", name: "New England Patriots", abbreviation: "NE", logoColor: "#002244" },
              { id: "nyj", name: "New York Jets", abbreviation: "NYJ", logoColor: "#125740" },
            ],
          },
          {
            id: "afc-south",
            name: "AFC South",
            teams: [
              { id: "hou", name: "Houston Texans", abbreviation: "HOU", logoColor: "#03202F" },
              { id: "ind", name: "Indianapolis Colts", abbreviation: "IND", logoColor: "#002C5F" },
              { id: "jax", name: "Jacksonville Jaguars", abbreviation: "JAX", logoColor: "#006778" },
              { id: "ten", name: "Tennessee Titans", abbreviation: "TEN", logoColor: "#0C2340" },
            ],
          },
          {
            id: "afc-west",
            name: "AFC West",
            teams: [
              { id: "den", name: "Denver Broncos", abbreviation: "DEN", logoColor: "#FB4F14" },
              { id: "kc", name: "Kansas City Chiefs", abbreviation: "KC", logoColor: "#E31837" },
              { id: "lv", name: "Las Vegas Raiders", abbreviation: "LV", logoColor: "#000000" },
              { id: "lac", name: "Los Angeles Chargers", abbreviation: "LAC", logoColor: "#0080C6" },
            ],
          },
        ],
      },
      {
        id: "nfc",
        name: "NFC",
        teams: [],
        subdivisions: [
          {
            id: "nfc-north",
            name: "NFC North",
            teams: [
              { id: "chi", name: "Chicago Bears", abbreviation: "CHI", logoColor: "#0B162A" },
              { id: "det", name: "Detroit Lions", abbreviation: "DET", logoColor: "#0076B6" },
              { id: "gb", name: "Green Bay Packers", abbreviation: "GB", logoColor: "#203731" },
              { id: "min", name: "Minnesota Vikings", abbreviation: "MIN", logoColor: "#4F2683" },
            ],
          },
          {
            id: "nfc-east",
            name: "NFC East",
            teams: [
              { id: "dal", name: "Dallas Cowboys", abbreviation: "DAL", logoColor: "#003594" },
              { id: "nyg", name: "New York Giants", abbreviation: "NYG", logoColor: "#0B2265" },
              { id: "phi", name: "Philadelphia Eagles", abbreviation: "PHI", logoColor: "#004C54" },
              { id: "was", name: "Washington Commanders", abbreviation: "WAS", logoColor: "#5A1414" },
            ],
          },
          {
            id: "nfc-south",
            name: "NFC South",
            teams: [
              { id: "atl", name: "Atlanta Falcons", abbreviation: "ATL", logoColor: "#A71930" },
              { id: "car", name: "Carolina Panthers", abbreviation: "CAR", logoColor: "#0085CA" },
              { id: "no", name: "New Orleans Saints", abbreviation: "NO", logoColor: "#D3BC8D" },
              { id: "tb", name: "Tampa Bay Buccaneers", abbreviation: "TB", logoColor: "#D50A0A" },
            ],
          },
          {
            id: "nfc-west",
            name: "NFC West",
            teams: [
              { id: "ari", name: "Arizona Cardinals", abbreviation: "ARI", logoColor: "#97233F" },
              { id: "lar", name: "Los Angeles Rams", abbreviation: "LAR", logoColor: "#003594" },
              { id: "sf", name: "San Francisco 49ers", abbreviation: "SF", logoColor: "#AA0000" },
              { id: "sea", name: "Seattle Seahawks", abbreviation: "SEA", logoColor: "#002244" },
            ],
          },
        ],
      },
    ],
  },
  "NCAA (FBS)": {
    seasons: ["2024", "2023", "2022"],
    conferences: [
      {
        id: "sec",
        name: "SEC",
        teams: [
          { id: "ala", name: "Alabama Crimson Tide", abbreviation: "ALA", logoColor: "#9E1B32" },
          { id: "geo", name: "Georgia Bulldogs", abbreviation: "UGA", logoColor: "#BA0C2F" },
          { id: "tex", name: "Texas Longhorns", abbreviation: "TEX", logoColor: "#BF5700" },
          { id: "okl", name: "Oklahoma Sooners", abbreviation: "OKL", logoColor: "#841617" },
          { id: "lsu", name: "LSU Tigers", abbreviation: "LSU", logoColor: "#461D7C" },
          { id: "aub", name: "Auburn Tigers", abbreviation: "AUB", logoColor: "#0C2340" },
          { id: "fla", name: "Florida Gators", abbreviation: "FLA", logoColor: "#0021A5" },
          { id: "tenn", name: "Tennessee Volunteers", abbreviation: "TENN", logoColor: "#FF8200" },
        ],
      },
      {
        id: "big10",
        name: "Big Ten",
        teams: [
          { id: "mich", name: "Michigan Wolverines", abbreviation: "MICH", logoColor: "#00274C" },
          { id: "osu", name: "Ohio State Buckeyes", abbreviation: "OSU", logoColor: "#BB0000" },
          { id: "psu", name: "Penn State Nittany Lions", abbreviation: "PSU", logoColor: "#041E42" },
          { id: "ore", name: "Oregon Ducks", abbreviation: "ORE", logoColor: "#154733" },
          { id: "usc", name: "USC Trojans", abbreviation: "USC", logoColor: "#990000" },
          { id: "ucla", name: "UCLA Bruins", abbreviation: "UCLA", logoColor: "#2D68C4" },
          { id: "wis", name: "Wisconsin Badgers", abbreviation: "WIS", logoColor: "#C5050C" },
          { id: "iowa", name: "Iowa Hawkeyes", abbreviation: "IOWA", logoColor: "#FFCD00" },
        ],
      },
      {
        id: "big12",
        name: "Big 12",
        teams: [
          { id: "utahst", name: "Utah Utes", abbreviation: "UTAH", logoColor: "#CC0000" },
          { id: "colo", name: "Colorado Buffaloes", abbreviation: "COLO", logoColor: "#CFB87C" },
          { id: "arist", name: "Arizona State Sun Devils", abbreviation: "ASU", logoColor: "#8C1D40" },
          { id: "byu", name: "BYU Cougars", abbreviation: "BYU", logoColor: "#002E5D" },
          { id: "tcu", name: "TCU Horned Frogs", abbreviation: "TCU", logoColor: "#4D1979" },
          { id: "ksu", name: "Kansas State Wildcats", abbreviation: "KSU", logoColor: "#512888" },
        ],
      },
      {
        id: "acc",
        name: "ACC",
        teams: [
          { id: "clem", name: "Clemson Tigers", abbreviation: "CLEM", logoColor: "#F56600" },
          { id: "fsu", name: "Florida State Seminoles", abbreviation: "FSU", logoColor: "#782F40" },
          { id: "miami", name: "Miami Hurricanes", abbreviation: "MIA", logoColor: "#F47321" },
          { id: "nc", name: "North Carolina Tar Heels", abbreviation: "UNC", logoColor: "#7BAFD4" },
          { id: "ncst", name: "NC State Wolfpack", abbreviation: "NCST", logoColor: "#CC0000" },
          { id: "duke", name: "Duke Blue Devils", abbreviation: "DUKE", logoColor: "#003087" },
          { id: "vt", name: "Virginia Tech Hokies", abbreviation: "VT", logoColor: "#630031" },
          { id: "pitt", name: "Pittsburgh Panthers", abbreviation: "PITT", logoColor: "#003594" },
          { id: "lou", name: "Louisville Cardinals", abbreviation: "LOU", logoColor: "#AD0000" },
          { id: "wake", name: "Wake Forest Demon Deacons", abbreviation: "WAKE", logoColor: "#9E7E38" },
        ],
      },
      {
        id: "pac12",
        name: "Pac-12",
        teams: [
          { id: "wazzu", name: "Washington State Cougars", abbreviation: "WSU", logoColor: "#981E32" },
          { id: "oregst", name: "Oregon State Beavers", abbreviation: "ORST", logoColor: "#DC4405" },
          { id: "cal", name: "California Golden Bears", abbreviation: "CAL", logoColor: "#003262" },
          { id: "stan", name: "Stanford Cardinal", abbreviation: "STAN", logoColor: "#8C1515" },
        ],
      },
      {
        id: "mwc",
        name: "Mountain West",
        teams: [
          { id: "boise", name: "Boise State Broncos", abbreviation: "BSU", logoColor: "#0033A0" },
          { id: "fresno", name: "Fresno State Bulldogs", abbreviation: "FRES", logoColor: "#DB0032" },
          { id: "sdsu", name: "San Diego State Aztecs", abbreviation: "SDSU", logoColor: "#A6192E" },
          { id: "unlv", name: "UNLV Rebels", abbreviation: "UNLV", logoColor: "#CF0A2C" },
          { id: "airforce", name: "Air Force Falcons", abbreviation: "AF", logoColor: "#003087" },
          { id: "csu", name: "Colorado State Rams", abbreviation: "CSU", logoColor: "#1E4D2B" },
        ],
      },
      {
        id: "aac",
        name: "American Athletic",
        teams: [
          { id: "memphis", name: "Memphis Tigers", abbreviation: "MEM", logoColor: "#003087" },
          { id: "tulane", name: "Tulane Green Wave", abbreviation: "TUL", logoColor: "#006747" },
          { id: "smu", name: "SMU Mustangs", abbreviation: "SMU", logoColor: "#CC0035" },
          { id: "usf", name: "South Florida Bulls", abbreviation: "USF", logoColor: "#006747" },
          { id: "navy", name: "Navy Midshipmen", abbreviation: "NAVY", logoColor: "#00205B" },
          { id: "army", name: "Army Black Knights", abbreviation: "ARMY", logoColor: "#000000" },
        ],
      },
    ],
  },
  "High School": {
    seasons: ["2024", "2023", "2022"],
    conferences: [
      {
        id: "texas-6a",
        name: "Texas 6A",
        teams: [
          { id: "hs-westlake", name: "Westlake Chaparrals", abbreviation: "WSTL", logoColor: "#00205B" },
          { id: "hs-north-shore", name: "North Shore Mustangs", abbreviation: "NSHR", logoColor: "#00205B" },
          { id: "hs-southlake", name: "Southlake Carroll Dragons", abbreviation: "SLCK", logoColor: "#006747" },
          { id: "hs-duncanville", name: "Duncanville Panthers", abbreviation: "DUNC", logoColor: "#003087" },
          { id: "hs-allen", name: "Allen Eagles", abbreviation: "ALLN", logoColor: "#003594" },
          { id: "hs-katy", name: "Katy Tigers", abbreviation: "KATY", logoColor: "#CC0000" },
          { id: "hs-galena", name: "Galena Park North Shore", abbreviation: "GPNS", logoColor: "#00205B" },
          { id: "hs-demathas", name: "DeSoto Eagles", abbreviation: "DESO", logoColor: "#8B0000" },
        ],
      },
      {
        id: "california",
        name: "California",
        teams: [
          { id: "hs-mater-dei", name: "Mater Dei Monarchs", abbreviation: "MTRD", logoColor: "#CC0000" },
          { id: "hs-st-john-bosco", name: "St. John Bosco Braves", abbreviation: "SJB", logoColor: "#003087" },
          { id: "hs-servite", name: "Servite Friars", abbreviation: "SERV", logoColor: "#8B0000" },
          { id: "hs-de-la-salle", name: "De La Salle Spartans", abbreviation: "DLS", logoColor: "#154734" },
          { id: "hs-mission-viejo", name: "Mission Viejo Diablos", abbreviation: "MSVJ", logoColor: "#CC0000" },
          { id: "hs-serra", name: "Serra Cavaliers", abbreviation: "SERA", logoColor: "#003087" },
        ],
      },
      {
        id: "florida",
        name: "Florida",
        teams: [
          { id: "hs-img", name: "IMG Academy Ascenders", abbreviation: "IMG", logoColor: "#003087" },
          { id: "hs-st-thomas", name: "St. Thomas Aquinas Raiders", abbreviation: "STA", logoColor: "#00205B" },
          { id: "hs-central", name: "Miami Central Rockets", abbreviation: "MCEN", logoColor: "#CC0000" },
          { id: "hs-columbus", name: "Miami Columbus Explorers", abbreviation: "COLM", logoColor: "#003087" },
          { id: "hs-lakeland", name: "Lakeland Dreadnaughts", abbreviation: "LAKE", logoColor: "#8B0000" },
          { id: "hs-apopka", name: "Apopka Blue Darters", abbreviation: "APOP", logoColor: "#003087" },
        ],
      },
      {
        id: "georgia",
        name: "Georgia",
        teams: [
          { id: "hs-buford", name: "Buford Wolves", abbreviation: "BUFD", logoColor: "#003087" },
          { id: "hs-grayson", name: "Grayson Rams", abbreviation: "GRAY", logoColor: "#8B0000" },
          { id: "hs-colquitt", name: "Colquitt County Packers", abbreviation: "COLQ", logoColor: "#CC0000" },
          { id: "hs-mill-creek", name: "Mill Creek Hawks", abbreviation: "MLCK", logoColor: "#003594" },
          { id: "hs-walton", name: "Walton Raiders", abbreviation: "WALT", logoColor: "#8B0000" },
        ],
      },
      {
        id: "ohio",
        name: "Ohio",
        teams: [
          { id: "hs-st-edward", name: "St. Edward Eagles", abbreviation: "STED", logoColor: "#154734" },
          { id: "hs-archbishop", name: "Archbishop Moeller Crusaders", abbreviation: "MOEL", logoColor: "#003087" },
          { id: "hs-st-ignatius", name: "St. Ignatius Wildcats", abbreviation: "STIG", logoColor: "#003594" },
          { id: "hs-elder", name: "Elder Panthers", abbreviation: "ELDR", logoColor: "#663399" },
          { id: "hs-pickerington", name: "Pickerington Central Tigers", abbreviation: "PICK", logoColor: "#FF6600" },
        ],
      },
    ],
  },
}

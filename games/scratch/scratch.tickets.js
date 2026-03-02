export const tickets = [
  // =========================
  // Match-3 Themed Scratchers
  // =========================
  {
    id: "match3_grandslam_25",
    type: "match3",
    name: "Match3",
    themeKey: "baseball",
    themeLabel: "⚾ Grand Slam Gold",
    subtitle: "Match 3 amounts to win.",
    price: 25,
    tiers: [
      { label: "LOSE", mult: 0, weight: 7000 },
      { label: "2x", mult: 2, weight: 2100 },
      { label: "5x", mult: 5, weight: 700 },
      { label: "20x", mult: 20, weight: 180 },
      { label: "100x", mult: 100, weight: 20 },
    ],
    decoys: [1, 2, 3, 4, 5, 10, 20, 50],
  },

  {
    id: "match3_neon_50",
    type: "match3",
    themeKey: "neon",
    name: "Match3",
    themeLabel: "🌙 Neon Night 1985",
    subtitle: "Match 3 amounts to win.",
    price: 50,
    tiers: [
      { label: "LOSE", mult: 0, weight: 7200 },
      { label: "2x", mult: 2, weight: 2000 },
      { label: "5x", mult: 5, weight: 600 },
      { label: "25x", mult: 25, weight: 170 },
      { label: "100x", mult: 100, weight: 30 },
    ],
    decoys: [1, 2, 3, 4, 5, 10, 25, 50],
  },

  {
    id: "match3_route66_25",
    type: "match3",
    themeKey: "route66",
    name: "Match3",
    themeLabel: "🛣️ Route 66 Riches",
    subtitle: "Match 3 amounts to win.",
    price: 25,
    tiers: [
      { label: "LOSE", mult: 0, weight: 6900 },
      { label: "2x", mult: 2, weight: 2250 },
      { label: "5x", mult: 5, weight: 650 },
      { label: "15x", mult: 15, weight: 180 },
      { label: "75x", mult: 75, weight: 20 },
    ],
    decoys: [1, 2, 3, 4, 5, 10, 15, 25, 50],
  },

  // =========================
  // Lucky Numbers Themed Scratchers
  // =========================
  {
    id: "lucky_ocean_25",
    type: "lucky",
    themeKey: "ocean",
    name: "Lucky",
    themeLabel: "🌊 Deep Sea Vault",
    subtitle: "Match Winning Numbers to win prizes.",
    price: 25,

    // Lucky Numbers config:
    // - winNumsCount: how many “winning numbers”
    // - yourNumsCount: how many “your numbers”
    // - prizeTiers: weighted prize multiplier if you hit >=1 match
    // - matchChance: weighted chance of 0/1/2/3 matches (capped by winNumsCount)
    winNumsCount: 5,
    yourNumsCount: 10,

    // How many matches occur (predetermined)
    matchChance: [
      { matches: 0, weight: 7000 },
      { matches: 1, weight: 2200 },
      { matches: 2, weight: 700 },
      { matches: 3, weight: 100 },
    ],

    // Payout multiplier applied to price; picked if matches>0
    prizeTiers: [
      { label: "2x", mult: 2, weight: 5200 },
      { label: "5x", mult: 5, weight: 2700 },
      { label: "20x", mult: 20, weight: 900 },
      { label: "100x", mult: 100, weight: 200 },
    ],
  },

  {
    id: "lucky_baseball_50",
    type: "lucky",
    themeKey: "baseball",
    name: "Lucky",
    themeLabel: "🏟️ Ballpark Bonus",
    subtitle: "Match Winning Numbers to win prizes.",
    price: 50,
    winNumsCount: 5,
    yourNumsCount: 10,
    matchChance: [
      { matches: 0, weight: 7200 },
      { matches: 1, weight: 2100 },
      { matches: 2, weight: 600 },
      { matches: 3, weight: 100 },
    ],
    prizeTiers: [
      { label: "2x", mult: 2, weight: 5400 },
      { label: "5x", mult: 5, weight: 2600 },
      { label: "25x", mult: 25, weight: 850 },
      { label: "100x", mult: 100, weight: 150 },
    ],
  },
];
import { THEMES, THEME_KEYS } from "../slots/slots.themes.js"; // adjust path if needed

function pickMatch3IconSet(theme) {
  // Prefer the theme's iconic set: Wild + 4 mains (A,K,Q,J,T) if present.
  const keys = ["W", "A", "K", "Q", "J", "T"];
  const icons = keys.map(k => theme.icons?.[k]).filter(Boolean);

  // If any are missing, fall back to "all non-jackpot icons" and take first 6.
  if (icons.length >= 6) return icons.slice(0, 6);

  const fallback = Object.entries(theme.symbols || {})
    .filter(([code, s]) => !s?.jackpot) // exclude MJ/MR/MJ2 by default
    .map(([code]) => theme.icons?.[code])
    .filter(Boolean);

  // Unique + cap to 6
  return [...new Set(fallback)].slice(0, 6);
}

function themeLabelFor(themeKey, theme) {
  // Use the Wild icon + name as the label header
  const lead = theme?.icons?.W || "🎟️";
  return `${lead} ${theme?.name || themeKey}`;
}

function makeMatch3Ticket(themeKey, theme, price) {
  return {
    id: `match3_${themeKey}_${price}`,
    type: "match3",
    match3Mode: "perSet", // supports double/triple set wins if your engine is in perSet mode
    name: "Match3",
    themeKey: themeKey,
    themeLabel: themeLabelFor(themeKey, theme),
    slotThemeKey: themeKey,
    subtitle: "Match 3 symbols to win.",
    price,
    icons: pickMatch3IconSet(theme),

    // Keep your existing tier philosophy; tweak per price if you want
    tiers: [
      { label: "LOSE", mult: 0, weight: 7000 },
      { label: "2x", mult: 2, weight: 2200 },
      { label: "5x", mult: 5, weight: 650 },
      { label: "20x", mult: 20, weight: 130 },
      { label: "100x", mult: 100, weight: 20 },
    ],
    decoys: [1, 2, 3, 4, 5, 10, 20, 50],
  };
}

function makeLuckyTicket(themeKey, theme, price) {
  return {
    id: `lucky_${themeKey}_${price}`,
    type: "lucky",
    themeKey: themeKey,
    name: "Lucky",
    themeLabel: themeLabelFor(themeKey, theme),
    slotThemeKey: themeKey,
    subtitle: "Match Winning Numbers to win prizes.",
    price,

    winNumsCount: 5,
    yourNumsCount: 10,

    matchChance: [
      { matches: 0, weight: 7000 },
      { matches: 1, weight: 2200 },
      { matches: 2, weight: 700 },
      { matches: 3, weight: 100 },
    ],

    prizeTiers: [
      { label: "2x", mult: 2, weight: 5200 },
      { label: "5x", mult: 5, weight: 2700 },
      { label: "20x", mult: 20, weight: 900 },
      { label: "100x", mult: 100, weight: 200 },
    ],
  };
}

// --- Auto-create scratchers from your slot themes ---
const autoTickets = THEME_KEYS.flatMap((key) => {
  const theme = THEMES[key];
  // Choose price tiers however you like. Example: $25 + $50 for every theme.
  return [
    makeMatch3Ticket(key, theme, 25),
    makeLuckyTicket(key, theme, 25),
    makeMatch3Ticket(key, theme, 50),
    makeLuckyTicket(key, theme, 50),
  ];
});

export const manualTickets = [
  // =========================
  // Match-3 Themed Scratchers
  // =========================
  {
    id: "match3_grandslam_25",
    type: "match3",
    match3Mode: "single",
    name: "Match3",
    themeKey: "baseball",
    themeLabel: "⚾ Grand Slam Gold",
    slotThemeKey: "grand-slam-gold",
    subtitle: "Match 3 symbols to win.",
    price: 25,

    icons: ["⚾", "🧢", "🏟️", "🥇", "🎯"], // ← ADD THIS

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
    match3Mode: "perSet",
    themeKey: "neon",
    name: "Match3",
    themeLabel: "🌙 Neon Night 1985",
    slotThemeKey: "neon-night-1985",
    subtitle: "Match 3 amounts to win.",
    price: 50,
    icons: ["🌙","🎵","🕶️","💾","🌆"],

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
    match3Mode: "perSet",
    name: "Match3",
    themeLabel: "🛣️ Route 66 Riches",
    slotThemeKey: "route-66-riches",
    subtitle: "Match 3 amounts to win.",
    price: 25,
    icons: ["🛣️","⛽","🚗","🛻","🧭"],
    
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
    slotThemeKey: "treasure-armada",
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
    slotThemeKey: "college-baseball-nights",
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

export const tickets = [...manualTickets, ...autoTickets];
// games/scratch/scratch.tickets.js
import { THEMES } from "../slots/slots.themes.js"; // adjust path if needed

// ---- deterministic seeded RNG (stable across reloads) ----
function hash32(str) {
  // FNV-1a
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// ---- ticket factory ----
const PRICE_POOL = [10, 25, 50, 100];
const TYPE_POOL = ["match3", "lucky"];

function buildTicketForTheme(themeKey) {
  const theme = THEMES[themeKey];
  const rng = mulberry32(hash32(`scratch:${themeKey}`));

  const type = pick(rng, TYPE_POOL);
  const price = pick(rng, PRICE_POOL);

  // Label: use theme name; we can also prefix with wild icon if it exists
  const lead = theme?.icons?.W || "🎟️";
  const themeLabel = `${lead} ${theme?.name || themeKey}`;

  if (type === "lucky") {
    return {
      id: `lucky_${themeKey}_${price}`,
      type: "lucky",
      name: "Lucky Numbers",
      themeKey: themeKey,         // reuse for CSS data-theme if you want
      themeLabel,
      slotThemeKey: themeKey,     // keep so UI can theme consistently
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

  // match3
  const match3Mode = rng() < 0.60 ? "single" : "perSet"; // bias toward single
  return {
    id: `match3_${themeKey}_${match3Mode}_${price}`,
    type: "match3",
    match3Mode,
    name: match3Mode === "perSet" ? "Match3 (Multi)" : "Match3 (Single)",
    themeKey: themeKey,
    themeLabel,
    slotThemeKey: themeKey,
    subtitle:
      match3Mode === "perSet"
        ? "Each set of 3 matching symbols pays."
        : "Match 3 symbols to win.",
    price,
    doubleSetChance: 0.15,
  };
}

// ---- export: one ticket per slot theme (no repeats) ----
export const tickets = Object.keys(THEMES).map(buildTicketForTheme);
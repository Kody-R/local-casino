// games/slots/slots.themes.js

export const THEMES = {
  "vegas-gold": {
    name: "Vegas Gold",
    accent: "#d4af37",
    grid: { rows: 5, cols: 5 },

    icons: {
      W: "⭐",
      A: "A",
      K: "K",
      Q: "Q",
      J: "J",
      T: "10",
      S: "🟢",
      B: "🎁",
      C: "🪙",
      MJ: "🎟️",
      MR: "💠",
      MJ2: "👑",
    },

    symbols: {
      W: { name: "Wild", payout: { 3: 60, 4: 250, 5: 1200 }, wild: true },
      A: { name: "Ace", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "King", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Queen", payout: { 3: 6, 4: 20, 5: 80 } },
      J: { name: "Jack", payout: { 3: 5, 4: 16, 5: 65 } },
      T: { name: "Ten", payout: { 3: 4, 4: 12, 5: 50 } },

      S: { name: "Scatter", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Bonus", payout: {}, bonus: true },

      C: { name: "Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    // Instead of rigid strips, each reel has a weight table.
    // Higher number => more frequent.
    // You can tune these freely without rebuilding long strip arrays.
    weights: [
      // Reel 1 (slightly higher features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 2
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 3 (center reel often “juicier”)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 4,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      // Reel 4
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 5 (slightly lower features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    // This controls the "gentle boost" from higher total bet and more lines.
    // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
    biasPolicy: {
      maxScatterBoost: 1.2, // adds up to +1.2 weight to S at max settings
      maxBonusBoost: 0.8, // adds up to +0.8 to B
      maxCoinBoost: 1.8, // adds up to +1.8 to C (and tiny to jackpots)
      betScale: 60, // higher = slower ramp (more subtle)
    },

    paylines: [
      // --- 5 Straight Lines ---
      [2, 2, 2, 2, 2], // 1 Middle
      [1, 1, 1, 1, 1], // 2 Upper mid
      [3, 3, 3, 3, 3], // 3 Lower mid
      [0, 0, 0, 0, 0], // 4 Top
      [4, 4, 4, 4, 4], // 5 Bottom

      // --- 4 Diagonals ---
      [0, 1, 2, 3, 4], // 6 Down diagonal
      [4, 3, 2, 1, 0], // 7 Up diagonal
      [1, 2, 3, 2, 1], // 8 Shallow V
      [3, 2, 1, 2, 3], // 9 Inverted V

      // --- 6 Zig Zags ---
      [0, 0, 1, 0, 0], // 10
      [4, 4, 3, 4, 4], // 11
      [1, 1, 2, 1, 1], // 12
      [3, 3, 2, 3, 3], // 13
      [0, 1, 1, 1, 0], // 14
      [4, 3, 3, 3, 4], // 15

      // --- 5 W Shapes ---
      [0, 1, 0, 1, 0], // 16
      [4, 3, 4, 3, 4], // 17
      [1, 2, 1, 2, 1], // 18
      [3, 2, 3, 2, 3], // 19
      [0, 2, 4, 2, 0], // 20 Wide V

      // --- 5 Complex Patterns ---
      [2, 1, 0, 1, 2], // 21
      [2, 3, 4, 3, 2], // 22
      [1, 0, 1, 0, 1], // 23
      [3, 4, 3, 4, 3], // 24
      [2, 0, 2, 4, 2], // 25 Crown
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 8, 4: 12, 5: 20 } },

      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        // These are the "table defaults". If you use progressive, those values are paid instead.
        jackpots: { MINI: 50, MINOR: 200, MAJOR: 1000 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: {
          enabled: true,
          threshold: 250, // total coins across spins required
        },
      },
    },
  },

  "retro-fruit": {
    name: "Retro Fruit",
    accent: "#ff5aa5",
    showLabels: false,
    grid: { rows: 3, cols: 6 },

    symbols: {
      W: { name: "Wild", payout: { 3: 50, 4: 220, 5: 1000 }, wild: true },
      A: { name: "Cherry", payout: { 3: 8, 4: 25, 5: 100 } },
      K: { name: "Lemon", payout: { 3: 6, 4: 20, 5: 80 } },
      Q: { name: "Melon", payout: { 3: 5, 4: 16, 5: 65 } },
      J: { name: "Orange", payout: { 3: 4, 4: 12, 5: 50 } },
      T: { name: "Grape", payout: { 3: 10, 4: 35, 5: 140 } },
      S: { name: "Scatter", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Bonus", payout: {}, bonus: true },
      C: { name: "Coin", payout: {}, coin: true },
      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "⭐",
      A: "🍒",
      K: "🍋",
      Q: "🍉",
      J: "🍊",
      T: "🍇",
      S: "🔔",
      B: "🎰",
      C: "💰",
      MJ: "💵",
      MR: "💳",
      MJ2: "💎",
    },

    weights: [
      // Reel 1 (slightly higher features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 2
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 3 (center reel often “juicier”)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 4,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      // Reel 4
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 5 (slightly lower features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    // This controls the "gentle boost" from higher total bet and more lines.
    // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
    biasPolicy: {
      maxScatterBoost: 1.2, // adds up to +1.2 weight to S at max settings
      maxBonusBoost: 0.8, // adds up to +0.8 to B
      maxCoinBoost: 1.8, // adds up to +1.8 to C (and tiny to jackpots)
      betScale: 60, // higher = slower ramp (more subtle)
    },
    paylines: [
      // --- 5 Straight Lines ---
      [2, 2, 2, 2, 2], // 1 Middle
      [1, 1, 1, 1, 1], // 2 Upper mid
      [3, 3, 3, 3, 3], // 3 Lower mid
      [0, 0, 0, 0, 0], // 4 Top
      [4, 4, 4, 4, 4], // 5 Bottom

      // --- 4 Diagonals ---
      [0, 1, 2, 3, 4], // 6 Down diagonal
      [4, 3, 2, 1, 0], // 7 Up diagonal
      [1, 2, 3, 2, 1], // 8 Shallow V
      [3, 2, 1, 2, 3], // 9 Inverted V

      // --- 6 Zig Zags ---
      [0, 0, 1, 0, 0], // 10
      [4, 4, 3, 4, 4], // 11
      [1, 1, 2, 1, 1], // 12
      [3, 3, 2, 3, 3], // 13
      [0, 1, 1, 1, 0], // 14
      [4, 3, 3, 3, 4], // 15

      // --- 5 W Shapes ---
      [0, 1, 0, 1, 0], // 16
      [4, 3, 4, 3, 4], // 17
      [1, 2, 1, 2, 1], // 18
      [3, 2, 3, 2, 3], // 19
      [0, 2, 4, 2, 0], // 20 Wide V

      // --- 5 Complex Patterns ---
      [2, 1, 0, 1, 2], // 21
      [2, 3, 4, 3, 2], // 22
      [1, 0, 1, 0, 1], // 23
      [3, 4, 3, 4, 3], // 24
      [2, 0, 2, 4, 2], // 25 Crown
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 6, 4: 10, 5: 15 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 40, MINOR: 150, MAJOR: 800 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 }, // % of paid bet
        },
        meter: {
          enabled: true,
          threshold: 250, // total coins across spins required
        },
      },
    },
  },
  "space-heist": {
    name: "Space Heist",
    accent: "#38bdf8",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "UFO", payout: { 3: 70, 4: 300, 5: 1500 }, wild: true },
      A: { name: "Diamond", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Satellite", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "DNA", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Blaster", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Bolt", payout: { 3: 4, 4: 14, 5: 60 } },
      S: { name: "Galaxy", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Robber", payout: {}, bonus: true },
      C: { name: "Crypto", payout: {}, coin: true },
      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🛸", // Wild = UFO tech
      A: "💎", // Diamond
      K: "🛰️", // Satellite
      Q: "🧬", // DNA / sci-fi
      J: "🔫", // Blaster
      T: "⚡", // Energy
      S: "🌌", // Scatter = galaxy
      B: "🕵️", // Pick bonus = heist
      C: "💰", // Coin
      MJ: "🪙", // MINI
      MR: "💠", // MINOR
      MJ2: "👑", // MAJOR
    },

    weights: [
      // Reel 1 (slightly higher features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 2
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 3 (center reel often “juicier”)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 4,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      // Reel 4
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 5 (slightly lower features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    // This controls the "gentle boost" from higher total bet and more lines.
    // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
    biasPolicy: {
      maxScatterBoost: 1.2, // adds up to +1.2 weight to S at max settings
      maxBonusBoost: 0.8, // adds up to +0.8 to B
      maxCoinBoost: 1.8, // adds up to +1.8 to C (and tiny to jackpots)
      betScale: 60, // higher = slower ramp (more subtle)
    },
    paylines: [
      // --- 5 Straight Lines ---
      [2, 2, 2, 2, 2], // 1 Middle
      [1, 1, 1, 1, 1], // 2 Upper mid
      [3, 3, 3, 3, 3], // 3 Lower mid
      [0, 0, 0, 0, 0], // 4 Top
      [4, 4, 4, 4, 4], // 5 Bottom

      // --- 4 Diagonals ---
      [0, 1, 2, 3, 4], // 6 Down diagonal
      [4, 3, 2, 1, 0], // 7 Up diagonal
      [1, 2, 3, 2, 1], // 8 Shallow V
      [3, 2, 1, 2, 3], // 9 Inverted V

      // --- 6 Zig Zags ---
      [0, 0, 1, 0, 0], // 10
      [4, 4, 3, 4, 4], // 11
      [1, 1, 2, 1, 1], // 12
      [3, 3, 2, 3, 3], // 13
      [0, 1, 1, 1, 0], // 14
      [4, 3, 3, 3, 4], // 15

      // --- 5 W Shapes ---
      [0, 1, 0, 1, 0], // 16
      [4, 3, 4, 3, 4], // 17
      [1, 2, 1, 2, 1], // 18
      [3, 2, 3, 2, 3], // 19
      [0, 2, 4, 2, 0], // 20 Wide V

      // --- 5 Complex Patterns ---
      [2, 1, 0, 1, 2], // 21
      [2, 3, 4, 3, 2], // 22
      [1, 0, 1, 0, 1], // 23
      [3, 4, 3, 4, 3], // 24
      [2, 0, 2, 4, 2], // 25 Crown
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 75, MINOR: 300, MAJOR: 1500 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 }, // % of paid bet
        },
        meter: {
          enabled: true,
          threshold: 250, // total coins across spins required
        },
      },
    },
  },
  "dragon-vault": {
    name: "Dragon Vault",
    accent: "#ef4444",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Dragon", payout: { 3: 80, 4: 350, 5: 1800 }, wild: true },
      A: { name: "Letter", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Lantern", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Note", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Fire", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Medal", payout: { 3: 4, 4: 14, 5: 60 } },
      S: { name: "Sun", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Palace", payout: {}, bonus: true },
      C: { name: "Gold Coin", payout: {}, coin: true },
      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🐉",
      A: "🧧",
      K: "🏮",
      Q: "🀄",
      J: "🔥",
      T: "🥇",
      S: "🎇",
      B: "🏯",
      C: "🪙",
      MJ: "🐲",
      MR: "💰",
      MJ2: "👑",
    },

    weights: [
      // Reel 1 (slightly higher features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 2
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 3 (center reel often “juicier”)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 4,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      // Reel 4
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 5 (slightly lower features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    // This controls the "gentle boost" from higher total bet and more lines.
    // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
    biasPolicy: {
      maxScatterBoost: 1.2, // adds up to +1.2 weight to S at max settings
      maxBonusBoost: 0.8, // adds up to +0.8 to B
      maxCoinBoost: 1.8, // adds up to +1.8 to C (and tiny to jackpots)
      betScale: 60, // higher = slower ramp (more subtle)
    },
    paylines: [
      // --- 5 Straight Lines ---
      [2, 2, 2, 2, 2], // 1 Middle
      [1, 1, 1, 1, 1], // 2 Upper mid
      [3, 3, 3, 3, 3], // 3 Lower mid
      [0, 0, 0, 0, 0], // 4 Top
      [4, 4, 4, 4, 4], // 5 Bottom

      // --- 4 Diagonals ---
      [0, 1, 2, 3, 4], // 6 Down diagonal
      [4, 3, 2, 1, 0], // 7 Up diagonal
      [1, 2, 3, 2, 1], // 8 Shallow V
      [3, 2, 1, 2, 3], // 9 Inverted V

      // --- 6 Zig Zags ---
      [0, 0, 1, 0, 0], // 10
      [4, 4, 3, 4, 4], // 11
      [1, 1, 2, 1, 1], // 12
      [3, 3, 2, 3, 3], // 13
      [0, 1, 1, 1, 0], // 14
      [4, 3, 3, 3, 4], // 15

      // --- 5 W Shapes ---
      [0, 1, 0, 1, 0], // 16
      [4, 3, 4, 3, 4], // 17
      [1, 2, 1, 2, 1], // 18
      [3, 2, 3, 2, 3], // 19
      [0, 2, 4, 2, 0], // 20 Wide V

      // --- 5 Complex Patterns ---
      [2, 1, 0, 1, 2], // 21
      [2, 3, 4, 3, 2], // 22
      [1, 0, 1, 0, 1], // 23
      [3, 4, 3, 4, 3], // 24
      [2, 0, 2, 4, 2], // 25 Crown
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 8, 4: 12, 5: 20 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 100, MINOR: 400, MAJOR: 2000 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 }, // % of paid bet
        },
        meter: {
          enabled: true,
          threshold: 250, // total coins across spins required
        },
      },
    },
  },
  "tropical-treasure": {
    name: "Tropical Treasure",
    accent: "#22c55e",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Parrot", payout: { 3: 70, 4: 300, 5: 1500 }, wild: true },
      A: { name: "Tree", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Rock", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Iris", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Coconut", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Pineapple", payout: { 3: 4, 4: 14, 5: 60 } },
      S: { name: "Wave", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Map", payout: {}, bonus: true },
      C: { name: "Doubloon", payout: {}, coin: true },
      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🦜",
      A: "🏝️",
      K: "🗿",
      Q: "🌺",
      J: "🥥",
      T: "🍍",
      S: "🌊",
      B: "🗺️",
      C: "🪙",
      MJ: "💰",
      MR: "💎",
      MJ2: "👑",
    },

    weights: [
      // Reel 1 (slightly higher features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 2
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 3 (center reel often “juicier”)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 4,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      // Reel 4
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 2,
        B: 1,
        C: 3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 5 (slightly lower features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    // This controls the "gentle boost" from higher total bet and more lines.
    // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
    biasPolicy: {
      maxScatterBoost: 1.2, // adds up to +1.2 weight to S at max settings
      maxBonusBoost: 0.8, // adds up to +0.8 to B
      maxCoinBoost: 1.8, // adds up to +1.8 to C (and tiny to jackpots)
      betScale: 60, // higher = slower ramp (more subtle)
    },
    paylines: [
      // --- 5 Straight Lines ---
      [2, 2, 2, 2, 2], // 1 Middle
      [1, 1, 1, 1, 1], // 2 Upper mid
      [3, 3, 3, 3, 3], // 3 Lower mid
      [0, 0, 0, 0, 0], // 4 Top
      [4, 4, 4, 4, 4], // 5 Bottom

      // --- 4 Diagonals ---
      [0, 1, 2, 3, 4], // 6 Down diagonal
      [4, 3, 2, 1, 0], // 7 Up diagonal
      [1, 2, 3, 2, 1], // 8 Shallow V
      [3, 2, 1, 2, 3], // 9 Inverted V

      // --- 6 Zig Zags ---
      [0, 0, 1, 0, 0], // 10
      [4, 4, 3, 4, 4], // 11
      [1, 1, 2, 1, 1], // 12
      [3, 3, 2, 3, 3], // 13
      [0, 1, 1, 1, 0], // 14
      [4, 3, 3, 3, 4], // 15

      // --- 5 W Shapes ---
      [0, 1, 0, 1, 0], // 16
      [4, 3, 4, 3, 4], // 17
      [1, 2, 1, 2, 1], // 18
      [3, 2, 3, 2, 3], // 19
      [0, 2, 4, 2, 0], // 20 Wide V

      // --- 5 Complex Patterns ---
      [2, 1, 0, 1, 2], // 21
      [2, 3, 4, 3, 2], // 22
      [1, 0, 1, 0, 1], // 23
      [3, 4, 3, 4, 3], // 24
      [2, 0, 2, 4, 2], // 25 Crown
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 8, 4: 12, 5: 20 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 60, MINOR: 250, MAJOR: 1200 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 }, // % of paid bet
        },
        meter: {
          enabled: true,
          threshold: 250, // total coins across spins required
        },
      },
    },
  },

  "neon-night-1985": {
    name: "Neon Night 1985",
    accent: "#ff2bd6",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Guitar", payout: { 3: 70, 4: 300, 5: 1600 }, wild: true },

      A: { name: "Sunglasses", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "BoomBox", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Arcade", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Cassette", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Roller", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Skyline", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "VHS Bonus", payout: {}, bonus: true },
      C: { name: "Neon Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🎸",
      A: "🕶️",
      K: "📻",
      Q: "🕹️",
      J: "💿",
      T: "🛼",
      S: "🌆",
      B: "📼",
      C: "💰",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    weights: [
      // Reel 1 (slightly higher features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.0,
        B: 1.0,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 2
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 3 (juicier)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.2,
        S: 2.1,
        B: 1.05,
        C: 4.0,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      // Reel 4
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 5 (slightly lower features)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    // Slightly more “feature-forward” than base vegas-gold, but still subtle.
    biasPolicy: {
      maxScatterBoost: 1.3,
      maxBonusBoost: 0.9,
      maxCoinBoost: 2.0,
      betScale: 55,
    },

    // Reuse the same 25 paylines for consistency across your slots pack
    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },

      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        jackpots: { MINI: 60, MINOR: 250, MAJOR: 1200 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "gridiron-glory": {
    name: "Gridiron Glory",
    accent: "#22c55e",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Touchdown", payout: { 3: 80, 4: 360, 5: 1800 }, wild: true },

      A: { name: "Helmet", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Football", payout: { 3: 8, 4: 30, 5: 120 } },
      Q: { name: "Goalpost", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Cleats", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Whistle", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Stadium", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Playbook Bonus", payout: {}, bonus: true },
      C: { name: "Yard Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🏈",
      A: "🪖", // helmet-ish; emoji set varies per platform
      K: "🏈",
      Q: "🥅",
      J: "👟",
      T: "📣",
      S: "🏟️",
      B: "📋",
      C: "🪙",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Slightly “tighter” on features, higher symbol pay ceiling => feels punchier.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.85,
        C: 2.6,
        MJ: 0.09,
        MR: 0.045,
        MJ2: 0.018,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.85,
        C: 2.6,
        MJ: 0.09,
        MR: 0.045,
        MJ2: 0.018,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.05,
        S: 1.9,
        B: 0.9,
        C: 3.3,
        MJ: 0.11,
        MR: 0.055,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.85,
        C: 2.6,
        MJ: 0.09,
        MR: 0.045,
        MJ2: 0.018,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.8,
        S: 1.6,
        B: 0.75,
        C: 2.3,
        MJ: 0.075,
        MR: 0.035,
        MJ2: 0.014,
      },
    ],

    biasPolicy: {
      // keep boosts subtle—this theme is already “spiky”
      maxScatterBoost: 1.1,
      maxBonusBoost: 0.7,
      maxCoinBoost: 1.6,
      betScale: 70,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 8, 4: 12, 5: 20 } },

      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        // Higher “event” jackpots for the sports theme
        jackpots: { MINI: 75, MINOR: 300, MAJOR: 1500 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "arctic-fortune": {
    name: "Arctic Fortune",
    accent: "#60a5fa",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Ice Wolf", payout: { 3: 75, 4: 320, 5: 1700 }, wild: true },

      A: { name: "Ice Crown", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Snow Owl", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Crystal", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Lantern", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Pine", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Aurora", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Glacier Bonus", payout: {}, bonus: true },
      C: { name: "Ice Crystal", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🐺",
      A: "❄️",
      K: "🦉",
      Q: "💠",
      J: "🏮",
      T: "🌲",
      S: "🌌",
      B: "🏔️",
      C: "🧊",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Higher coin presence + the freeze mechanic => strong “collector” feel.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 1.9,
        B: 0.95,
        C: 3.6,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 1.9,
        B: 0.95,
        C: 3.6,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.2,
        S: 2.0,
        B: 1.0,
        C: 4.2,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 1.9,
        B: 0.95,
        C: 3.6,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.7,
        B: 0.85,
        C: 3.2,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.15,
      maxBonusBoost: 0.75,
      maxCoinBoost: 2.2,
      betScale: 60,
    },

    // Reuse your standard 25 paylines for compatibility :contentReference[oaicite:2]{index=2}
    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    // NEW (optional): theme-specific spin behavior
    mechanics: {
      frozenCoins: {
        enabled: true,
        // chance each landed coin becomes “frozen” and persists into the next spin
        freezeChance: 0.35,
        // max spins a frozen coin can persist before it melts
        maxHoldSpins: 1,
      },
    },

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 8, 4: 12, 5: 20 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 70, MINOR: 275, MAJOR: 1350 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },
  "outlaw-riches": {
    name: "Outlaw Riches",
    accent: "#f59e0b",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: {
        name: "Sheriff Star",
        payout: { 3: 70, 4: 320, 5: 1650 },
        wild: true,
      },

      A: { name: "Hat", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Boot", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Cactus", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Revolver", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Wagon", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Sunset", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Duel Bonus", payout: {}, bonus: true },
      C: { name: "Gold Nugget", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "⭐",
      A: "🤠",
      K: "🥾",
      Q: "🌵",
      J: "🔫",
      T: "🛻",
      S: "🌅",
      B: "⚔️",
      C: "🪙",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // HIGH coin frequency machine
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.7,
        B: 0.95,
        C: 4.2,
        MJ: 0.11,
        MR: 0.055,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.7,
        B: 0.95,
        C: 4.2,
        MJ: 0.11,
        MR: 0.055,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 1.8,
        B: 1.0,
        C: 4.8,
        MJ: 0.13,
        MR: 0.065,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.7,
        B: 0.95,
        C: 4.2,
        MJ: 0.11,
        MR: 0.055,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.8,
        S: 1.5,
        B: 0.85,
        C: 3.9,
        MJ: 0.09,
        MR: 0.045,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.05,
      maxBonusBoost: 0.75,
      maxCoinBoost: 2.6, // biggest coin push of your pack
      betScale: 55,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    // Cosmetic-only hook: if your UI wants to show “two respins at once”
    mechanics: {
      duelMode: { enabled: true }, // purely for UI flair unless you wire it deeper
    },

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 6, 4: 10, 5: 15 } },

      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        // Slightly richer defaults (fits “coin-forward” identity)
        jackpots: { MINI: 80, MINOR: 320, MAJOR: 1600 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "hollywood-high-roller": {
    name: "Hollywood High Roller",
    accent: "#d4af37",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Spotlight", payout: { 3: 70, 4: 300, 5: 1600 }, wild: true },

      A: { name: "Star", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Director", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Champagne", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Camera", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Ticket", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Red Carpet", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Awards Bonus", payout: {}, bonus: true },
      C: { name: "Diamond", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🎭",
      A: "⭐",
      K: "🎬",
      Q: "🍾",
      J: "📷",
      T: "🎟️",
      S: "🟥",
      B: "🏆",
      C: "💎",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Same base “shape” as your other themes: R3 slightly juicier, R5 slightly lower features.
    weights: [
      // Reel 1
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 2
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 3 (juicier)
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.1,
        B: 1.05,
        C: 4.0,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      // Reel 4
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      // Reel 5
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.9,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    // Keep in-family with your standard “gentle boost” approach.
    biasPolicy: {
      maxScatterBoost: 1.2,
      maxBonusBoost: 0.85,
      maxCoinBoost: 1.9,
      betScale: 60,
    },

    // Same 25 paylines used across your pack (copy/paste safe).
    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      // “Premiere Night” free spins feel: slightly higher awards like Space Heist
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },

      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        // Slightly richer “high roller” table
        jackpots: { MINI: 75, MINOR: 300, MAJOR: 1500 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "midnight-manor": {
    name: "Midnight Manor",
    accent: "#7c3aed",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Candle", payout: { 3: 75, 4: 320, 5: 1700 }, wild: true },

      A: { name: "Haunted Mirror", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Raven", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Skull", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Key", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Gravestone", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Blood Moon", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Manor Bonus", payout: {}, bonus: true },
      C: { name: "Blood Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🕯️",
      A: "🪞",
      K: "🦅",
      Q: "💀",
      J: "🗝️",
      T: "🪦",
      S: "🌕",
      B: "🏚️",
      C: "🩸",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Horror = a bit spikier: slightly tighter on coins, stronger wild.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 1.9,
        B: 0.95,
        C: 2.8,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 1.9,
        B: 0.95,
        C: 2.8,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.2,
        S: 2.0,
        B: 1.0,
        C: 3.6,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 1.9,
        B: 0.95,
        C: 2.8,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.7,
        B: 0.85,
        C: 2.5,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.15,
      maxBonusBoost: 0.8,
      maxCoinBoost: 1.6,
      betScale: 65,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 8, 4: 12, 5: 20 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 70, MINOR: 275, MAJOR: 1400 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "treasure-armada": {
    name: "Treasure Armada",
    accent: "#0ea5e9",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: {
        name: "Pirate Flag",
        payout: { 3: 70, 4: 300, 5: 1600 },
        wild: true,
      },

      A: { name: "Treasure Chest", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Captain", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Compass", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Anchor", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Map", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Spyglass", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Key Bonus", payout: {}, bonus: true },
      C: { name: "Doubloon", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🏴‍☠️",
      A: "🧰",
      K: "🧔‍☠️",
      Q: "🧭",
      J: "⚓",
      T: "🗺️",
      S: "🔭",
      B: "🗝️",
      C: "🪙",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Adventure = balanced: decent scatters + coins, nice feel without being too hot.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.2,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.2,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.1,
        B: 1.05,
        C: 4.1,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.2,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.9,
        C: 2.9,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.25,
      maxBonusBoost: 0.85,
      maxCoinBoost: 2.0,
      betScale: 60,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 75, MINOR: 300, MAJOR: 1500 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "wizards-relics": {
    name: "Wizard’s Relics",
    accent: "#22c55e",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: {
        name: "Crystal Ball",
        payout: { 3: 70, 4: 300, 5: 1600 },
        wild: true,
      },

      A: { name: "Spellbook", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Wizard Hat", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Staff", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Potion", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Rune", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Scroll", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Relic Bonus", payout: {}, bonus: true },
      C: { name: "Mana Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🔮",
      A: "📕",
      K: "🧙",
      Q: "🪄",
      J: "🧪",
      T: "ᚱ",
      S: "📜",
      B: "💎",
      C: "✨",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Fantasy = feature-forward but controlled: slightly higher scatters/bonus, medium coins.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.2,
        B: 1.1,
        C: 3.8,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.9,
        B: 0.95,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.3,
      maxBonusBoost: 0.95,
      maxCoinBoost: 1.8,
      betScale: 60,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 70, MINOR: 290, MAJOR: 1450 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "thunderstrike-temple": {
    name: "Thunderstrike Temple",
    accent: "#fbbf24",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: {
        name: "Lightning Wild",
        payout: { 3: 85, 4: 380, 5: 2000 },
        wild: true,
      },

      A: { name: "Temple Idol", payout: { 3: 12, 4: 45, 5: 170 } },
      K: { name: "Thunder Drum", payout: { 3: 9, 4: 34, 5: 130 } },
      Q: { name: "Stone Mask", payout: { 3: 7, 4: 26, 5: 100 } },
      J: { name: "Totem", payout: { 3: 6, 4: 20, 5: 80 } },
      T: { name: "Torch", payout: { 3: 5, 4: 16, 5: 65 } },

      S: { name: "Monolith", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Temple Bonus", payout: {}, bonus: true },
      C: { name: "Fire Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "⚡",
      A: "🗿",
      K: "🥁",
      Q: "🎭",
      J: "🪵",
      T: "🕯️",
      S: "🗿",
      B: "🏛️",
      C: "🔥",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // High-volatility: tighter scatters/bonus/coins; Reel 3 still slightly juicier.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.8,
        S: 1.6,
        B: 0.75,
        C: 2.2,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.8,
        S: 1.6,
        B: 0.75,
        C: 2.2,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 1.7,
        B: 0.8,
        C: 2.8,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.018,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.8,
        S: 1.6,
        B: 0.75,
        C: 2.2,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.7,
        S: 1.5,
        B: 0.7,
        C: 2.0,
        MJ: 0.07,
        MR: 0.035,
        MJ2: 0.012,
      },
    ],

    // Keep boosts modest so the “spiky” identity remains.
    biasPolicy: {
      maxScatterBoost: 1.05,
      maxBonusBoost: 0.6,
      maxCoinBoost: 1.25,
      betScale: 80,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      // Slightly lower free-spin frequency/awards to maintain volatility
      freeSpins: { scatterNeeded: 3, awards: { 3: 6, 4: 10, 5: 15 } },

      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        jackpots: { MINI: 80, MINOR: 320, MAJOR: 1700 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "route-66-riches": {
    name: "Route 66 Riches",
    accent: "#ef4444",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: {
        name: "Highway Wild",
        payout: { 3: 65, 4: 280, 5: 1500 },
        wild: true,
      },

      A: { name: "Neon Sign", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Classic Car", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Diner", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Motel", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Guitar", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Gas Pump", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Road Trip Bonus", payout: {}, bonus: true },
      C: { name: "Cash", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🛣️",
      A: "🚦",
      K: "🚗",
      Q: "🍔",
      J: "🏨",
      T: "🎸",
      S: "⛽",
      B: "🚗",
      C: "💰",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Americana: comfy, slightly coin-forward, “reel 3 juicier” like your other themes.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.4,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.4,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.1,
        B: 1.05,
        C: 4.3,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.4,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.9,
        C: 3.0,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.25,
      maxBonusBoost: 0.85,
      maxCoinBoost: 2.2,
      betScale: 60,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 70, MINOR: 290, MAJOR: 1450 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "cyber-samurai": {
    name: "Cyber Samurai",
    accent: "#06b6d4",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Ninja Wild", payout: { 3: 70, 4: 300, 5: 1600 }, wild: true },

      A: { name: "Neon Mask", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Katana", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Mech Arm", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Chipset", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Drone", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Network", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Blade Bonus", payout: {}, bonus: true },
      C: { name: "Diamond", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🥷",
      A: "🎭",
      K: "🗡️",
      Q: "🦾",
      J: "💾",
      T: "🛸",
      S: "🌐",
      B: "🗡️",
      C: "💎",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Sci-fi: slightly feature-forward (scatters/bonus), medium coins.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.2,
        B: 1.1,
        C: 3.8,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.9,
        B: 0.95,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.3,
      maxBonusBoost: 0.95,
      maxCoinBoost: 1.8,
      betScale: 60,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 70, MINOR: 300, MAJOR: 1500 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },
  "grand-slam-gold": {
    name: "Grand Slam Gold",
    accent: "#2563eb",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: {
        name: "Baseball Wild",
        payout: { 3: 70, 4: 300, 5: 1600 },
        wild: true,
      },

      A: { name: "Golden Bat", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Glove", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Home Plate", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Stitches", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Helmet", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Ballpark", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Gold Medal Bonus", payout: {}, bonus: true },
      C: { name: "Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "⚾",
      A: "🏏",
      K: "🧤",
      Q: "⬜",
      J: "🧵",
      T: "🪖",
      S: "🏟️",
      B: "🥇",
      C: "🪙",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Baseball: balanced feature rate; slightly coin-forward for “collect coins = rallies” feel.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.1,
        B: 1.05,
        C: 4.2,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.9,
        C: 3.0,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.25,
      maxBonusBoost: 0.85,
      maxCoinBoost: 2.2,
      betScale: 60,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        jackpots: { MINI: 70, MINOR: 290, MAJOR: 1450 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "deep-sea-vault": {
    name: "Deep Sea Vault",
    accent: "#0ea5e9",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: {
        name: "Octopus Wild",
        payout: { 3: 70, 4: 300, 5: 1600 },
        wild: true,
      },

      A: { name: "Treasure Pearl", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Diver Helm", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Sea Chest", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Coral", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Shell", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Wave", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Anchor Bonus", payout: {}, bonus: true },
      C: { name: "Crystal", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "🐙",
      A: "🦪",
      K: "🤿",
      Q: "🧰",
      J: "🪸",
      T: "🐚",
      S: "🌊",
      B: "⚓",
      C: "💠",
      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    // Underwater: feature-forward “exploration” feel; coins moderate, scatters/bonus slightly up.
    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.2,
        B: 1.1,
        C: 3.8,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.1,
        B: 1.05,
        C: 3.0,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.9,
        B: 0.95,
        C: 2.7,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.3,
      maxBonusBoost: 0.95,
      maxCoinBoost: 1.8,
      betScale: 60,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },

        jackpots: { MINI: 70, MINOR: 300, MAJOR: 1500 },

        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },

  "college-baseball-nights": {
    name: "College Baseball Nights",
    accent: "#f54242",
    showLabels: false,
    grid: { rows: 5, cols: 5 },

    symbols: {
      W: { name: "Rally Ball", payout: { 3: 70, 4: 300, 5: 1600 }, wild: true },

      A: { name: "Power Bat", payout: { 3: 10, 4: 35, 5: 140 } },
      K: { name: "Web Glove", payout: { 3: 8, 4: 28, 5: 110 } },
      Q: { name: "Home Plate", payout: { 3: 6, 4: 22, 5: 90 } },
      J: { name: "Hot Corner", payout: { 3: 5, 4: 18, 5: 75 } },
      T: { name: "Pitcher Mound", payout: { 3: 4, 4: 14, 5: 60 } },

      S: { name: "Ballpark", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
      B: { name: "Gold Medal Bonus", payout: {}, bonus: true },
      C: { name: "Coin", payout: {}, coin: true },

      MJ: { name: "MINI", payout: {}, jackpot: "MINI" },
      MR: { name: "MINOR", payout: {}, jackpot: "MINOR" },
      MJ2: { name: "MAJOR", payout: {}, jackpot: "MAJOR" },
    },

    icons: {
      W: "⚾", // Wild

      A: "🏏", // Bat (closest we get visually)
      K: "🧤", // Glove
      Q: "⬟", // Home plate style diamond shape (unique)
      J: "📍", // Corner marker
      T: "🟫", // Mound dirt

      S: "🏟️", // Scatter
      B: "🥇", // Bonus
      C: "🪙", // Coin

      MJ: "💵",
      MR: "💳",
      MJ2: "👑",
    },

    weights: [
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.1,
        S: 2.1,
        B: 1.05,
        C: 4.2,
        MJ: 0.12,
        MR: 0.06,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 2.0,
        S: 2.0,
        B: 1.0,
        C: 3.3,
        MJ: 0.1,
        MR: 0.05,
        MJ2: 0.02,
      },
      {
        A: 18,
        K: 18,
        Q: 16,
        J: 14,
        T: 14,
        W: 1.9,
        S: 1.8,
        B: 0.9,
        C: 3.0,
        MJ: 0.08,
        MR: 0.04,
        MJ2: 0.015,
      },
    ],

    biasPolicy: {
      maxScatterBoost: 1.25,
      maxBonusBoost: 0.85,
      maxCoinBoost: 2.2,
      betScale: 60,
    },

    paylines: [
      [2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4],
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [1, 2, 3, 2, 1],
      [3, 2, 1, 2, 3],
      [0, 0, 1, 0, 0],
      [4, 4, 3, 4, 4],
      [1, 1, 2, 1, 1],
      [3, 3, 2, 3, 3],
      [0, 1, 1, 1, 0],
      [4, 3, 3, 3, 4],
      [0, 1, 0, 1, 0],
      [4, 3, 4, 3, 4],
      [1, 2, 1, 2, 1],
      [3, 2, 3, 2, 3],
      [0, 2, 4, 2, 0],
      [2, 1, 0, 1, 2],
      [2, 3, 4, 3, 2],
      [1, 0, 1, 0, 1],
      [3, 4, 3, 4, 3],
      [2, 0, 2, 4, 2],
    ],

    bonus: {
      freeSpins: { scatterNeeded: 3, awards: { 3: 10, 4: 15, 5: 25 } },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid: { rows: 5, cols: 5 },
        jackpots: { MINI: 70, MINOR: 290, MAJOR: 1450 },
        progressive: {
          seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
          rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 },
        },
        meter: { enabled: true, threshold: 250 },
      },
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES);

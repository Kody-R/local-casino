// games/slots/slots.themes.js

export const THEMES = {
 "vegas-gold": {
  name: "Vegas Gold",
  accent: "#d4af37",
  grid:{rows:5,cols:5},

  icons: {
    W:"⭐",
    A:"A", K:"K", Q:"Q", J:"J", T:"10",
    S:"🟢",
    B:"🎁",
    C:"🪙",
    MJ:"🎟️",
    MR:"💠",
    MJ2:"👑",
  },

  symbols: {
    W:  { name:"Wild",   payout:{3:60,4:250,5:1200}, wild:true },
    A:  { name:"Ace",    payout:{3:10,4:35,5:140} },
    K:  { name:"King",   payout:{3:8,4:28,5:110} },
    Q:  { name:"Queen",  payout:{3:6,4:20,5:80} },
    J:  { name:"Jack",   payout:{3:5,4:16,5:65} },
    T:  { name:"Ten",    payout:{3:4,4:12,5:50} },

    S:  { name:"Scatter", payout:{3:2,4:10,5:50}, scatter:true },
    B:  { name:"Bonus",   payout:{}, bonus:true },

    C:  { name:"Coin", payout:{}, coin:true },

    MJ:  { name:"MINI",  payout:{}, jackpot:"MINI" },
    MR:  { name:"MINOR", payout:{}, jackpot:"MINOR" },
    MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
  },

  // Instead of rigid strips, each reel has a weight table.
  // Higher number => more frequent.
  // You can tune these freely without rebuilding long strip arrays.
  weights: [
    // Reel 1 (slightly higher features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 2
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 3 (center reel often “juicier”)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:4, MJ:0.12, MR:0.06, MJ2:0.02 },
    // Reel 4
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 5 (slightly lower features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:1.8, B:0.9, C:2.7, MJ:0.08, MR:0.04, MJ2:0.015 },
  ],

  // This controls the "gentle boost" from higher total bet and more lines.
  // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
  biasPolicy: {
    maxScatterBoost: 1.2,  // adds up to +1.2 weight to S at max settings
    maxBonusBoost:   0.8,  // adds up to +0.8 to B
    maxCoinBoost:    1.8,  // adds up to +1.8 to C (and tiny to jackpots)
    betScale: 60,          // higher = slower ramp (more subtle)
  },

paylines: [
  // --- 5 Straight Lines ---
  [2,2,2,2,2], // 1 Middle
  [1,1,1,1,1], // 2 Upper mid
  [3,3,3,3,3], // 3 Lower mid
  [0,0,0,0,0], // 4 Top
  [4,4,4,4,4], // 5 Bottom

  // --- 4 Diagonals ---
  [0,1,2,3,4], // 6 Down diagonal
  [4,3,2,1,0], // 7 Up diagonal
  [1,2,3,2,1], // 8 Shallow V
  [3,2,1,2,3], // 9 Inverted V

  // --- 6 Zig Zags ---
  [0,0,1,0,0], // 10
  [4,4,3,4,4], // 11
  [1,1,2,1,1], // 12
  [3,3,2,3,3], // 13
  [0,1,1,1,0], // 14
  [4,3,3,3,4], // 15

  // --- 5 W Shapes ---
  [0,1,0,1,0], // 16
  [4,3,4,3,4], // 17
  [1,2,1,2,1], // 18
  [3,2,3,2,3], // 19
  [0,2,4,2,0], // 20 Wide V

  // --- 5 Complex Patterns ---
  [2,1,0,1,2], // 21
  [2,3,4,3,2], // 22
  [1,0,1,0,1], // 23
  [3,4,3,4,3], // 24
  [2,0,2,4,2], // 25 Crown
],



  bonus: {
    freeSpins: { scatterNeeded: 3, awards: {3: 8, 4: 12, 5: 20} },

    holdSpin: {
      triggerCoins: 6,
      respins: 3,
      grid: { rows: 5, cols: 5 },

      // These are the "table defaults". If you use progressive, those values are paid instead.
      jackpots: { MINI: 50, MINOR: 200, MAJOR: 1000 },

      progressive: {
        seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
        rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
        betScale: { baseBet: 1, maxMult: 50 }
      },
      meter: {
        enabled: true,
        threshold: 250  // total coins across spins required
      }

    }
  }

  },

  "retro-fruit": {
    name: "Retro Fruit",
    accent: "#ff5aa5",
    showLabels: false,
    grid:{rows:5,cols:5},

    symbols: {
      W: { name:"Wild", payout:{3:50,4:220,5:1000}, wild:true },
      A: { name:"Cherry", payout:{3:8,4:25,5:100} },
      K: { name:"Lemon",  payout:{3:6,4:20,5:80}  },
      Q: { name:"Melon", payout:{3:5,4:16,5:65}  },
      J: { name:"Orange",   payout:{3:4,4:12,5:50}  },
      T: { name:"Grape",    payout:{3:10,4:35,5:140} },
      S: { name:"Scatter", payout:{3:2,4:10,5:50}, scatter:true },
      B: { name:"Bonus", payout:{}, bonus:true },
      C: { name:"Coin", payout:{}, coin:true },
      MJ:{ name:"MINI", payout:{}, jackpot:"MINI" },
      MR:{ name:"MINOR",payout:{}, jackpot:"MINOR" },
      MJ2:{ name:"MAJOR",payout:{}, jackpot:"MAJOR" },
    },

icons: {
  W:"⭐",
  A:"🍒",
  K:"🍋",
  Q:"🍉",
  J:"🍊",
  T:"🍇",
  S:"🔔",
  B:"🎰",
  C:"💰",
  MJ:"💵",
  MR:"💳",
  MJ2:"💎",
},


    weights: [
    // Reel 1 (slightly higher features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 2
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 3 (center reel often “juicier”)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:4, MJ:0.12, MR:0.06, MJ2:0.02 },
    // Reel 4
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 5 (slightly lower features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:1.8, B:0.9, C:2.7, MJ:0.08, MR:0.04, MJ2:0.015 },
  ],

  // This controls the "gentle boost" from higher total bet and more lines.
  // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
  biasPolicy: {
    maxScatterBoost: 1.2,  // adds up to +1.2 weight to S at max settings
    maxBonusBoost:   0.8,  // adds up to +0.8 to B
    maxCoinBoost:    1.8,  // adds up to +1.8 to C (and tiny to jackpots)
    betScale: 60,          // higher = slower ramp (more subtle)
  },
    paylines: [
  // --- 5 Straight Lines ---
  [2,2,2,2,2], // 1 Middle
  [1,1,1,1,1], // 2 Upper mid
  [3,3,3,3,3], // 3 Lower mid
  [0,0,0,0,0], // 4 Top
  [4,4,4,4,4], // 5 Bottom

  // --- 4 Diagonals ---
  [0,1,2,3,4], // 6 Down diagonal
  [4,3,2,1,0], // 7 Up diagonal
  [1,2,3,2,1], // 8 Shallow V
  [3,2,1,2,3], // 9 Inverted V

  // --- 6 Zig Zags ---
  [0,0,1,0,0], // 10
  [4,4,3,4,4], // 11
  [1,1,2,1,1], // 12
  [3,3,2,3,3], // 13
  [0,1,1,1,0], // 14
  [4,3,3,3,4], // 15

  // --- 5 W Shapes ---
  [0,1,0,1,0], // 16
  [4,3,4,3,4], // 17
  [1,2,1,2,1], // 18
  [3,2,3,2,3], // 19
  [0,2,4,2,0], // 20 Wide V

  // --- 5 Complex Patterns ---
  [2,1,0,1,2], // 21
  [2,3,4,3,2], // 22
  [1,0,1,0,1], // 23
  [3,4,3,4,3], // 24
  [2,0,2,4,2], // 25 Crown
],


    bonus: {
      freeSpins: { scatterNeeded: 3, awards: {3: 6, 4: 10, 5: 15} },
      holdSpin: { triggerCoins: 6, respins: 3, grid:{rows:5, cols:5}, jackpots:{MINI:40, MINOR:150, MAJOR:800},progressive: {
          seed:  { MINI: 50,  MINOR: 200, MAJOR: 1000 },
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
  betScale: { baseBet: 1, maxMult: 50 } // % of paid bet
        },
      meter: {
        enabled: true,
        threshold: 250  // total coins across spins required
      }
     }
    }
  },
    "space-heist": {
    name: "Space Heist",
    accent: "#38bdf8",
    showLabels: false,
    grid:{rows:5,cols:5},

    symbols: {
      W: { name:"UFO", payout:{3:70,4:300,5:1500}, wild:true },
      A: { name:"Diamond", payout:{3:10,4:35,5:140} },
      K: { name:"Satellite", payout:{3:8,4:28,5:110} },
      Q: { name:"DNA", payout:{3:6,4:22,5:90} },
      J: { name:"Blaster", payout:{3:5,4:18,5:75} },
      T: { name:"Bolt", payout:{3:4,4:14,5:60} },
      S: { name:"Galaxy", payout:{3:2,4:10,5:50}, scatter:true },
      B: { name:"Robber", payout:{}, bonus:true },
      C: { name:"Crypto", payout:{}, coin:true },
      MJ: { name:"MINI", payout:{}, jackpot:"MINI" },
      MR: { name:"MINOR", payout:{}, jackpot:"MINOR" },
      MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
    },

    icons: {
  W:"🛸",          // Wild = UFO tech
  A:"💎",          // Diamond
  K:"🛰️",          // Satellite
  Q:"🧬",          // DNA / sci-fi
  J:"🔫",          // Blaster
  T:"⚡",          // Energy
  S:"🌌",          // Scatter = galaxy
  B:"🕵️",          // Pick bonus = heist
  C:"💰",          // Coin
  MJ:"🪙",         // MINI
  MR:"💠",         // MINOR
  MJ2:"👑",        // MAJOR
},


    weights: [
    // Reel 1 (slightly higher features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 2
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 3 (center reel often “juicier”)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:4, MJ:0.12, MR:0.06, MJ2:0.02 },
    // Reel 4
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 5 (slightly lower features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:1.8, B:0.9, C:2.7, MJ:0.08, MR:0.04, MJ2:0.015 },
  ],

  // This controls the "gentle boost" from higher total bet and more lines.
  // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
  biasPolicy: {
    maxScatterBoost: 1.2,  // adds up to +1.2 weight to S at max settings
    maxBonusBoost:   0.8,  // adds up to +0.8 to B
    maxCoinBoost:    1.8,  // adds up to +1.8 to C (and tiny to jackpots)
    betScale: 60,          // higher = slower ramp (more subtle)
  },
    paylines: [
  // --- 5 Straight Lines ---
  [2,2,2,2,2], // 1 Middle
  [1,1,1,1,1], // 2 Upper mid
  [3,3,3,3,3], // 3 Lower mid
  [0,0,0,0,0], // 4 Top
  [4,4,4,4,4], // 5 Bottom

  // --- 4 Diagonals ---
  [0,1,2,3,4], // 6 Down diagonal
  [4,3,2,1,0], // 7 Up diagonal
  [1,2,3,2,1], // 8 Shallow V
  [3,2,1,2,3], // 9 Inverted V

  // --- 6 Zig Zags ---
  [0,0,1,0,0], // 10
  [4,4,3,4,4], // 11
  [1,1,2,1,1], // 12
  [3,3,2,3,3], // 13
  [0,1,1,1,0], // 14
  [4,3,3,3,4], // 15

  // --- 5 W Shapes ---
  [0,1,0,1,0], // 16
  [4,3,4,3,4], // 17
  [1,2,1,2,1], // 18
  [3,2,3,2,3], // 19
  [0,2,4,2,0], // 20 Wide V

  // --- 5 Complex Patterns ---
  [2,1,0,1,2], // 21
  [2,3,4,3,2], // 22
  [1,0,1,0,1], // 23
  [3,4,3,4,3], // 24
  [2,0,2,4,2], // 25 Crown
],


    bonus: {
      freeSpins: { scatterNeeded: 3, awards: {3: 10, 4: 15, 5: 25} },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid:{rows:5,cols:5},
        jackpots:{ MINI:75, MINOR:300, MAJOR:1500 },
        progressive: {
          seed:  { MINI: 50,  MINOR: 200, MAJOR: 1000 },
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
  betScale: { baseBet: 1, maxMult: 50 } // % of paid bet
        },
        meter: {
        enabled: true,
        threshold: 250  // total coins across spins required
      }
      }
    }
  },
    "dragon-vault": {
    name: "Dragon Vault",
    accent: "#ef4444",
    showLabels: false,
    grid:{rows:5,cols:5},

    symbols: {
      W: { name:"Dragon", payout:{3:80,4:350,5:1800}, wild:true },
      A: { name:"Letter", payout:{3:10,4:35,5:140} },
      K: { name:"Lantern", payout:{3:8,4:28,5:110} },
      Q: { name:"Note", payout:{3:6,4:22,5:90} },
      J: { name:"Fire", payout:{3:5,4:18,5:75} },
      T: { name:"Medal", payout:{3:4,4:14,5:60} },
      S: { name:"Sun", payout:{3:2,4:10,5:50}, scatter:true },
      B: { name:"Palace", payout:{}, bonus:true },
      C: { name:"Gold Coin", payout:{}, coin:true },
      MJ: { name:"MINI", payout:{}, jackpot:"MINI" },
      MR: { name:"MINOR", payout:{}, jackpot:"MINOR" },
      MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
    },

icons: {
  W:"🐉",
  A:"🧧",
  K:"🏮",
  Q:"🀄",
  J:"🔥",
  T:"🥇",
  S:"🎇",
  B:"🏯",
  C:"🪙",
  MJ:"🐲",
  MR:"💰",
  MJ2:"👑",
},


    weights: [
    // Reel 1 (slightly higher features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 2
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 3 (center reel often “juicier”)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:4, MJ:0.12, MR:0.06, MJ2:0.02 },
    // Reel 4
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 5 (slightly lower features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:1.8, B:0.9, C:2.7, MJ:0.08, MR:0.04, MJ2:0.015 },
  ],

  // This controls the "gentle boost" from higher total bet and more lines.
  // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
  biasPolicy: {
    maxScatterBoost: 1.2,  // adds up to +1.2 weight to S at max settings
    maxBonusBoost:   0.8,  // adds up to +0.8 to B
    maxCoinBoost:    1.8,  // adds up to +1.8 to C (and tiny to jackpots)
    betScale: 60,          // higher = slower ramp (more subtle)
  },
    paylines: [
  // --- 5 Straight Lines ---
  [2,2,2,2,2], // 1 Middle
  [1,1,1,1,1], // 2 Upper mid
  [3,3,3,3,3], // 3 Lower mid
  [0,0,0,0,0], // 4 Top
  [4,4,4,4,4], // 5 Bottom

  // --- 4 Diagonals ---
  [0,1,2,3,4], // 6 Down diagonal
  [4,3,2,1,0], // 7 Up diagonal
  [1,2,3,2,1], // 8 Shallow V
  [3,2,1,2,3], // 9 Inverted V

  // --- 6 Zig Zags ---
  [0,0,1,0,0], // 10
  [4,4,3,4,4], // 11
  [1,1,2,1,1], // 12
  [3,3,2,3,3], // 13
  [0,1,1,1,0], // 14
  [4,3,3,3,4], // 15

  // --- 5 W Shapes ---
  [0,1,0,1,0], // 16
  [4,3,4,3,4], // 17
  [1,2,1,2,1], // 18
  [3,2,3,2,3], // 19
  [0,2,4,2,0], // 20 Wide V

  // --- 5 Complex Patterns ---
  [2,1,0,1,2], // 21
  [2,3,4,3,2], // 22
  [1,0,1,0,1], // 23
  [3,4,3,4,3], // 24
  [2,0,2,4,2], // 25 Crown
],


    bonus: {
      freeSpins: { scatterNeeded: 3, awards: {3: 8, 4: 12, 5: 20} },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid:{rows:5,cols:5},
        jackpots:{ MINI:100, MINOR:400, MAJOR:2000 },
        progressive: {
          seed:  { MINI: 50,  MINOR: 200, MAJOR: 1000 },
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
  betScale: { baseBet: 1, maxMult: 50 } // % of paid bet
        },
        meter: {
        enabled: true,
        threshold: 250  // total coins across spins required
      }
      }
    }
  },
    "tropical-treasure": {
    name: "Tropical Treasure",
    accent: "#22c55e",
    showLabels: false,
    grid:{rows:5,cols:5},

    symbols: {
      W: { name:"Parrot", payout:{3:70,4:300,5:1500}, wild:true },
      A: { name:"Tree", payout:{3:10,4:35,5:140} },
      K: { name:"Rock", payout:{3:8,4:28,5:110} },
      Q: { name:"Iris", payout:{3:6,4:22,5:90} },
      J: { name:"Coconut", payout:{3:5,4:18,5:75} },
      T: { name:"Pineapple", payout:{3:4,4:14,5:60} },
      S: { name:"Wave", payout:{3:2,4:10,5:50}, scatter:true },
      B: { name:"Map", payout:{}, bonus:true },
      C: { name:"Doubloon", payout:{}, coin:true },
      MJ: { name:"MINI", payout:{}, jackpot:"MINI" },
      MR: { name:"MINOR", payout:{}, jackpot:"MINOR" },
      MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
    },

    icons: {
  W:"🦜",
  A:"🏝️",
  K:"🗿",
  Q:"🌺",
  J:"🥥",
  T:"🍍",
  S:"🌊",
  B:"🗺️",
  C:"🪙",
  MJ:"💰",
  MR:"💎",
  MJ2:"👑",
},


    weights: [
    // Reel 1 (slightly higher features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 2
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 3 (center reel often “juicier”)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:4, MJ:0.12, MR:0.06, MJ2:0.02 },
    // Reel 4
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:2, B:1, C:3, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 5 (slightly lower features)
    { A:18, K:18, Q:16, J:14, T:14, W:2, S:1.8, B:0.9, C:2.7, MJ:0.08, MR:0.04, MJ2:0.015 },
  ],

  // This controls the "gentle boost" from higher total bet and more lines.
  // It does NOT guarantee wins; it just nudges feature symbol weights slightly.
  biasPolicy: {
    maxScatterBoost: 1.2,  // adds up to +1.2 weight to S at max settings
    maxBonusBoost:   0.8,  // adds up to +0.8 to B
    maxCoinBoost:    1.8,  // adds up to +1.8 to C (and tiny to jackpots)
    betScale: 60,          // higher = slower ramp (more subtle)
  },
    paylines: [
  // --- 5 Straight Lines ---
  [2,2,2,2,2], // 1 Middle
  [1,1,1,1,1], // 2 Upper mid
  [3,3,3,3,3], // 3 Lower mid
  [0,0,0,0,0], // 4 Top
  [4,4,4,4,4], // 5 Bottom

  // --- 4 Diagonals ---
  [0,1,2,3,4], // 6 Down diagonal
  [4,3,2,1,0], // 7 Up diagonal
  [1,2,3,2,1], // 8 Shallow V
  [3,2,1,2,3], // 9 Inverted V

  // --- 6 Zig Zags ---
  [0,0,1,0,0], // 10
  [4,4,3,4,4], // 11
  [1,1,2,1,1], // 12
  [3,3,2,3,3], // 13
  [0,1,1,1,0], // 14
  [4,3,3,3,4], // 15

  // --- 5 W Shapes ---
  [0,1,0,1,0], // 16
  [4,3,4,3,4], // 17
  [1,2,1,2,1], // 18
  [3,2,3,2,3], // 19
  [0,2,4,2,0], // 20 Wide V

  // --- 5 Complex Patterns ---
  [2,1,0,1,2], // 21
  [2,3,4,3,2], // 22
  [1,0,1,0,1], // 23
  [3,4,3,4,3], // 24
  [2,0,2,4,2], // 25 Crown
],


    bonus: {
      freeSpins: { scatterNeeded: 3, awards: {3: 8, 4: 12, 5: 20} },
      holdSpin: {
        triggerCoins: 6,
        respins: 3,
        grid:{rows:5,cols:5},
        jackpots:{ MINI:60, MINOR:250, MAJOR:1200 },
        progressive: {
          seed:  { MINI: 50,  MINOR: 200, MAJOR: 1000 },
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
          betScale: { baseBet: 1, maxMult: 50 } // % of paid bet
        },
        meter: {
        enabled: true,
        threshold: 250  // total coins across spins required
      }
      }
    }
  },

  "neon-night-1985": {
  name: "Neon Night 1985",
  accent: "#ff2bd6",
  showLabels: false,
  grid:{rows:5,cols:5},

  symbols: {
    W:  { name:"Guitar", payout:{3:70,4:300,5:1600}, wild:true },

    A:  { name:"Sunglasses", payout:{3:10,4:35,5:140} },
    K:  { name:"BoomBox",    payout:{3:8, 4:28,5:110} },
    Q:  { name:"Arcade",     payout:{3:6, 4:22,5:90}  },
    J:  { name:"Cassette",   payout:{3:5, 4:18,5:75}  },
    T:  { name:"Roller",     payout:{3:4, 4:14,5:60}  },

    S:  { name:"Skyline", payout:{3:2,4:10,5:50}, scatter:true },
    B:  { name:"VHS Bonus", payout:{}, bonus:true },
    C:  { name:"Neon Coin", payout:{}, coin:true },

    MJ:  { name:"MINI",  payout:{}, jackpot:"MINI" },
    MR:  { name:"MINOR", payout:{}, jackpot:"MINOR" },
    MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
  },

  icons: {
    W:"🎸",
    A:"🕶️", K:"📻", Q:"🕹️", J:"💿", T:"🛼",
    S:"🌆",
    B:"📼",
    C:"💰",
    MJ:"💵", MR:"💳", MJ2:"👑",
  },

  weights: [
    // Reel 1 (slightly higher features)
    { A:18, K:18, Q:16, J:14, T:14, W:2.1, S:2.0, B:1.0, C:3.0, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 2
    { A:18, K:18, Q:16, J:14, T:14, W:2.0, S:2.0, B:1.0, C:3.0, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 3 (juicier)
    { A:18, K:18, Q:16, J:14, T:14, W:2.2, S:2.1, B:1.05,C:4.0, MJ:0.12, MR:0.06, MJ2:0.02 },
    // Reel 4
    { A:18, K:18, Q:16, J:14, T:14, W:2.0, S:2.0, B:1.0, C:3.0, MJ:0.10, MR:0.05, MJ2:0.02 },
    // Reel 5 (slightly lower features)
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.8, B:0.9, C:2.7, MJ:0.08, MR:0.04, MJ2:0.015 },
  ],

  // Slightly more “feature-forward” than base vegas-gold, but still subtle.
  biasPolicy: {
    maxScatterBoost: 1.3,
    maxBonusBoost:   0.9,
    maxCoinBoost:    2.0,
    betScale: 55,
  },

  // Reuse the same 25 paylines for consistency across your slots pack
  paylines: [
    [2,2,2,2,2],[1,1,1,1,1],[3,3,3,3,3],[0,0,0,0,0],[4,4,4,4,4],
    [0,1,2,3,4],[4,3,2,1,0],[1,2,3,2,1],[3,2,1,2,3],
    [0,0,1,0,0],[4,4,3,4,4],[1,1,2,1,1],[3,3,2,3,3],[0,1,1,1,0],[4,3,3,3,4],
    [0,1,0,1,0],[4,3,4,3,4],[1,2,1,2,1],[3,2,3,2,3],[0,2,4,2,0],
    [2,1,0,1,2],[2,3,4,3,2],[1,0,1,0,1],[3,4,3,4,3],[2,0,2,4,2],
  ],

  bonus: {
    freeSpins: { scatterNeeded: 3, awards: {3: 10, 4: 15, 5: 25} },

    holdSpin: {
      triggerCoins: 6,
      respins: 3,
      grid: { rows: 5, cols: 5 },

      jackpots: { MINI: 60, MINOR: 250, MAJOR: 1200 },

      progressive: {
        seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
        rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
        betScale: { baseBet: 1, maxMult: 50 }
      },
      meter: { enabled: true, threshold: 250 }
    }
  }
},

"gridiron-glory": {
  name: "Gridiron Glory",
  accent: "#22c55e",
  showLabels: false,
  grid:{rows:5,cols:5},

  symbols: {
    W:  { name:"Touchdown", payout:{3:80,4:360,5:1800}, wild:true },

    A:  { name:"Helmet", payout:{3:10,4:35,5:140} },
    K:  { name:"Football", payout:{3:8,4:30,5:120} },
    Q:  { name:"Goalpost", payout:{3:6,4:22,5:90} },
    J:  { name:"Cleats", payout:{3:5,4:18,5:75} },
    T:  { name:"Whistle", payout:{3:4,4:14,5:60} },

    S:  { name:"Stadium", payout:{3:2,4:10,5:50}, scatter:true },
    B:  { name:"Playbook Bonus", payout:{}, bonus:true },
    C:  { name:"Yard Coin", payout:{}, coin:true },

    MJ:  { name:"MINI",  payout:{}, jackpot:"MINI" },
    MR:  { name:"MINOR", payout:{}, jackpot:"MINOR" },
    MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
  },

  icons: {
    W:"🏈",
    A:"🪖",   // helmet-ish; emoji set varies per platform
    K:"🏈",
    Q:"🥅",
    J:"👟",
    T:"📣",
    S:"🏟️",
    B:"📋",
    C:"🪙",
    MJ:"💵", MR:"💳", MJ2:"👑",
  },

  // Slightly “tighter” on features, higher symbol pay ceiling => feels punchier.
  weights: [
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.8, B:0.85, C:2.6, MJ:0.09, MR:0.045, MJ2:0.018 },
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.8, B:0.85, C:2.6, MJ:0.09, MR:0.045, MJ2:0.018 },
    { A:18, K:18, Q:16, J:14, T:14, W:2.05,S:1.9, B:0.9,  C:3.3, MJ:0.11, MR:0.055, MJ2:0.02  },
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.8, B:0.85, C:2.6, MJ:0.09, MR:0.045, MJ2:0.018 },
    { A:18, K:18, Q:16, J:14, T:14, W:1.8, S:1.6, B:0.75, C:2.3, MJ:0.075,MR:0.035, MJ2:0.014 },
  ],

  biasPolicy: {
    // keep boosts subtle—this theme is already “spiky”
    maxScatterBoost: 1.1,
    maxBonusBoost:   0.7,
    maxCoinBoost:    1.6,
    betScale: 70,
  },

  paylines: [
    [2,2,2,2,2],[1,1,1,1,1],[3,3,3,3,3],[0,0,0,0,0],[4,4,4,4,4],
    [0,1,2,3,4],[4,3,2,1,0],[1,2,3,2,1],[3,2,1,2,3],
    [0,0,1,0,0],[4,4,3,4,4],[1,1,2,1,1],[3,3,2,3,3],[0,1,1,1,0],[4,3,3,3,4],
    [0,1,0,1,0],[4,3,4,3,4],[1,2,1,2,1],[3,2,3,2,3],[0,2,4,2,0],
    [2,1,0,1,2],[2,3,4,3,2],[1,0,1,0,1],[3,4,3,4,3],[2,0,2,4,2],
  ],

  bonus: {
    freeSpins: { scatterNeeded: 3, awards: {3: 8, 4: 12, 5: 20} },

    holdSpin: {
      triggerCoins: 6,
      respins: 3,
      grid: { rows: 5, cols: 5 },

      // Higher “event” jackpots for the sports theme
      jackpots: { MINI: 75, MINOR: 300, MAJOR: 1500 },

      progressive: {
        seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
        rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
        betScale: { baseBet: 1, maxMult: 50 }
      },
      meter: { enabled: true, threshold: 250 }
    }
  }
},

"arctic-fortune": {
  name: "Arctic Fortune",
  accent: "#60a5fa",
  showLabels: false,
  grid:{rows:5,cols:5},

  symbols: {
    W:  { name:"Ice Wolf", payout:{3:75,4:320,5:1700}, wild:true },

    A:  { name:"Ice Crown", payout:{3:10,4:35,5:140} },
    K:  { name:"Snow Owl",  payout:{3:8, 4:28,5:110} },
    Q:  { name:"Crystal",   payout:{3:6, 4:22,5:90}  },
    J:  { name:"Lantern",   payout:{3:5, 4:18,5:75}  },
    T:  { name:"Pine",      payout:{3:4, 4:14,5:60}  },

    S:  { name:"Aurora", payout:{3:2,4:10,5:50}, scatter:true },
    B:  { name:"Glacier Bonus", payout:{}, bonus:true },
    C:  { name:"Ice Crystal", payout:{}, coin:true },

    MJ:  { name:"MINI",  payout:{}, jackpot:"MINI" },
    MR:  { name:"MINOR", payout:{}, jackpot:"MINOR" },
    MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
  },

  icons: {
    W:"🐺",
    A:"❄️", K:"🦉", Q:"💠", J:"🏮", T:"🌲",
    S:"🌌",
    B:"🏔️",
    C:"🧊",
    MJ:"💵", MR:"💳", MJ2:"👑",
  },

  // Higher coin presence + the freeze mechanic => strong “collector” feel.
  weights: [
    { A:18, K:18, Q:16, J:14, T:14, W:2.0, S:1.9, B:0.95, C:3.6, MJ:0.10, MR:0.05, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:2.0, S:1.9, B:0.95, C:3.6, MJ:0.10, MR:0.05, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:2.2, S:2.0, B:1.00, C:4.2, MJ:0.12, MR:0.06, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:2.0, S:1.9, B:0.95, C:3.6, MJ:0.10, MR:0.05, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.7, B:0.85, C:3.2, MJ:0.08, MR:0.04, MJ2:0.015 },
  ],

  biasPolicy: {
    maxScatterBoost: 1.15,
    maxBonusBoost:   0.75,
    maxCoinBoost:    2.2,
    betScale: 60,
  },

  // Reuse your standard 25 paylines for compatibility :contentReference[oaicite:2]{index=2}
  paylines: [
    [2,2,2,2,2],[1,1,1,1,1],[3,3,3,3,3],[0,0,0,0,0],[4,4,4,4,4],
    [0,1,2,3,4],[4,3,2,1,0],[1,2,3,2,1],[3,2,1,2,3],
    [0,0,1,0,0],[4,4,3,4,4],[1,1,2,1,1],[3,3,2,3,3],[0,1,1,1,0],[4,3,3,3,4],
    [0,1,0,1,0],[4,3,4,3,4],[1,2,1,2,1],[3,2,3,2,3],[0,2,4,2,0],
    [2,1,0,1,2],[2,3,4,3,2],[1,0,1,0,1],[3,4,3,4,3],[2,0,2,4,2],
  ],

  // NEW (optional): theme-specific spin behavior
  mechanics: {
    frozenCoins: {
      enabled: true,
      // chance each landed coin becomes “frozen” and persists into the next spin
      freezeChance: 0.35,
      // max spins a frozen coin can persist before it melts
      maxHoldSpins: 1
    }
  },

  bonus: {
    freeSpins: { scatterNeeded: 3, awards: {3: 8, 4: 12, 5: 20} },
    holdSpin: {
      triggerCoins: 6,
      respins: 3,
      grid:{rows:5,cols:5},
      jackpots:{ MINI:70, MINOR:275, MAJOR:1350 },
      progressive: {
        seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
        rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
        betScale: { baseBet: 1, maxMult: 50 }
      },
      meter: { enabled: true, threshold: 250 }
    }
  }
},
"outlaw-riches": {
  name: "Outlaw Riches",
  accent: "#f59e0b",
  showLabels: false,
  grid:{rows:5,cols:5},

  symbols: {
    W:  { name:"Sheriff Star", payout:{3:70,4:320,5:1650}, wild:true },

    A:  { name:"Hat",     payout:{3:10,4:35,5:140} },
    K:  { name:"Boot",    payout:{3:8, 4:28,5:110} },
    Q:  { name:"Cactus",  payout:{3:6, 4:22,5:90}  },
    J:  { name:"Revolver",payout:{3:5, 4:18,5:75}  },
    T:  { name:"Wagon",   payout:{3:4, 4:14,5:60}  },

    S:  { name:"Sunset", payout:{3:2,4:10,5:50}, scatter:true },
    B:  { name:"Duel Bonus", payout:{}, bonus:true },
    C:  { name:"Gold Nugget", payout:{}, coin:true },

    MJ:  { name:"MINI",  payout:{}, jackpot:"MINI" },
    MR:  { name:"MINOR", payout:{}, jackpot:"MINOR" },
    MJ2: { name:"MAJOR", payout:{}, jackpot:"MAJOR" },
  },

  icons: {
    W:"⭐",
    A:"🤠", K:"🥾", Q:"🌵", J:"🔫", T:"🛻",
    S:"🌅",
    B:"⚔️",
    C:"🪙",
    MJ:"💵", MR:"💳", MJ2:"👑",
  },

  // HIGH coin frequency machine
  weights: [
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.7, B:0.95, C:4.2, MJ:0.11, MR:0.055, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.7, B:0.95, C:4.2, MJ:0.11, MR:0.055, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:2.0, S:1.8, B:1.0,  C:4.8, MJ:0.13, MR:0.065, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:1.9, S:1.7, B:0.95, C:4.2, MJ:0.11, MR:0.055, MJ2:0.02 },
    { A:18, K:18, Q:16, J:14, T:14, W:1.8, S:1.5, B:0.85, C:3.9, MJ:0.09, MR:0.045, MJ2:0.015 },
  ],

  biasPolicy: {
    maxScatterBoost: 1.05,
    maxBonusBoost:   0.75,
    maxCoinBoost:    2.6,   // biggest coin push of your pack
    betScale: 55,
  },

  paylines: [
    [2,2,2,2,2],[1,1,1,1,1],[3,3,3,3,3],[0,0,0,0,0],[4,4,4,4,4],
    [0,1,2,3,4],[4,3,2,1,0],[1,2,3,2,1],[3,2,1,2,3],
    [0,0,1,0,0],[4,4,3,4,4],[1,1,2,1,1],[3,3,2,3,3],[0,1,1,1,0],[4,3,3,3,4],
    [0,1,0,1,0],[4,3,4,3,4],[1,2,1,2,1],[3,2,3,2,3],[0,2,4,2,0],
    [2,1,0,1,2],[2,3,4,3,2],[1,0,1,0,1],[3,4,3,4,3],[2,0,2,4,2],
  ],

  // Cosmetic-only hook: if your UI wants to show “two respins at once”
  mechanics: {
    duelMode: { enabled: true } // purely for UI flair unless you wire it deeper
  },

  bonus: {
    freeSpins: { scatterNeeded: 3, awards: {3: 6, 4: 10, 5: 15} },

    holdSpin: {
      triggerCoins: 6,
      respins: 3,
      grid:{rows:5,cols:5},

      // Slightly richer defaults (fits “coin-forward” identity)
      jackpots:{ MINI:80, MINOR:320, MAJOR:1600 },

      progressive: {
        seed: { MINI: 50, MINOR: 200, MAJOR: 1000 },
        rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 },
        betScale: { baseBet: 1, maxMult: 50 }
      },
      meter: { enabled: true, threshold: 250 }
    }
  }
},

};

export const THEME_KEYS = Object.keys(THEMES);

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
        rate: { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 }
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
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 } // % of paid bet
        } }
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
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 } // % of paid bet
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
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 } // % of paid bet
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
          rate:  { MINI: 0.005, MINOR: 0.002, MAJOR: 0.001 } // % of paid bet
        }
      }
    }
  },
  

};

export const THEME_KEYS = Object.keys(THEMES);

// bonusbowling.engine.js

function clampInt(n, min, max) {
  n = Math.floor(Number(n));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function randInt(rng, a, b) { // inclusive
  return a + Math.floor(rng() * (b - a + 1));
}

export const BET_TYPES = [
  "RANGE_0_3",
  "RANGE_4_6",
  "RANGE_7_9",
  "SPARE",
  "STRIKE",
];

// TODO: set real paytable multipliers here (FOR-ONE)
// Example placeholders (edit these):
export const PAYTABLE = {
  STRIKE: 25,
  SPARE: 10,
  RANGE_7_9: 5,
  RANGE_4_6: 3,
  RANGE_0_3: 2,
};

// “bad bowler” distribution knobs (tweak anytime)
export const DEFAULT_MODEL = {
  // weights for first ball pins 0..10
  // higher weights near 0-6 makes “bad”
  firstBallWeights: [8,8,8,8,7,6,5,3,2,1,0.5],
  // for second ball, scale by remaining pins; we’ll reweight toward small results
  secondBallBias: 1.6, // >1 biases low
};

function pickCategory(rng) {
  const r = rng();
  if (r < 0.034) return "STRIKE";
  if (r < 0.034 + 0.0856) return "SPARE";
  if (r < 0.034 + 0.0856 + 0.1704) return "RANGE_7_9";
  if (r < 0.034 + 0.0856 + 0.1704 + 0.284) return "RANGE_4_6";
  return "RANGE_0_3";
}

function rollFromCategory(rng, cat) {
  if (cat === "STRIKE") return { p1: 10, p2: 0, total: 10, kind: "STRIKE" };

  if (cat === "SPARE") {
    // pick first ball 0..9, second makes 10
    const p1 = randInt(rng, 0, 9);
    const p2 = 10 - p1;
    return { p1, p2, total: 10, kind: "SPARE" };
  }

  // open totals
  const ranges = {
    RANGE_0_3: [0, 3],
    RANGE_4_6: [4, 6],
    RANGE_7_9: [7, 9],
  };
  const [lo, hi] = ranges[cat];
  const total = randInt(rng, lo, hi);

  // split total into two balls (p1 0..min(9,total))
  const p1Max = Math.min(9, total);
  const p1 = randInt(rng, 0, p1Max);
  const p2 = total - p1;

  return { p1, p2, total, kind: "OPEN" };
}

export function newBonusBowlingState({ rng = Math.random, model = DEFAULT_MODEL } = {}) {
  return {
    game: "bonus-bowling",
    rng,
    model,

    phase: "BETTING", // BETTING -> RESULT
    message: "Place your bets for the next frame.",

    frameNumber: 1,
    isGolden: false,

    sessionMode: true,
    sessionFrames: 10,
    sessionFrameIndex: 1, // 1..sessionFrames
    sessionTotalBet: 0,
    sessionTotalWin: 0,   // profit (includes golden)
    sessionLog: [],       // [{frame,isGolden,kind,total,bet,win,goldenBonus}]

    // bets for the current frame (amounts by bet type)
    bets: {
      RANGE_0_3: 0,
      RANGE_4_6: 0,
      RANGE_7_9: 0,
      SPARE: 0,
      STRIKE: 0,
    },

    // frame result
    roll: null, // { p1, p2, total, kind:"OPEN"|"SPARE"|"STRIKE" }
    settlements: null, // per bet: { betType, amount, winMult, payout }
    goldenBonus: 0, // payout amount (profit)
    totalBet: 0,
    totalPayout: 0, // profit incl golden bonus
  };
}

export function setBets(state, betsPatch) {
  if (state.phase !== "BETTING") return state;
  const bets = { ...state.bets };
  for (const k of Object.keys(betsPatch || {})) {
    if (k in bets) bets[k] = clampInt(betsPatch[k], 0, 1_000_000_000);
  }
  return { ...state, bets };
}

function classify(p1, p2) {
  if (p1 === 10) return { kind: "STRIKE", total: 10 };
  const total = p1 + p2;
  if (total === 10) return { kind: "SPARE", total: 10 };
  return { kind: "OPEN", total };
}

function isWinningBet(betType, roll) {
  if (betType === "STRIKE") return roll.kind === "STRIKE";
  if (betType === "SPARE") return roll.kind === "SPARE";
  if (betType === "RANGE_0_3") return roll.kind === "OPEN" && roll.total >= 0 && roll.total <= 3;
  if (betType === "RANGE_4_6") return roll.kind === "OPEN" && roll.total >= 4 && roll.total <= 6;
  if (betType === "RANGE_7_9") return roll.kind === "OPEN" && roll.total >= 7 && roll.total <= 9;
  return false;
}

export function resolveFrame(state) {
  if (state.phase !== "BETTING") return state;

  const isGolden = (state.frameNumber % 3 === 0); // 1 out of 3

  const cat = pickCategory(state.rng);
  const roll = rollFromCategory(state.rng, cat);

  // compute settlements
  const settlements = [];
  let totalBet = 0;
  let totalPayout = 0;

  for (const betType of BET_TYPES) {
    const amount = clampInt(state.bets[betType], 0, 1_000_000_000);
    if (!amount) continue;

    totalBet += amount;

    const win = isWinningBet(betType, roll);
    const winMult = win ? (PAYTABLE[betType] ?? 0) : 0;
    const payout = win ? Math.floor(amount * winMult) : 0; // FOR-ONE profit only

    totalPayout += payout;
    settlements.push({ betType, amount, win, winMult, payout });
  }

  // golden bonus: if golden + strike, pay 10x total bet (profit), regardless of what was bet
  let goldenBonus = 0;
  if (isGolden && roll.kind === "STRIKE" && totalBet > 0) {
    goldenBonus = totalBet * 10;
    totalPayout += goldenBonus;
  }

  const message = buildMessage(roll, isGolden, settlements, goldenBonus, totalPayout);

  return {
    ...state,
    phase: "RESULT",
    isGolden,
    roll,
    settlements,
    goldenBonus,
    totalBet,
    totalPayout,
    message,
  };
}

function buildMessage(roll, isGolden, settlements, goldenBonus, totalPayout) {
  const head = isGolden ? "GOLDEN FRAME! " : "";
  const kindText = roll.kind === "STRIKE" ? "STRIKE" : roll.kind === "SPARE" ? "SPARE" : `OPEN ${roll.total}`;
  const base = `${head}${kindText} (${roll.p1}+${roll.p2}).`;

  if (!settlements.length) return base + " No bets placed.";

  const wins = settlements.filter(s => s.win).length;
  const bonus = goldenBonus > 0 ? ` Golden bonus +${goldenBonus}.` : "";
  return `${base} Winning bets: ${wins}. Total win +${totalPayout}.${bonus}`;
}

export function nextFrame(state) {
  if (state.phase !== "RESULT") return state;
  return {
    ...state,
    phase: "BETTING",
    message: "Place your bets for the next frame.",
    frameNumber: state.frameNumber + 1,
    isGolden: false,
    roll: null,
    settlements: null,
    goldenBonus: 0,
    totalBet: 0,
    totalPayout: 0,
    bets: { ...state.bets, RANGE_0_3: 0, RANGE_4_6: 0, RANGE_7_9: 0, SPARE: 0, STRIKE: 0 },
  };
}

export function setSession(state, { enabled, frames }) {
  if (state.phase !== "BETTING" && state.phase !== "RESULT") return state;
  const sessionMode = !!enabled;
  const sessionFrames = Math.max(1, Math.min(100, Math.floor(Number(frames) || 10)));
  return { ...state, sessionMode, sessionFrames };
}

export function startSession(state) {
  return {
    ...state,
    frameNumber: 1,
    sessionFrameIndex: 1,
    sessionTotalBet: 0,
    sessionTotalWin: 0,
    sessionLog: [],
    phase: "BETTING",
    message: "Session started. Place your bets for Frame 1.",
  };
}

export function applySessionTotals(state) {
  // call this right after resolveFrame() in UI
  if (state.phase !== "RESULT") return state;
  const entry = {
    frame: state.sessionFrameIndex,
    isGolden: state.isGolden,
    kind: state.roll?.kind,
    total: state.roll?.total,
    bet: state.totalBet,
    win: state.totalPayout,
    goldenBonus: state.goldenBonus,
  };
  return {
    ...state,
    sessionTotalBet: state.sessionTotalBet + state.totalBet,
    sessionTotalWin: state.sessionTotalWin + state.totalPayout,
    sessionLog: [...state.sessionLog, entry],
  };
}

export function advanceSessionFrame(state) {
  if (state.phase !== "RESULT") return state;

  const nextIndex = state.sessionFrameIndex + 1;
  const done = state.sessionMode && nextIndex > state.sessionFrames;

  if (done) {
    return {
      ...state,
      phase: "BETTING",
      message: `Session complete. Net: +${state.sessionTotalWin - state.sessionTotalBet}. Start a new session or keep playing.`,
      // keep session totals/log visible
    };
  }

  // continue normal nextFrame behavior + increment session index
  const base = nextFrame(state);
  return {
    ...base,
    sessionFrameIndex: state.sessionMode ? nextIndex : state.sessionFrameIndex,
    message: state.sessionMode ? `Place your bets for Frame ${nextIndex}.` : base.message,
  };
}
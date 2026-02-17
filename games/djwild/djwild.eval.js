// games/djwild/djwild.eval.js

const SUITS = ["S","H","D","C"];
const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];

const RV = { "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"T":10,"J":11,"Q":12,"K":13,"A":14 };

function isJoker(c){ return c?.joker === true || c?.r === "JOKER"; }
function isDeuce(c){ return c?.r === "2"; }
function isWild(c){ return isJoker(c) || isDeuce(c); }

// Five wilds is ONLY the physical {JOKER + four 2s}
export function isFiveWildsPhysical(cards){
  if (cards.length !== 5) return false;
  const jok = cards.filter(isJoker).length;
  const deu = cards.filter(isDeuce).length;
  return jok === 1 && deu === 4;
}

function sortDesc(a){ return a.slice().sort((x,y)=>y-x); }

function makeCounts(vals){
  const m = new Map();
  for (const v of vals) m.set(v, (m.get(v)||0)+1);
  return [...m.entries()].sort((a,b)=> b[1]-a[1] || b[0]-a[0]); // by count then rank
}

function straightHighFromSet(setVals){
  // setVals are numbers, unique
  const s = [...new Set(setVals)].sort((a,b)=>a-b);
  if (s.length < 5) return null;

  // wheel support: treat Ace as 1
  const s2 = s.includes(14) ? [1, ...s] : s.slice();

  for (let i=0;i<=s2.length-5;i++){
    const slice = s2.slice(i,i+5);
    let ok = true;
    for (let j=0;j<4;j++) if (slice[j]+1 !== slice[j+1]) { ok=false; break; }
    if (ok) {
      const hi = slice[4] === 1 ? 5 : slice[4];
      return hi;
    }
  }
  return null;
}

function bestStraightWithWild(fixedRanks, wildCount){
  // fixedRanks: array of RV
  // We try possible straight highs from A(14) down to 5
  const fixedSet = new Set(fixedRanks);

  const candidates = [];
  for (let hi=14; hi>=5; hi--){
    const seq = (hi===5)
      ? [14,2,3,4,5] // wheel uses Ace
      : [hi-4,hi-3,hi-2,hi-1,hi];

    let need=0;
    const seen = new Set();
    let valid = true;
    for (const r of fixedSet){
      if (!seq.includes(r)) { valid=false; break; }
      if (seen.has(r)) continue;
      seen.add(r);
    }
    if (!valid) continue;

    // count missing
    for (const r of seq){
      if (!fixedSet.has(r)) need++;
    }
    if (need <= wildCount) candidates.push(hi);
  }
  return candidates.length ? candidates[0] : null;
}

function bestFlushSuitWithWild(fixedCards, wildCount){
  // returns suit that can make flush and how many fixed in it
  const counts = {S:0,H:0,D:0,C:0};
  for (const c of fixedCards) counts[c.s] = (counts[c.s]||0)+1;
  // best suit: maximize fixed count, and must be possible: fixed in chosen suit + wildCount = 5
  let bestSuit=null, bestFixed=-1;
  for (const s of SUITS){
    const f = counts[s]||0;
    if (f + wildCount >= 5 && f > bestFixed){
      bestFixed=f; bestSuit=s;
    }
  }
  return bestSuit ? { suit: bestSuit, fixedInSuit: bestFixed } : null;
}

function scoreTuple(base, tiebreakers){
  // base is category strength, tiebreakers are numbers descending
  let score = base;
  let mul = 0.001;
  for (const v of tiebreakers) { score += v * mul; mul *= 0.001; }
  return score;
}

export function evalDJWild5(cards){
  // returns { key, name, score, isNaturalForTrips }
  // "Natural for trips" means: best Trips+ can be made without using any deuce as wild and no joker used.
  const physicalFiveWilds = isFiveWildsPhysical(cards);

  const fixed = cards.filter(c => !isWild(c));
  const wilds = cards.filter(isWild);
  const w = wilds.length;

  const fixedRanks = fixed.map(c => RV[c.r]);
  const fixedSuits = fixed.map(c => c.s);

  // Helper: any joker makes Trips non-natural by definition
  const hasJoker = cards.some(isJoker);
  const deuces = cards.filter(isDeuce).length;

  // 1) FIVE WILDS (top)
  if (physicalFiveWilds) {
    return { key:"FIVE_WILDS", name:"Five Wilds", score: scoreTuple(10,[0]), isNaturalForTrips:false };
  }

  // 2) ROYAL FLUSH
  // possible if all fixed are same suit and subset of {10,J,Q,K,A} and no duplicates
  {
    const rf = tryRoyalFlush(fixed, w);
    if (rf) return { key:"ROYAL_FLUSH", name:"Royal Flush", score: scoreTuple(9,[14]), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"ROYAL_FLUSH")) };
  }

  // 3) FIVE OF A KIND
  {
    const best = tryNOfKind(fixedRanks, w, 5);
    if (best) return { key:"FIVE_OF_KIND", name:"Five of a Kind", score: scoreTuple(8,[best.rank]), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"FIVE_OF_KIND")) };
  }

  // 4) STRAIGHT FLUSH
  {
    const sf = tryStraightFlush(fixed, w);
    if (sf) return { key:"STRAIGHT_FLUSH", name:"Straight Flush", score: scoreTuple(7,[sf.high]), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"STRAIGHT_FLUSH")) };
  }

  // 5) FOUR OF A KIND
  {
    const best = tryNOfKindWithKicker(fixedRanks, w, 4);
    if (best) return { key:"FOUR_KIND", name:"Four of a Kind", score: scoreTuple(6,[best.rank,best.kicker]), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"FOUR_KIND")) };
  }

  // 6) FULL HOUSE
  {
    const fh = tryFullHouse(fixedRanks, w);
    if (fh) return { key:"FULL_HOUSE", name:"Full House", score: scoreTuple(5,[fh.trip, fh.pair]), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"FULL_HOUSE")) };
  }

  // 7) FLUSH
  {
    const fl = tryFlush(fixed, w);
    if (fl) return { key:"FLUSH", name:"Flush", score: scoreTuple(4, fl.highs), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"FLUSH")) };
  }

  // 8) STRAIGHT
  {
    const hi = bestStraightWithWild(fixedRanks, w);
    if (hi) return { key:"STRAIGHT", name:"Straight", score: scoreTuple(3,[hi]), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"STRAIGHT")) };
  }

  // 9) THREE OF A KIND
  {
    const tk = tryNOfKindWithKickers(fixedRanks, w, 3);
    if (tk) return { key:"THREE_KIND", name:"Three of a Kind", score: scoreTuple(2,[tk.rank, ...tk.kickers]), isNaturalForTrips: (!hasJoker && isTripsNaturalPossible(cards,"THREE_KIND")) };
  }

  // 10+) Below trips (still needed for comparing player vs dealer)
  {
    const twoPair = tryTwoPair(fixedRanks, w);
    if (twoPair) return { key:"TWO_PAIR", name:"Two Pair", score: scoreTuple(1.5,[...twoPair]), isNaturalForTrips:false };
    const pair = tryPair(fixedRanks, w);
    if (pair) return { key:"PAIR", name:"Pair", score: scoreTuple(1.2,[...pair]), isNaturalForTrips:false };
    const highs = bestHighCard(fixedRanks, w);
    return { key:"HIGH_CARD", name:"High Card", score: scoreTuple(1,[...highs]), isNaturalForTrips:false };
  }
}

// --- Natural-for-Trips heuristic (matches PDF wording) ---
// We classify "natural" if: no joker AND treating all deuces as literal 2's still yields Trips+.
function isTripsNaturalPossible(cards, wantedKey){
  if (cards.some(isJoker)) return false;

  // Treat deuces as non-wild (fixed rank 2)
  const fixed = cards.map(c => {
    if (isDeuce(c)) return { r:"2", s:c.s };
    if (isJoker(c)) return { r:"JOKER", joker:true }; // already excluded
    return c;
  });

  // Evaluate with ONLY joker wild (none here), so effectively no wild at all
  const noWild = fixed.filter(c => !isJoker(c));
  const ranks = noWild.map(c => RV[c.r]);
  const suits = noWild.map(c => c.s);

  // quick check: does literal hand already make Trips+ category?
  const key = evalNoWildKey(noWild);
  if (!["THREE_KIND","STRAIGHT","FLUSH","FULL_HOUSE","FOUR_KIND","STRAIGHT_FLUSH","FIVE_OF_KIND","ROYAL_FLUSH","FIVE_WILDS"].includes(key)) {
    return false;
  }
  // If literal hand already qualifies, we'll call it natural.
  // If you want stricter “natural must match the same ranking as wild-best”, we can enforce key===wantedKey.
  return true;
}

function evalNoWildKey(cards){
  // Basic 5-card evaluation WITHOUT wilds (used only for natural classification)
  const ranks = cards.map(c=>RV[c.r]).sort((a,b)=>a-b);
  const uniq = [...new Set(ranks)];
  const isFlush = cards.every(c=>c.s===cards[0].s);

  const isStraight = (() => {
    if (uniq.length !== 5) return false;
    // wheel
    if (uniq.includes(14) && uniq.includes(2) && uniq.includes(3) && uniq.includes(4) && uniq.includes(5)) return true;
    return uniq[0]+1===uniq[1] && uniq[1]+1===uniq[2] && uniq[2]+1===uniq[3] && uniq[3]+1===uniq[4];
  })();

  const counts = makeCounts(ranks);
  const freq = counts.map(x=>x[1]);

  const hasRoyal = isFlush && isStraight && uniq.includes(10) && uniq.includes(11) && uniq.includes(12) && uniq.includes(13) && uniq.includes(14);
  if (hasRoyal) return "ROYAL_FLUSH";
  if (isFlush && isStraight) return "STRAIGHT_FLUSH";
  if (freq[0]===4) return "FOUR_KIND";
  if (freq[0]===3 && freq[1]===2) return "FULL_HOUSE";
  if (isFlush) return "FLUSH";
  if (isStraight) return "STRAIGHT";
  if (freq[0]===3) return "THREE_KIND";
  if (freq[0]===2 && freq[1]===2) return "TWO_PAIR";
  if (freq[0]===2) return "PAIR";
  return "HIGH_CARD";
}

// --- Category builders (wild-aware, no brute-force combinatorics) ---

function tryRoyalFlush(fixed, w){
  const rfRanks = new Set([10,11,12,13,14]);
  if (fixed.length > 5) return null;

  // all fixed must share suit
  if (fixed.length){
    const s = fixed[0].s;
    if (!fixed.every(c=>c.s===s)) return null;
    // ranks must be subset of RF ranks and unique
    const fr = fixed.map(c=>RV[c.r]);
    if (new Set(fr).size !== fr.length) return null;
    if (!fr.every(r=>rfRanks.has(r))) return null;
    const missing = 5 - fr.length;
    if (missing <= w) return { suit:s };
    return null;
  }
  // no fixed: wilds can make any suit
  return (w >= 5) ? { suit:"S" } : { suit:"S" }; // with 5 cards total, if all are wild we'd have been FIVE WILDS already
}

function tryStraightFlush(fixed, w){
  // Choose a suit possible for flush; within that suit try best straight.
  const flushInfo = bestFlushSuitWithWild(fixed, w);
  if (!flushInfo) return null;

  const suit = flushInfo.suit;
  const suitedFixed = fixed.filter(c=>c.s===suit).map(c=>RV[c.r]);
  const otherFixed = fixed.filter(c=>c.s!==suit);
  if (otherFixed.length) return null; // fixed off-suit cannot be in straight flush

  const hi = bestStraightWithWild(suitedFixed, w);
  if (!hi) return null;
  return { high: hi, suit };
}

function tryFlush(fixed, w){
  const flushInfo = bestFlushSuitWithWild(fixed, w);
  if (!flushInfo) return null;
  const suit = flushInfo.suit;

  // If there are fixed cards off-suit, wilds can't change them -> flush impossible
  const off = fixed.filter(c=>c.s!==suit);
  if (off.length) return null;

  // Best flush high cards: use fixed ranks + fill remaining with A,K,Q...
  const fr = sortDesc(fixed.map(c=>RV[c.r]));
  const need = 5 - fr.length;
  const fillers = [14,13,12,11,10,9,8,7,6,5,4,3,2].filter(v => !fr.includes(v)).slice(0,need);
  const highs = fr.concat(fillers).slice(0,5);
  return { suit, highs };
}

function tryNOfKind(fixedRanks, w, n){
  const counts = new Map();
  for (const r of fixedRanks) counts.set(r,(counts.get(r)||0)+1);

  let bestRank=null;
  for (let r=14;r>=2;r--){
    const c = counts.get(r)||0;
    if (c + w >= n) { bestRank=r; break; }
  }
  if (!bestRank) return null;

  // For five-of-kind, all non-wild fixed must be same rank (otherwise impossible)
  if (n===5){
    const distinct = new Set(fixedRanks);
    if (distinct.size > 1) return null;
  }
  return { rank: bestRank };
}

function tryNOfKindWithKicker(fixedRanks, w, n){
  const counts = new Map();
  for (const r of fixedRanks) counts.set(r,(counts.get(r)||0)+1);

  for (let r=14;r>=2;r--){
    const c = counts.get(r)||0;
    if (c + w >= n) {
      // kicker is best remaining rank among fixed not used, else highest possible
      const remaining = fixedRanks.filter(x=>x!==r);
      let kicker = remaining.length ? Math.max(...remaining) : 14;
      if (kicker===r) kicker = 13;
      return { rank:r, kicker };
    }
  }
  return null;
}

function tryNOfKindWithKickers(fixedRanks, w, n){
  const counts = new Map();
  for (const r of fixedRanks) counts.set(r,(counts.get(r)||0)+1);

  for (let r=14;r>=2;r--){
    const c = counts.get(r)||0;
    if (c + w >= n) {
      const remaining = fixedRanks.filter(x=>x!==r).sort((a,b)=>b-a);
      // fill with highest kickers not equal to r
      const kickers = remaining.slice(0, 5-n);
      while (kickers.length < 5-n) {
        const cand = 14 - kickers.length;
        if (cand !== r && !kickers.includes(cand)) kickers.push(cand);
        else kickers.push(cand-1);
      }
      return { rank:r, kickers };
    }
  }
  return null;
}

function tryFullHouse(fixedRanks, w){
  const counts = makeCounts(fixedRanks); // [rank,count] desc
  // Try best trip rank then best pair rank
  for (let trip=14; trip>=2; trip--){
    const cTrip = fixedRanks.filter(r=>r===trip).length;
    const needTrip = Math.max(0, 3 - cTrip);
    if (needTrip > w) continue;

    const wLeft = w - needTrip;
    for (let pair=14; pair>=2; pair--){
      if (pair===trip) continue;
      const cPair = fixedRanks.filter(r=>r===pair).length;
      const needPair = Math.max(0, 2 - cPair);
      if (needPair <= wLeft) return { trip, pair };
    }
  }
  return null;
}

function tryTwoPair(fixedRanks, w){
  // Build best two pairs possible, then kicker
  const counts = makeCounts(fixedRanks); // [rank,count]
  const have = new Map(counts.map(([r,c])=>[r,c]));

  const pairs = [];
  for (let r=14;r>=2;r--){
    const c = have.get(r)||0;
    if (c>=2) pairs.push(r);
    else if (c===1 && w>=1) pairs.push(r);
    else if (c===0 && w>=2) pairs.push(r);
    if (pairs.length===2) break;
  }
  if (pairs.length<2) return null;

  // kicker best remaining
  const usedPairs = new Set(pairs);
  let kicker = null;
  for (let r=14;r>=2;r--){
    if (usedPairs.has(r)) continue;
    const c = have.get(r)||0;
    if (c>=1 || w>=1) { kicker=r; break; }
  }
  if (!kicker) kicker = 14;
  return [pairs[0], pairs[1], kicker];
}

function tryPair(fixedRanks, w){
  const have = new Map(makeCounts(fixedRanks).map(([r,c])=>[r,c]));
  let pair=null;
  for (let r=14;r>=2;r--){
    const c = have.get(r)||0;
    if (c>=2 || (c===1 && w>=1) || (c===0 && w>=2)) { pair=r; break; }
  }
  if (!pair) return null;

  const kickers = [];
  for (let r=14;r>=2;r--){
    if (r===pair) continue;
    const c = have.get(r)||0;
    if (c>=1 || w>=1) kickers.push(r);
    if (kickers.length===3) break;
  }
  while (kickers.length<3) kickers.push(14-kickers.length);
  return [pair, ...kickers];
}

function bestHighCard(fixedRanks, w){
  const set = new Set(fixedRanks);
  const out = fixedRanks.slice().sort((a,b)=>b-a);
  for (let r=14;r>=2 && out.length<5;r--){
    if (!set.has(r)) out.push(r);
  }
  return out.slice(0,5);
}

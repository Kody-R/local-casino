// games/djwild/djwild.payouts.js

// Blind pays only if Player beats Dealer. Others = PUSH.
export const BLIND_PAYTABLE = [
  ["FIVE_WILDS",     1000],
  ["ROYAL_FLUSH",       50],
  ["FIVE_OF_KIND",      10],
  ["STRAIGHT_FLUSH",     9],
  ["FOUR_KIND",          4],
  ["FULL_HOUSE",         3],
  ["FLUSH",              2],
  ["STRAIGHT",           1],
  ["OTHER",              0], // PUSH
];

// Trips: different payouts for Wild vs Natural
export const TRIPS_PAYTABLE = [
  ["FIVE_WILDS",      { wild: 2000, natural: 2000 }],
  ["ROYAL_FLUSH",     { wild:   90, natural: 1000 }],
  ["FIVE_OF_KIND",    { wild:   70, natural:   70 }],
  ["STRAIGHT_FLUSH",  { wild:   25, natural:  200 }],
  ["FOUR_KIND",       { wild:    6, natural:   60 }],
  ["FULL_HOUSE",      { wild:    5, natural:   30 }],
  ["FLUSH",           { wild:    4, natural:   25 }],
  ["STRAIGHT",        { wild:    3, natural:   20 }],
  ["THREE_KIND",      { wild:    1, natural:    6 }],
];

// Two-Way Bad Beat: if Trips+ loses, pay by hand beaten
export const BAD_BEAT_PAYTABLE = [
  ["ROYAL_FLUSH",     500],
  ["FIVE_OF_KIND",    500],
  ["STRAIGHT_FLUSH",  500],
  ["FOUR_KIND",       300],
  ["FULL_HOUSE",      200],
  ["FLUSH",           100],
  ["STRAIGHT",         50],
  ["THREE_KIND",       15],
];

export function lookup(table, key) {
  const row = table.find(([k]) => k === key);
  return row ? row[1] : 0;
}

// games/roulette/roulette.engine.js

export const EURO_WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const REDS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function spinWheel() {
  const index = Math.floor(Math.random() * EURO_WHEEL.length);
  const number = EURO_WHEEL[index];
  return { index, number };
}

export function evaluateBet(bet, number) {
  switch (bet.type) {
    case "STRAIGHT":
      return bet.value === number ? 35 : -1;

    case "RED":
      return REDS.has(number) ? 1 : -1;

    case "BLACK":
      return number !== 0 && !REDS.has(number) ? 1 : -1;

    case "EVEN":
      return number !== 0 && number % 2 === 0 ? 1 : -1;

    case "ODD":
      return number % 2 === 1 ? 1 : -1;

    case "LOW":
      return number >= 1 && number <= 18 ? 1 : -1;

    case "HIGH":
      return number >= 19 && number <= 36 ? 1 : -1;

    case "DOZEN1":
      return number >= 1 && number <= 12 ? 2 : -1;

    case "DOZEN2":
      return number >= 13 && number <= 24 ? 2 : -1;

    case "DOZEN3":
      return number >= 25 && number <= 36 ? 2 : -1;

    default:
      return -1;
  }
}

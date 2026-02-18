// core/cards.js
export const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
export const SUITS = ["S","H","D","C"];
export const SUIT_SYMBOL = { S:"♠", H:"♥", D:"♦", C:"♣" };

export function makeDeck() {
  const deck = [];
  for (const r of RANKS) for (const s of SUITS) deck.push({ r, s });
  return deck;
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function suitClass(s) {
  return (s === "H" || s === "D") ? "red" : "black";
}

function rankDisplay(r) {
  return r === "T" ? "10" : r;
}

// core/cards.js
// core/cards.js (replace renderCards with this)
export function renderCards(el, cards, faceDown=false, opts = {}) {
  const { highlightIdx = null, dimOthers = false } = opts;

  el.innerHTML = "";
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const card = document.createElement("div");

    let cls = `pokerCard ${faceDown ? "isBack" : ""}`;

    if (!faceDown && highlightIdx instanceof Set) {
      const isHi = highlightIdx.has(i);
      if (isHi) cls += " hi";
      else if (dimOthers) cls += " dim";
    }

    // JOKER handling
    const isJoker = !faceDown && (c?.joker === true || c?.r === "JOKER");
    if (!faceDown && !isJoker) {
      cls += (c.s === "H" || c.s === "D") ? " red" : " black";
    }

    card.className = cls;

    if (faceDown) {
      card.innerHTML = `
        <div class="backPattern"></div>
        <div class="backCenter">♠♥♦♣</div>
      `;
    } else if (isJoker) {
  card.classList.add("joker");

  card.innerHTML = `
    <div class="corner tl jokerCorner">
      <div class="rank">J</div>
      <div class="suit">★</div>
    </div>

    <div class="jokerCenter">
      <div class="jokerText">JOKER</div>
    </div>

    <div class="corner br jokerCorner">
      <div class="rank">J</div>
      <div class="suit">★</div>
    </div>
  `;
}
 else {
      const r = c.r === "T" ? "10" : c.r;
      const suit = SUIT_SYMBOL[c.s];
      card.innerHTML = `
        <div class="corner tl">
          <div class="rank">${r}</div>
          <div class="suit">${suit}</div>
        </div>

        <div class="pip">${suit}</div>

        <div class="corner br">
          <div class="rank">${r}</div>
          <div class="suit">${suit}</div>
        </div>
      `;
    }

    el.appendChild(card);
  }
}



export function renderCardBack(el, count = 1) {
  el.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "pokerCard isBack";
    card.innerHTML = `
      <div class="backPattern"></div>
      <div class="backCenter">♠♥♦♣</div>
    `;
    el.appendChild(card);
  }
}

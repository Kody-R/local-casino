// main.js
import { initStore, renderPlayerPanel } from "./core/store.js";

const els = {
  gamePicker: document.querySelector("#gamePicker"),
  btnLoadGame: document.querySelector("#btnLoadGame"),
  gameMount: document.querySelector("#gameMount"),
};

let store;

async function loadGame(gameKey) {
  els.gameMount.innerHTML = "";

  if (gameKey === "threecard") {
    const mod = await import("./games/threecard/threecard.ui.js");
    mod.mountThreeCard(els.gameMount, store);
  } else if (gameKey === "blackjackplus") {
    const mod = await import("./games/blackjackplus/blackjackplus.ui.js");
    mod.mountBlackjackPlus(els.gameMount, store);
  } else if (gameKey === "crazy4") {
    const mod = await import("./games/crazy4/crazy4.ui.js");
    mod.mountCrazy4(els.gameMount, store);
  } else if (gameKey === "uth") {
    const mod = await import("./games/uth/uth.ui.js");
    mod.mountUTH(els.gameMount, store);
  } else if (gameKey === "ilovesuits") {
    const mod = await import("./games/ilovesuits/ilovesuits.ui.js");
    mod.mountILoveSuits(els.gameMount, store);
  } else if (gameKey === "roulette") {
    const mod = await import("./games/roulette/roulette.ui.js");
    mod.mountRoulette(els.gameMount, store);
  } else if (gameKey === "slots") {
    const mod = await import("./games/slots/slots.ui.js");
    mod.mountSlots(els.gameMount, store);
  } else if (gameKey === "missstud") {
  const mod = await import("./games/missstud/missstud.ui.js");
  mod.mountMissStud(els.gameMount, store);
  } else if (gameKey === "djwild") {
  const mod = await import("./games/djwild/djwild.ui.js");
  mod.mountDJWild(els.gameMount, store);
  } else if (gameKey === "baccarat") {
  const mod = await import("./games/baccarat/baccarat.ui.js");
  mod.mountBaccarat(els.gameMount, store);
  } else if (gameKey === "paigow") {
  const mod = await import("./games/paigow/paigow.ui.js");
  mod.mountPaiGow(els.gameMount, store);
  }else if (gameKey === "horserace") {
  const mod = await import("./games/horserace/horserace.ui.js");
  mod.mountHorseRacing(els.gameMount, store); 
  } else {
        els.gameMount.textContent = "Unknown game.";
      }
}

async function init() {
  store = await initStore();

  // This assumes your left panel elements are still in the DOM with the same IDs.
  await renderPlayerPanel(store);

  els.btnLoadGame.addEventListener("click", async () => {
    await loadGame(els.gamePicker.value);
  });

  // auto-load first game
  await loadGame(els.gamePicker.value);
}

init();

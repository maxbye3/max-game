"use strict";
(() => {
  // js/world-state.ts
  var NIALL_FIGHT_COMPLETE_KEY = "max-game:niall-fight-complete";
  function markNiallFightComplete() {
    try {
      window.localStorage.setItem(NIALL_FIGHT_COMPLETE_KEY, "true");
    } catch {
    }
  }

  // js/niall-fight.ts
  var playerMoves = {
    splash: {
      label: "Splash",
      damage: 0,
      message: "MAX used SPLASH. Nothing happened."
    },
    lecture: {
      label: "Lecture",
      damage: 20,
      message: "MAX used LECTURE. It was super effective."
    },
    calm: {
      label: "Tell him to calm down",
      damage: 20,
      message: "MAX told NIALL to calm down."
    },
    chelsea: {
      label: "Chelsea",
      damage: 20,
      message: "MAX used CHELSEA."
    },
    reprimand: {
      label: "Reprimand",
      damage: 20,
      message: "MAX used REPRIMAND."
    }
  };
  var niallAttacks = [
    {
      label: "Headbutt",
      damage: 10,
      message: "NIALL used HEADBUTT."
    },
    {
      label: "Opens a red stripe",
      damage: 0,
      message: "NIALL opened a RED STRIPE. It did nothing."
    },
    {
      label: "Sets up a game of Smash",
      damage: 0,
      fomo: true,
      message: "NIALL set up a game of SMASH. MAX got FOMO."
    },
    {
      label: "Posts a food pic on WhatsApp",
      damage: 10,
      message: "NIALL posted a food pic on WhatsApp."
    },
    {
      label: "Tallulah attacks",
      damage: 10,
      message: "TALLULAH attacked."
    },
    {
      label: "Stays at your house for two weeks",
      damage: 20,
      message: "NIALL stayed at your house for two weeks."
    }
  ];
  function requireElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing Niall fight UI: ${selector}`);
    return element;
  }
  var playerHpMeter = requireElement("#player-hp");
  var niallHpMeter = requireElement("#niall-hp");
  var playerHpText = requireElement("#player-hp-text");
  var fomoStatus = requireElement("#fomo-status");
  var battleLog = requireElement("#battle-log");
  var moveGrid = requireElement("#move-grid");
  var busLink = requireElement("#bus-link");
  var playerHp = 100;
  var niallHp = 100;
  var fomoStacks = 0;
  var battleOver = false;
  var waitingForNiall = false;
  function clampHp(value) {
    return Math.max(0, Math.min(100, value));
  }
  function renderBattle() {
    playerHpMeter.value = playerHp;
    niallHpMeter.value = niallHp;
    playerHpText.textContent = String(playerHp);
    fomoStatus.textContent = `FOMO: ${fomoStacks}`;
    fomoStatus.classList.toggle("active", fomoStacks > 0);
    moveGrid.querySelectorAll("button").forEach((button) => {
      button.disabled = battleOver || waitingForNiall;
    });
  }
  function appendLog(message) {
    battleLog.textContent = message;
  }
  function damage(side, amount) {
    if (side === "player") playerHp = clampHp(playerHp - amount);
    else niallHp = clampHp(niallHp - amount);
  }
  function finishBattle(winner) {
    battleOver = true;
    waitingForNiall = false;
    markNiallFightComplete();
    moveGrid.hidden = true;
    busLink.hidden = false;
    appendLog(
      winner === "player" ? "NIALL fainted. NIALL offered to walk you to the bus." : "MAX fainted. NIALL offered to walk you to the bus."
    );
  }
  function applyFomoDamage() {
    if (fomoStacks === 0) return false;
    const amount = fomoStacks * 10;
    damage("player", amount);
    appendLog(`FOMO hurt MAX for ${amount} damage.`);
    renderBattle();
    if (playerHp <= 0) {
      finishBattle("niall");
      return true;
    }
    return false;
  }
  function chooseNiallAttack() {
    const index = Math.floor(Math.random() * niallAttacks.length);
    return niallAttacks[index] ?? niallAttacks[0];
  }
  function niallTurn() {
    if (battleOver) return;
    waitingForNiall = false;
    const attack = chooseNiallAttack();
    if (attack.fomo) fomoStacks = Math.min(2, fomoStacks + 1);
    damage("player", attack.damage);
    appendLog(attack.message);
    renderBattle();
    if (playerHp <= 0) {
      finishBattle("niall");
      return;
    }
    window.setTimeout(() => {
      if (!battleOver) applyFomoDamage();
    }, 850);
  }
  function useMove(move) {
    if (battleOver || waitingForNiall) return;
    waitingForNiall = true;
    damage("niall", move.damage);
    appendLog(move.message);
    renderBattle();
    if (niallHp <= 0) {
      finishBattle("player");
      return;
    }
    renderBattle();
    window.setTimeout(niallTurn, 850);
  }
  moveGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-move]");
    if (!button) return;
    const move = playerMoves[button.dataset.move ?? ""];
    if (move) useMove(move);
  });
  renderBattle();
})();

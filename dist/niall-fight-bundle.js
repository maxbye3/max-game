"use strict";
(() => {
  // js/battle-outcome.ts
  var RESULTS = {
    victory: {
      message: "Alright, I'll walk you to the bus",
      linkLabel: "Walk to the bus",
      href: "../index.html?niall=bus",
      niallQuestState: "following"
    },
    defeat: {
      message: "PLAYER fainted. Better luck next time.",
      linkLabel: "Back to the map",
      href: "../index.html"
    },
    escape: {
      message: "Alright, I'll walk you back to the bus.",
      linkLabel: "Walk to the bus",
      href: "../index.html?niall=bus",
      niallQuestState: "following"
    }
  };
  function getBattleResult(outcome) {
    return RESULTS[outcome];
  }

  // js/elements.ts
  function requireElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
  }

  // js/niall-battle.ts
  var PLAYER_MAX_HP = 100;
  var NIALL_MAX_HP = 120;
  var NIALL_ATTACKS = [
    { damage: 10, message: "NIALL used HEADBUTT." },
    { damage: 0, message: "NIALL opened a RED STRIPE. It did nothing." },
    { damage: 0, fomo: true, message: "NIALL set up a game of SMASH. PLAYER got FOMO." },
    { damage: 10, message: "NIALL posted a food pic on WhatsApp." },
    { damage: 10, message: "TALLULAH attacked." },
    { damage: 20, message: "NIALL stayed at your house for two weeks." }
  ];
  var clamp = (value, maximum) => Math.max(0, Math.min(maximum, value));
  var NiallBattle = class {
    constructor() {
      this.playerHp = PLAYER_MAX_HP;
      this.niallHp = NIALL_MAX_HP;
      this.fomoStacks = 0;
      this.battleOver = false;
      this.waitingForNiall = false;
      this.defending = false;
    }
    get canAct() {
      return !this.battleOver && !this.waitingForNiall;
    }
    damageNiall(amount) {
      this.niallHp = clamp(this.niallHp - amount, NIALL_MAX_HP);
    }
    healPlayer(amount) {
      this.playerHp = clamp(this.playerHp + amount, PLAYER_MAX_HP);
    }
    queueNiallTurn() {
      this.waitingForNiall = true;
    }
    defend() {
      this.defending = true;
      this.queueNiallTurn();
    }
    applyNiallAttack(attack2) {
      this.waitingForNiall = false;
      const damage = this.defending ? Math.floor(attack2.damage / 2) : attack2.damage;
      const defended = damage !== attack2.damage;
      this.defending = false;
      if (attack2.fomo) this.fomoStacks = Math.min(2, this.fomoStacks + 1);
      this.playerHp = clamp(this.playerHp - damage, PLAYER_MAX_HP);
      return { damage, defended };
    }
    applyFomoDamage() {
      const damage = this.fomoStacks * 10;
      this.playerHp = clamp(this.playerHp - damage, PLAYER_MAX_HP);
      return damage;
    }
    finish() {
      this.battleOver = true;
      this.waitingForNiall = false;
      this.defending = false;
    }
  };
  function chooseNiallAttack(random = Math.random) {
    const index = Math.floor(random() * NIALL_ATTACKS.length);
    return NIALL_ATTACKS[index] ?? NIALL_ATTACKS[0];
  }

  // js/storage.ts
  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
    }
  }

  // js/world-state.ts
  var NIALL_QUEST_STATE_KEY = "max-game:niall-quest-state";
  function setNiallQuestState(state) {
    writeStorage(NIALL_QUEST_STATE_KEY, state);
  }

  // js/niall-fight.ts
  var playerHpMeter = requireElement("#player-hp");
  var niallHpMeter = requireElement("#niall-hp");
  var playerHpText = requireElement("#player-hp-text");
  var fomoStatus = requireElement("#fomo-status");
  var battleLog = requireElement("#battle-log");
  var actionGrid = requireElement("#move-grid");
  var itemGrid = requireElement("#item-grid");
  var busLink = requireElement("#bus-link");
  var battleDice = requireElement("#battle-dice");
  var battle = new NiallBattle();
  var runInterval = null;
  function setControlsDisabled(disabled) {
    document.querySelectorAll(".move-grid button").forEach((button) => {
      button.disabled = disabled;
    });
  }
  function renderBattle() {
    playerHpMeter.value = battle.playerHp;
    niallHpMeter.value = battle.niallHp;
    playerHpText.textContent = String(battle.playerHp);
    fomoStatus.textContent = `FOMO: ${battle.fomoStacks}`;
    fomoStatus.classList.toggle("active", battle.fomoStacks > 0);
    setControlsDisabled(!battle.canAct);
  }
  function appendLog(message) {
    battleLog.textContent = message;
  }
  function finishBattle(outcome) {
    const result = getBattleResult(outcome);
    battle.finish();
    actionGrid.hidden = true;
    itemGrid.hidden = true;
    busLink.textContent = result.linkLabel;
    busLink.href = result.href;
    busLink.hidden = false;
    if (result.niallQuestState) setNiallQuestState(result.niallQuestState);
    appendLog(result.message);
    renderBattle();
  }
  function applyFomoDamage() {
    if (battle.fomoStacks === 0) return false;
    const amount = battle.applyFomoDamage();
    appendLog(`FOMO hurt PLAYER for ${amount} damage.`);
    renderBattle();
    if (battle.playerHp <= 0) {
      finishBattle("defeat");
      return true;
    }
    return false;
  }
  function niallTurn() {
    if (battle.battleOver) return;
    const attack2 = chooseNiallAttack();
    const result = battle.applyNiallAttack(attack2);
    appendLog(result.defended ? `${attack2.message} PLAYER defended. Damage was halved.` : attack2.message);
    renderBattle();
    if (battle.playerHp <= 0) {
      finishBattle("defeat");
      return;
    }
    window.setTimeout(() => {
      if (!battle.battleOver) applyFomoDamage();
    }, 850);
  }
  function queueNiallTurn() {
    if (battle.battleOver) return;
    battle.queueNiallTurn();
    renderBattle();
    window.setTimeout(niallTurn, 850);
  }
  function attack() {
    if (!battle.canAct) return;
    battleDice.hidden = false;
    battleDice.classList.remove("shake");
    void battleDice.offsetWidth;
    battleDice.classList.add("shake");
    battleDice.textContent = "?";
    setControlsDisabled(true);
    window.setTimeout(() => {
      const amount = Math.floor(Math.random() * 61);
      battleDice.textContent = String(amount);
      battle.damageNiall(amount);
      appendLog(`PLAYER rolled ${amount}. NIALL took ${amount} damage.`);
      renderBattle();
      if (battle.niallHp <= 0) {
        finishBattle("victory");
        return;
      }
      queueNiallTurn();
    }, 650);
  }
  function run() {
    if (!battle.canAct) return;
    battle.queueNiallTurn();
    let dots = 1;
    appendLog("You tried to runaway and you were.");
    renderBattle();
    runInterval = window.setInterval(() => {
      dots = dots === 3 ? 1 : dots + 1;
      appendLog(`You tried to runaway and you were${".".repeat(dots)}`);
    }, 500);
    window.setTimeout(() => {
      if (runInterval !== null) window.clearInterval(runInterval);
      runInterval = null;
      finishBattle("escape");
    }, 3e3);
  }
  function showItems() {
    if (!battle.canAct) return;
    actionGrid.hidden = true;
    itemGrid.hidden = false;
    appendLog("Choose an item.");
  }
  function showActions() {
    if (!battle.canAct) return;
    itemGrid.hidden = true;
    actionGrid.hidden = false;
    appendLog("What will PLAYER do?");
  }
  function defend() {
    if (!battle.canAct) return;
    battle.defend();
    appendLog("PLAYER curled into fetal position.");
    renderBattle();
    window.setTimeout(niallTurn, 850);
  }
  function useItem(item) {
    if (!battle.canAct) return;
    itemGrid.hidden = true;
    actionGrid.hidden = false;
    if (item === "vape") {
      appendLog("PLAYER used VAPE. NIALL took it and appreciated it.");
      queueNiallTurn();
      return;
    }
    if (item === "capri-sun") {
      battle.healPlayer(50);
      appendLog("PLAYER used CAPRI SUN. PLAYER recovered 50 HP.");
      queueNiallTurn();
      return;
    }
    if (item === "pocket-lint") {
      appendLog("PLAYER used POCKET LINT. NIALL looked at it and shrugged.");
      queueNiallTurn();
      return;
    }
    if (item === "gun") {
      battle.damageNiall(50);
      appendLog("PLAYER used GUN. NIALL took 50 damage. It was super effective.");
      renderBattle();
      if (battle.niallHp <= 0) {
        finishBattle("victory");
        return;
      }
      queueNiallTurn();
    }
  }
  actionGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "attack") attack();
    else if (action === "run") run();
    else if (action === "items") showItems();
    else if (action === "defend") defend();
  });
  itemGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action], [data-item]");
    if (!button) return;
    if (button.dataset.action === "back") {
      showActions();
      return;
    }
    const item = button.dataset.item;
    if (item) useItem(item);
  });
  renderBattle();
})();

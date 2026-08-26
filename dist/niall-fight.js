import { markNiallFightComplete } from './world-state.js';
const PLAYER_MAX_HP = 100;
const NIALL_MAX_HP = 120;
const niallAttacks = [
    {
        damage: 10,
        message: 'NIALL used HEADBUTT.',
    },
    {
        damage: 0,
        message: 'NIALL opened a RED STRIPE. It did nothing.',
    },
    {
        damage: 0,
        fomo: true,
        message: 'NIALL set up a game of SMASH. MAX got FOMO.',
    },
    {
        damage: 10,
        message: 'NIALL posted a food pic on WhatsApp.',
    },
    {
        damage: 10,
        message: 'TALLULAH attacked.',
    },
    {
        damage: 20,
        message: 'NIALL stayed at your house for two weeks.',
    },
];
function requireElement(selector) {
    const element = document.querySelector(selector);
    if (!element)
        throw new Error(`Missing Niall fight UI: ${selector}`);
    return element;
}
const playerHpMeter = requireElement('#player-hp');
const niallHpMeter = requireElement('#niall-hp');
const playerHpText = requireElement('#player-hp-text');
const fomoStatus = requireElement('#fomo-status');
const battleLog = requireElement('#battle-log');
const actionGrid = requireElement('#move-grid');
const itemGrid = requireElement('#item-grid');
const busLink = requireElement('#bus-link');
const battleDice = requireElement('#battle-dice');
let playerHp = PLAYER_MAX_HP;
let niallHp = NIALL_MAX_HP;
let fomoStacks = 0;
let battleOver = false;
let waitingForNiall = false;
let defending = false;
let runInterval = null;
function clamp(value, max) {
    return Math.max(0, Math.min(max, value));
}
function setControlsDisabled(disabled) {
    document.querySelectorAll('.move-grid button').forEach((button) => {
        button.disabled = disabled;
    });
}
function renderBattle() {
    playerHpMeter.value = playerHp;
    niallHpMeter.value = niallHp;
    playerHpText.textContent = String(playerHp);
    fomoStatus.textContent = `FOMO: ${fomoStacks}`;
    fomoStatus.classList.toggle('active', fomoStacks > 0);
    setControlsDisabled(battleOver || waitingForNiall);
}
function appendLog(message) {
    battleLog.textContent = message;
}
function damage(side, amount) {
    if (side === 'player')
        playerHp = clamp(playerHp - amount, PLAYER_MAX_HP);
    else
        niallHp = clamp(niallHp - amount, NIALL_MAX_HP);
}
function healPlayer(amount) {
    playerHp = clamp(playerHp + amount, PLAYER_MAX_HP);
}
function finishBattle(winner) {
    battleOver = true;
    waitingForNiall = false;
    defending = false;
    markNiallFightComplete();
    actionGrid.hidden = true;
    itemGrid.hidden = true;
    busLink.hidden = false;
    appendLog(winner === 'player'
        ? 'NIALL fainted. NIALL offered to walk you to the bus.'
        : 'MAX fainted. NIALL offered to walk you to the bus.');
    renderBattle();
}
function finishRun() {
    battleOver = true;
    waitingForNiall = false;
    actionGrid.hidden = true;
    itemGrid.hidden = true;
    busLink.textContent = 'Back to the map';
    busLink.href = '../index.html';
    busLink.hidden = false;
    appendLog('You tried to runaway and you were... Successful!');
    renderBattle();
}
function applyFomoDamage() {
    if (fomoStacks === 0)
        return false;
    const amount = fomoStacks * 10;
    damage('player', amount);
    appendLog(`FOMO hurt MAX for ${amount} damage.`);
    renderBattle();
    if (playerHp <= 0) {
        finishBattle('niall');
        return true;
    }
    return false;
}
function chooseNiallAttack() {
    const index = Math.floor(Math.random() * niallAttacks.length);
    return niallAttacks[index] ?? niallAttacks[0];
}
function niallTurn() {
    if (battleOver)
        return;
    waitingForNiall = false;
    const attack = chooseNiallAttack();
    const attackDamage = defending ? Math.floor(attack.damage / 2) : attack.damage;
    defending = false;
    if (attack.fomo)
        fomoStacks = Math.min(2, fomoStacks + 1);
    damage('player', attackDamage);
    appendLog(attack.damage > 0 && attackDamage !== attack.damage
        ? `${attack.message} MAX defended. Damage was halved.`
        : attack.message);
    renderBattle();
    if (playerHp <= 0) {
        finishBattle('niall');
        return;
    }
    window.setTimeout(() => {
        if (!battleOver)
            applyFomoDamage();
    }, 850);
}
function queueNiallTurn() {
    if (battleOver)
        return;
    waitingForNiall = true;
    renderBattle();
    window.setTimeout(niallTurn, 850);
}
function attack() {
    if (battleOver || waitingForNiall)
        return;
    battleDice.hidden = false;
    battleDice.classList.remove('shake');
    void battleDice.offsetWidth;
    battleDice.classList.add('shake');
    battleDice.textContent = '?';
    setControlsDisabled(true);
    window.setTimeout(() => {
        const amount = Math.floor(Math.random() * 61);
        battleDice.textContent = String(amount);
        damage('niall', amount);
        appendLog(`MAX rolled ${amount}. NIALL took ${amount} damage.`);
        renderBattle();
        if (niallHp <= 0) {
            finishBattle('player');
            return;
        }
        queueNiallTurn();
    }, 650);
}
function run() {
    if (battleOver || waitingForNiall)
        return;
    waitingForNiall = true;
    let dots = 1;
    appendLog('You tried to runaway and you were.');
    renderBattle();
    runInterval = window.setInterval(() => {
        dots = dots === 3 ? 1 : dots + 1;
        appendLog(`You tried to runaway and you were${'.'.repeat(dots)}`);
    }, 500);
    window.setTimeout(() => {
        if (runInterval !== null)
            window.clearInterval(runInterval);
        runInterval = null;
        finishRun();
    }, 3000);
}
function showItems() {
    if (battleOver || waitingForNiall)
        return;
    actionGrid.hidden = true;
    itemGrid.hidden = false;
    appendLog('Choose an item.');
}
function showActions() {
    if (battleOver || waitingForNiall)
        return;
    itemGrid.hidden = true;
    actionGrid.hidden = false;
    appendLog('What will MAX do?');
}
function defend() {
    if (battleOver || waitingForNiall)
        return;
    defending = true;
    appendLog('MAX curled into fetal position.');
    queueNiallTurn();
}
function useItem(item) {
    if (battleOver || waitingForNiall)
        return;
    itemGrid.hidden = true;
    actionGrid.hidden = false;
    if (item === 'vape') {
        appendLog('MAX used VAPE. NIALL took it and appreciated it.');
        queueNiallTurn();
        return;
    }
    if (item === 'capri-sun') {
        healPlayer(50);
        appendLog('MAX used CAPRI SUN. MAX recovered 50 HP.');
        queueNiallTurn();
        return;
    }
    if (item === 'pocket-lint') {
        appendLog('MAX used POCKET LINT. NIALL looked at it and shrugged.');
        queueNiallTurn();
        return;
    }
    if (item === 'gun') {
        damage('niall', 50);
        appendLog('MAX used GUN. NIALL took 50 damage. It was super effective.');
        renderBattle();
        if (niallHp <= 0) {
            finishBattle('player');
            return;
        }
        queueNiallTurn();
    }
}
actionGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button)
        return;
    const action = button.dataset.action;
    if (action === 'attack')
        attack();
    else if (action === 'run')
        run();
    else if (action === 'items')
        showItems();
    else if (action === 'defend')
        defend();
});
itemGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action], [data-item]');
    if (!button)
        return;
    if (button.dataset.action === 'back') {
        showActions();
        return;
    }
    const item = button.dataset.item;
    if (item)
        useItem(item);
});
renderBattle();
//# sourceMappingURL=niall-fight.js.map
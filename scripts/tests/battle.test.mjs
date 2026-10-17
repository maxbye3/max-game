import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const battle = await loadModule('battle-outcome', 'js/characters/niall/battle-outcome.ts');
  assert.equal(battle.getBattleResult('victory').niallQuestState, 'following');
  assert.equal(battle.getBattleResult('defeat').niallQuestState, 'following');
  assert.equal(battle.getBattleResult('defeat').href, '../index.html?niall=bus');
  assert.match(battle.getBattleResult('defeat').message, /YOU LOSE!.*walk you back to the bus/);
  assert.deepEqual(battle.getBattleResult('escape'), {
    message: "Alright, I'll walk you back to the bus.",
    linkLabel: 'Walk to the bus',
    href: '../index.html?niall=bus',
    niallQuestState: 'following',
  });

  const niallBattle = await loadModule('niall-battle', 'js/characters/niall/niall-battle.ts');
  assert.equal(niallBattle.PLAYER_ATTACKS[2].message, 'You tell Niall his pumpkin pie was too dry.');
  assert.equal(niallBattle.PLAYER_ATTACKS[2].effectMessage, 'Niall begins smoking furiously. NIALL loses 20 HP.');
  const playNiallFight = (healBeforeRound = -1) => {
    const fight = new niallBattle.NiallBattle();
    const enemyMoves = [];
    const playerMoves = [];
    for (let round = 0; round < 15 && fight.canAct; round += 1) {
      if (round === healBeforeRound) fight.useHealthItem();
      const niallHpBeforeSetup = fight.niallHp;
      const playerMove = fight.takePlayerTurn(true);
      if (!playerMove) break;
      playerMoves.push(playerMove);
      assert.equal(fight.niallHp, niallHpBeforeSetup, 'player setup screen does not apply damage');
      assert.equal(fight.takePlayerTurn(true), null, 'Niall must respond before the player takes another turn');
      assert.equal(fight.useHealthItem(), 0, 'items cannot interrupt Niall\'s response');
      fight.resolvePlayerTurn();
      if (!fight.waitingForNiall) break;
      const playerHpBeforeSetup = fight.playerHp;
      const enemyMove = fight.takeNiallTurn();
      if (enemyMove) enemyMoves.push(enemyMove);
      assert.equal(fight.waitingForNiall, false, 'Niall takes exactly one action per player turn');
      assert.equal(fight.playerHp, playerHpBeforeSetup, 'Niall setup screen does not apply damage');
      assert.equal(fight.takeNiallTurn(), null, 'Niall cannot attack twice in one turn');
      fight.resolveNiallTurn();
    }
    return { fight, enemyMoves, playerMoves };
  };

  const unhealed = playNiallFight();
  assert.equal(unhealed.fight.playerHp, 0, 'without healing Buckfast defeats the player');
  assert.equal(unhealed.fight.niallHp, 40, 'Niall survives when Buckfast defeats the unhealed player');
  assert.equal(unhealed.fight.niallAttackIndex, 10, 'Buckfast is the final attack in the unhealed battle');
  assert.equal(unhealed.enemyMoves.at(-1).passOut, true);
  assert.equal(
    unhealed.enemyMoves.at(-1).message,
    'Niall challenges you to drink Buckfast.',
  );
  assert.equal(unhealed.enemyMoves.at(-1).effectMessage, 'You pass out.');
  assert.equal(unhealed.fight.canAct, false);
  assert.equal(unhealed.fight.useHealthItem(), 0, 'healing cannot revive a defeated player');
  assert.equal(unhealed.fight.hasFomo, true);
  assert.equal(unhealed.enemyMoves[1].fomo, true);
  assert.equal(unhealed.enemyMoves[1].damage, 8, 'FOMO has its own damage value');
  assert.deepEqual(unhealed.enemyMoves.slice(0, 8).map((move) => move.damage), [8, 8, 12, 8, 10, 8, 10, 6]);
  assert.equal(unhealed.enemyMoves[8].selfDamage, 10, 'Red Stripe damages Niall');
  assert.equal(niallBattle.NIALL_MAX_HP, 180, 'Niall has the increased health total');

  const healed = playNiallFight(8);
  assert.equal(healed.fight.healthItemUsed, true);
  assert.equal(healed.fight.playerHp, 4, 'one late health item lets the player survive Buckfast and the recycled attacks');
  assert.equal(healed.fight.niallHp, 0, 'recycled player attacks can defeat Niall');
  assert.equal(healed.fight.niallAttackIndex, 12);
  assert.deepEqual(healed.playerMoves.slice(6, 12), niallBattle.PLAYER_ATTACKS, 'all player commands repeat after hot sauce');
  assert.deepEqual(healed.enemyMoves.slice(10), niallBattle.NIALL_ATTACKS.slice(0, 2), 'Niall restarts his attacks after Buckfast');
  assert.match(niallBattle.PLAYER_ATTACKS[4].message, /North Korea/, 'the Korean attack comes later in the list');
  assert.equal(healed.fight.takeNiallTurn(), null, 'Niall cannot attack after being defeated');
  assert.equal(healed.fight.useHealthItem(), 0, 'the healing item cannot be reused');

  const potion = new niallBattle.NiallBattle();
  assert.equal(potion.useHealthItem(), 0);
  assert.equal(potion.healthItemUsed, false, 'using the item at full health does not waste it');
  potion.takePlayerTurn(true);
  potion.resolvePlayerTurn();
  assert.equal(potion.takeNiallTurn().damage, 8);
  potion.resolveNiallTurn();
  assert.equal(potion.useHealthItem(), 8, 'healing reports the actual amount and caps at maximum HP');
  assert.equal(potion.playerHp, niallBattle.PLAYER_MAX_HP);
  assert.equal(potion.niallAttackIndex, 1, 'healing does not skip an attack in the scripted exchange');
  assert.equal(potion.useHealthItem(), 0);

  assert.equal(new niallBattle.NiallBattle(0.5).playerHp, 40, 'overworld health scales to battle HP');
  assert.equal(new niallBattle.NiallBattle(0).canAct, false);
});

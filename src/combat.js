export const PLAYER_MAX = 14;
export const TURN_CAP = 4;

export const ENEMIES = {
  cellar_rat: {
    id: 'cellar_rat',
    name: 'Cellar Rat',
    hp: 8,
    intents: [
      { name: 'Bite', damage: 3, line: 'Bite. Small teeth, full commitment.' },
      { name: 'Lunge', damage: 5, line: 'Lunge. It has decided you are furniture.' },
    ],
  },
  ghoul: {
    id: 'ghoul',
    name: 'Ghoul',
    hp: 10,
    intents: [
      { name: 'Wail', damage: 6, line: 'Wail. Your knees file a separate complaint.' },
      { name: 'Claw', damage: 4, line: 'Claw. It remembers what hands were for.' },
    ],
  },
};

const KNOW = {
  hunter: {
    name: 'Fire-craft',
    damage: 5,
    burn: 3,
    line: 'Fire-craft. You talk flame into something that had other plans.',
  },
  legionary: {
    name: 'Formation',
    damage: 2,
    brace: 3,
    line: 'Formation. Old habit. The hit that follows has to work for it.',
  },
  engineer: {
    name: 'Contraptions',
    damage: 6,
    jam: true,
    line: 'Contraptions. A pin, a pipe, a result you will not fully explain.',
  },
  gangster: {
    name: 'Shakedown',
    damage: 3,
    heal: 3,
    line: 'Shakedown. You ask the room for a contribution. It pays.',
  },
  paramedic: {
    name: 'Triage',
    damage: 2,
    heal: 6,
    line: 'Triage. You stop the worst bleed and shove the problem back.',
  },
  office_worker: {
    name: 'Paperwork',
    damage: 2,
    jam: true,
    line: 'Paperwork. Their attack is missing a signature. Denied.',
  },
};

export function knowHowFor(originId) {
  return KNOW[originId] || KNOW.office_worker;
}

export function startFight(enemyId) {
  const enemy = ENEMIES[enemyId];
  return {
    enemyId,
    playerHp: PLAYER_MAX,
    playerMax: PLAYER_MAX,
    enemyHp: enemy.hp,
    enemyMax: enemy.hp,
    turn: 0,
    knowHowUsed: false,
    over: null,
    log: 'It sees you. The floor has seen worse. You are still the one holding the weapon.',
  };
}

export function enemyIntent(state) {
  const enemy = ENEMIES[state.enemyId];
  return enemy.intents[state.turn % enemy.intents.length];
}

export function resolveTurn(state, action, originId) {
  if (state.over) return { state, events: [] };
  if (action === 'know' && state.knowHowUsed) return { state, events: [] };

  const intent = enemyIntent(state);
  const know = knowHowFor(originId);
  const events = [];
  let playerHp = state.playerHp;
  let enemyHp = state.enemyHp;
  let knowHowUsed = state.knowHowUsed;
  let log = '';
  let jam = false;
  let brace = 0;
  let burn = 0;

  if (action === 'attack') {
    enemyHp = Math.max(0, enemyHp - 4);
    events.push('player-attack', 'enemy-hurt');
    log = 'You swing. It is not art. It is enough to be noticed.';
  } else if (action === 'defend') {
    brace = 3;
    events.push('player-defend');
    log = 'You cover up. The bards will cut this part.';
  } else if (action === 'know') {
    knowHowUsed = true;
    if (know.damage) {
      enemyHp = Math.max(0, enemyHp - know.damage);
      events.push('player-attack', 'enemy-hurt');
    } else {
      events.push('player-know');
    }
    if (know.heal) playerHp = Math.min(state.playerMax, playerHp + know.heal);
    if (know.brace) brace = know.brace;
    if (know.jam) jam = true;
    if (know.burn) burn = know.burn;
    log = know.line;
  } else {
    return { state, events: [] };
  }

  if (enemyHp > 0 && !jam) {
    const hit = Math.max(0, intent.damage - brace);
    events.push('enemy-attack', 'player-hurt');
    playerHp = Math.max(0, playerHp - hit);
    log = `${log} ${intent.name} comes back for ${hit}.`;
  } else if (enemyHp > 0 && jam) {
    events.push('enemy-stalled');
    log = `${log} Their turn sits in a queue.`;
  }

  if (burn && enemyHp > 0) {
    enemyHp = Math.max(0, enemyHp - burn);
    log = `${log} Then the burn catches.`;
  }

  let over = null;
  if (enemyHp <= 0) over = 'win';
  else if (playerHp <= 0) over = 'dead';
  else if (state.turn + 1 >= TURN_CAP) {
    over = 'win';
    log = `${log} It gets bored of you and leaves.`;
  }

  if (over === 'win' && enemyHp <= 0) {
    log = `${log} It stops. Rude, but fair.`;
  }
  if (over === 'dead') {
    log = 'You go down between one breath and the next. The Scar takes notes.';
  }

  return {
    state: {
      ...state,
      playerHp,
      enemyHp: Math.max(0, enemyHp),
      knowHowUsed,
      over,
      turn: state.turn + 1,
      log: log.replace(/\s+/g, ' ').trim(),
    },
    events,
  };
}

// WOK HEI — game loop, state machine, input, spawning, scoring, win/lose, shot scenes.
import { W, H, INGREDIENTS, WOK_DEFS, NIGHTS, UPGRADES, CRITIC } from './config.js';
import { Wok, Order, Flyer, Particle, FloatText, dishMatchesOrder, randomOrderItems } from './entities.js';
import { cookTimeOf, perfectWindowOf, burnTimeOf, goldBonusOf, scoreBonusOf, patienceBonusOf, comboFloorOf, buyUpgrade, drawRelic, refillAbilities, useAbility, upgradeDef } from './upgrades.js';
import { render, hitZones, wokCenter, ING_BTN } from './render.js';
import { sfx, setMuted, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  screen: 'title',
  night: 1,
  quota: 8,
  served: 0,
  totalServed: 0,
  score: 0,
  best: 0,
  gold: 0,
  combo: 1,
  maxCombo: 1,
  reputation: 3,
  maxRep: 3,
  perfects: 0,
  burnt: 0,
  lost: 0,
  woks: [],
  orders: [],
  incoming: [],
  relics: [],
  upgrades: {},
  abilities: { flash: 2, hands: 2, ice: 1 },
  selectedWok: 0,
  rush: { active: false, t: 0, next: 25 },
  critic: { active: false, approval: 40, served: 0, phase: 0 },
  events: [],
  particles: [],
  flyers: [],
  time: 0,
  spawnTimer: 0,
  criticTimer: 0,
  shake: 0,
  flash: 0,
  muted: false,
  banner: null,
  shopRelic: null,
  shopItems: UPGRADES,
  loseReason: '',
  forgiven: false,
  tossCooldown: 0,
};

function loadBest() {
  try {
    state.best = parseInt(localStorage.getItem('wokhei-best') || '0', 10) || 0;
  } catch (e) {
    state.best = 0;
  }
}
function saveBest() {
  if (state.score > state.best) state.best = state.score;
  try {
    localStorage.setItem('wokhei-best', String(state.best));
  } catch (e) {
    /* storage unavailable: best score lives only in memory */
  }
}

function nightDef() {
  return NIGHTS[state.night - 1];
}

function makePreview() {
  const def = nightDef();
  const items = randomOrderItems(Math.random, def.maxItems, 2);
  return { items, gold: 8 + items.length * 3 };
}

function makeOrder() {
  const spec = state.incoming.shift();
  state.incoming.push(makePreview());
  const def = nightDef();
  const patience = def.patience + patienceBonusOf(state);
  return new Order(spec.items, patience, 100 + spec.items.length * 25, spec.gold, false, null);
}

function makeCriticOrder() {
  const phase = CRITIC.phases[state.critic.phase];
  const seq = randomOrderItems(Math.random, phase.seq, phase.seq);
  return new Order(seq, phase.time, 400, 40, true, seq);
}

function banner(text, sub, color) {
  state.banner = { text, sub: sub || '', color: color || '#f2c94c', t: 2.2 };
}

function floatText(x, y, text, color, size) {
  state.events.push(new FloatText(x, y, text, color, size));
}

function burst(x, y, color, n, kind) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 120;
    state.particles.push(
      new Particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 40, 0.5 + Math.random() * 0.5, color, 2 + Math.random() * 4, kind || 'dot')
    );
  }
}

function startNight(n) {
  state.night = n;
  const def = nightDef();
  state.quota = def.quota;
  state.served = 0;
  state.orders = [];
  state.incoming = [];
  for (let i = 0; i < 5; i++) state.incoming.push(makePreview());
  state.woks.forEach((w) => w.clear());
  state.spawnTimer = 1.2;
  state.rush = { active: false, t: 0, next: 25 };
  state.forgiven = false;
  if (n === 5) {
    state.critic = { active: true, approval: CRITIC.startApproval, served: 0, phase: 0 };
    state.criticTimer = 5;
    banner('MADAME HAS ARRIVED', 'Serve her signature dishes — in order, on time', '#f2c94c');
    sfx.critic();
  } else {
    state.critic = { active: false, approval: 40, served: 0, phase: 0 };
    banner(`NIGHT ${n}`, n === 1 ? 'The market opens — first orders coming in' : 'The crowd grows hungrier', '#f2c94c');
  }
}

function startGame() {
  Object.assign(state, {
    screen: 'play',
    night: 1,
    score: 0,
    gold: 0,
    combo: 1,
    maxCombo: 1,
    reputation: 3,
    maxRep: 3,
    perfects: 0,
    burnt: 0,
    lost: 0,
    totalServed: 0,
    relics: [],
    upgrades: {},
    abilities: { flash: 2, hands: 2, ice: 1 },
    selectedWok: 0,
    events: [],
    particles: [],
    flyers: [],
    shopRelic: null,
    loseReason: '',
    shake: 0,
    flash: 0,
  });
  state.woks = WOK_DEFS.map((d, i) => new Wok({ ...d, index: i }, 0, 0, 88));
  state.woks[0].selected = true;
  startNight(1);
}

function strike(kind) {
  if (state.relics.includes('chopsticks') && !state.forgiven) {
    state.forgiven = true;
    floatText(620, 260, 'GOLDEN CHOPSTICKS — FORGIVEN!', '#f2c94c', 24);
    sfx.coin();
    return;
  }
  state.reputation--;
  state.combo = comboFloorOf(state);
  state.shake = 1;
  if (kind === 'burnt') {
    state.burnt++;
    floatText(620, 260, 'BURNT! -1 REP', '#e5484d', 28);
    sfx.burn();
  } else {
    state.lost++;
    floatText(620, 260, 'ORDER LOST! -1 REP', '#e5484d', 28);
    sfx.lost();
  }
  if (state.reputation <= 0) {
    state.loseReason = kind === 'burnt' ? 'Too many burnt dishes — the crowd drifted away.' : 'Too many hungry customers walked off.';
    endLose();
  }
}

function endWin() {
  saveBest();
  state.screen = 'win';
  state.flash = 1;
  sfx.fanfare();
}

function endLose() {
  saveBest();
  state.screen = 'lose';
}

function addScore(base, x, y) {
  const mult = state.combo * scoreBonusOf(state);
  const pts = Math.round(base * mult);
  state.score += pts;
  return pts;
}

function serveWok(i) {
  const wok = state.woks[i];
  if (!wok || !wok.contents.length) return;
  if (wok.state === 'cooking') {
    floatText(wok.x, wok.y - 130, 'NOT READY YET', '#b9a8e0', 18);
    return;
  }
  if (wok.state === 'burnt') {
    floatText(wok.x, wok.y - 130, 'BURNT — DUMP IT', '#e5484d', 18);
    return;
  }
  const perfect = wok.state === 'ready' && wok.perfectLeft > 0;
  // Critic orders first: her signature dish must never be stolen by a normal ticket.
  const match = state.orders.find((o) => o.critic && dishMatchesOrder(wok.contents, o))
    || state.orders.find((o) => !o.critic && dishMatchesOrder(wok.contents, o));
  if (!match) {
    floatText(wok.x, wok.y - 130, 'NO MATCH', '#ff8a7a', 20);
    state.shake = Math.max(state.shake, 0.4);
    sfx.click();
    return;
  }
  state.orders.splice(state.orders.indexOf(match), 1);
  const pts = addScore(match.reward + (perfect ? 50 : 0), wok.x, wok.y);
  let gold = Math.round(match.gold * goldBonusOf(state) * (state.rush.active ? 1.5 : 1));
  state.gold += gold;
  state.combo = Math.min(8, state.combo + 1 + (perfect && state.upgrades.ladle ? 1 : 0));
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  if (perfect) state.perfects++;
  burst(wok.x, wok.y, '#57cc6a', 16, 'dot');
  burst(wok.x, wok.y - 20, '#f2c94c', 10, 'spark');
  if (match.critic) {
    state.critic.approval = Math.min(100, state.critic.approval + CRITIC.gain);
    state.critic.served++;
    state.critic.phase = Math.min(2, state.critic.served);
    state.criticTimer = 8;
    floatText(710, 200, `CRITIC PLEASED +${CRITIC.gain}%`, '#f2c94c', 26);
    floatText(wok.x, wok.y - 130, `SIGNATURE! +${pts}`, '#f2c94c', 22);
    sfx.critic();
    if (state.critic.approval >= 100) {
      wok.clear();
      endWin();
      return;
    }
  } else {
    state.served++;
    state.totalServed++;
    floatText(wok.x, wok.y - 130, perfect ? `PERFECT! +${pts}` : `+${pts}`, perfect ? '#57cc6a' : '#f5ead2', perfect ? 24 : 20);
    if (state.combo >= 3) floatText(wok.x, wok.y - 158, `COMBO x${state.combo}!`, '#ff9f2e', 22);
    if (perfect) sfx.perfect();
    else sfx.serve();
    if (state.combo >= 5) state.flash = Math.max(state.flash, 0.4);
  }
  wok.clear();
  if (state.night < 5 && state.served >= state.quota) {
    state.shopRelic = drawRelic(state, Math.random);
    refillAbilities(state);
    state.screen = 'shop';
    sfx.fanfare();
  }
}

function dumpWok(i) {
  const wok = state.woks[i];
  if (!wok || !wok.contents.length) return;
  burst(wok.x, wok.y, '#888', 10, 'steam');
  wok.clear();
  sfx.click();
}

function toss(ingIndex) {
  if (state.screen !== 'play') return;
  if (state.tossCooldown > 0 && !state.relics.includes('cleaver')) return;
  const wok = state.woks[state.selectedWok];
  if (!wok) return;
  const ing = INGREDIENTS[ingIndex];
  if (!ing) return;
  if (wok.state === 'burnt') {
    floatText(wok.x, wok.y - 130, 'BURNT — DUMP IT FIRST', '#e5484d', 16);
    return;
  }
  if (wok.full) {
    floatText(wok.x, wok.y - 130, 'WOK FULL', '#ff8a7a', 18);
    return;
  }
  const btn = ING_BTN[ingIndex];
  const boss = state.critic.active;
  const dest = wokCenter(state.selectedWok, boss);
  state.flyers.push(new Flyer(ing.id, btn.x + btn.w / 2, btn.y + 30, dest.x, dest.y));
  wok.addIngredient(ing.id);
  state.tossCooldown = 0.12;
  sfx.toss();
  burst(dest.x, dest.y, ing.color, 4, 'dot');
}

function useAbilityById(id) {
  if (state.screen !== 'play') return;
  if (!useAbility(state, id)) return;
  const wok = state.woks[state.selectedWok];
  if (id === 'flash') {
    if (wok && wok.state === 'cooking') {
      wok.state = 'ready';
      wok.cook = 1;
      wok.perfectLeft = perfectWindowOf(state);
      floatText(wok.x, wok.y - 130, 'FLASH FRY!', '#35c4b5', 22);
      burst(wok.x, wok.y, '#35c4b5', 14, 'spark');
      sfx.perfect();
    } else {
      state.abilities.flash++;
    }
  } else if (id === 'hands') {
    // Toss the next item the oldest active order still needs.
    const order = state.orders.find((o) => !o.critic);
    let done = false;
    if (order && wok && !wok.full && wok.state !== 'burnt') {
      const need = order.items.find((it) => !wok.contents.includes(it));
      if (need) {
        const idx = INGREDIENTS.findIndex((g) => g.id === need);
        const btn = ING_BTN[idx];
        const boss = state.critic.active;
        const dest = wokCenter(state.selectedWok, boss);
        state.flyers.push(new Flyer(need, btn.x + btn.w / 2, btn.y + 30, dest.x, dest.y));
        wok.addIngredient(need);
        floatText(wok.x, wok.y - 130, 'EXTRA HANDS!', '#35c4b5', 20);
        sfx.toss();
        done = true;
      }
    }
    if (!done) state.abilities.hands++;
  } else if (id === 'ice') {
    let saved = 0;
    for (const w of state.woks) {
      if (w.state === 'burning') {
        w.state = 'ready';
        w.perfectLeft = 2;
        w.burn = 0;
        saved++;
      } else if (w.state === 'burnt') {
        w.clear();
        saved++;
      }
    }
    floatText(620, 260, saved ? 'ICE BUCKET — WOKS SAVED!' : 'NOTHING TO COOL', '#35c4b5', 22);
    sfx.coin();
  }
}

function selectWok(i) {
  state.woks.forEach((w, k) => {
    w.selected = k === i;
  });
  state.selectedWok = i;
  sfx.click();
}

function update(dt) {
  state.time += dt;
  state.shake = Math.max(0, state.shake - dt * 2.2);
  state.flash = Math.max(0, state.flash - dt * 1.8);
  state.tossCooldown = Math.max(0, state.tossCooldown - dt);
  if (state.banner) {
    state.banner.t -= dt;
    if (state.banner.t <= 0) state.banner = null;
  }
  state.events = state.events.filter((e) => !e.update(dt));
  state.particles = state.particles.filter((p) => !p.update(dt));
  state.flyers = state.flyers.filter((f) => !f.update(dt));
  if (state.screen !== 'play') return;

  const def = nightDef();
  // rush hour cycle
  if (state.rush.active) {
    state.rush.t -= dt;
    if (state.rush.t <= 0) {
      state.rush.active = false;
      state.rush.next = 28;
    }
  } else {
    state.rush.next -= dt;
    if (state.rush.next <= 0) {
      state.rush.active = true;
      state.rush.t = 12;
      banner('RUSH HOUR!', 'Orders flood in — gold x1.5', '#e5484d');
      sfx.rush();
    }
  }
  // spawn normal orders
  const activeNormal = state.orders.filter((o) => !o.critic).length;
  if (state.served + activeNormal < def.quota + 1 && state.orders.length < 4) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      state.orders.push(makeOrder());
      state.spawnTimer = def.spawn * (state.rush.active ? 0.5 : 1);
    }
  }
  // critic orders on night 5
  if (state.critic.active) {
    const hasCriticOrder = state.orders.some((o) => o.critic);
    if (!hasCriticOrder) {
      state.criticTimer -= dt;
      if (state.criticTimer <= 0) {
        state.orders.push(makeCriticOrder());
        floatText(620, 200, 'MADAME ORDERS — follow the sequence!', '#f2c94c', 22);
        sfx.critic();
      }
    }
  }
  // woks
  const cookTime = cookTimeOf(state);
  const perfectWindow = perfectWindowOf(state);
  const burnTime = burnTimeOf();
  for (const wok of state.woks) {
    const result = wok.update(dt, cookTime, perfectWindow, burnTime);
    if (result === 'burnt') {
      burst(wok.x, wok.y, '#555', 18, 'steam');
      wok.clear();
      strike('burnt');
      if (state.screen !== 'play') return;
    }
    // ambient steam from busy woks
    if (wok.contents.length && Math.random() < dt * 5) {
      state.particles.push(
        new Particle(wok.x + (Math.random() - 0.5) * 60, wok.y - 30, (Math.random() - 0.5) * 10, -28 - Math.random() * 20, 0.9, '#cfc4e8', 5 + Math.random() * 5, 'steam')
      );
    }
  }
  // orders patience
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const o = state.orders[i];
    if (o.update(dt)) {
      state.orders.splice(i, 1);
      if (o.critic) {
        state.critic.approval = Math.max(0, state.critic.approval - CRITIC.loss);
        state.criticTimer = 8;
        floatText(710, 200, `MADAME IS DISPLEASED -${CRITIC.loss}%`, '#e5484d', 24);
        sfx.lost();
        if (state.critic.approval <= 0) {
          state.loseReason = 'Madame Golden Ladle walked out — and took the crowd with her.';
          endLose();
          return;
        }
      } else {
        strike('lost');
        if (state.screen !== 'play') return;
      }
    }
  }
}

// ---- input ----
function onClick(mx, my) {
  unlockAudio();
  for (let i = hitZones.length - 1; i >= 0; i--) {
    const z = hitZones[i];
    if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
      switch (z.action) {
        case 'start':
          startGame();
          return;
        case 'restart':
          startGame();
          return;
        case 'resume':
          state.screen = 'play';
          return;
        case 'pause':
          if (state.screen === 'play') state.screen = 'pause';
          else if (state.screen === 'pause') state.screen = 'play';
          return;
        case 'mute':
          state.muted = !state.muted;
          setMuted(state.muted);
          return;
        case 'selectWok':
          selectWok(z.arg);
          return;
        case 'toss':
          toss(z.arg);
          return;
        case 'serve':
          serveWok(z.arg);
          return;
        case 'dump':
          dumpWok(z.arg);
          return;
        case 'ability':
          useAbilityById(z.arg);
          return;
        case 'buy': {
          const def = upgradeDef(z.arg);
          if (def && buyUpgrade(state, def)) {
            sfx.coin();
            floatText(620, 300, `${def.name} upgraded!`, '#f2c94c', 22);
          }
          return;
        }
        case 'nextNight':
          startNight(state.night + 1);
          state.screen = 'play';
          return;
      }
    }
  }
}

canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const mx = ((e.clientX - r.left) / r.width) * W;
  const my = ((e.clientY - r.top) / r.height) * H;
  onClick(mx, my);
});

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  unlockAudio();
  const k = e.key.toLowerCase();
  if (k === 'm') {
    state.muted = !state.muted;
    setMuted(state.muted);
    return;
  }
  if (k === 'r' && state.screen !== 'title') {
    startGame();
    return;
  }
  if (k === 'p') {
    if (state.screen === 'play') state.screen = 'pause';
    else if (state.screen === 'pause') state.screen = 'play';
    return;
  }
  if (state.screen === 'title' && (k === ' ' || k === 'enter')) {
    startGame();
    return;
  }
  if (state.screen === 'shop' && k === 'enter') {
    startNight(state.night + 1);
    state.screen = 'play';
    return;
  }
  if (state.screen === 'win' || state.screen === 'lose') return;
  if (state.screen !== 'play') return;
  if (k >= '1' && k <= '4') {
    selectWok(parseInt(k, 10) - 1);
    return;
  }
  const ingKeys = ['q', 'w', 'e', 'r', 't', 'y'];
  const ii = ingKeys.indexOf(k);
  if (ii >= 0) {
    toss(ii);
    return;
  }
  if (k === ' ') {
    e.preventDefault();
    serveWok(state.selectedWok);
    return;
  }
  if (k === 'x') {
    dumpWok(state.selectedWok);
    return;
  }
  if (k === 'z') useAbilityById('flash');
  if (k === 'c') useAbilityById('hands');
  if (k === 'v') useAbilityById('ice');
});

// ---- shot scenes (deterministic demo states for screenshots) ----
function demoOrder(items, frac, critic, seq) {
  const o = new Order(items, 30, 100 + items.length * 25, 8 + items.length * 3, critic, seq || null);
  o.patience = 30 * frac;
  o.maxPatience = 30;
  return o;
}

function setupShot(name) {
  startGame();
  state.banner = null; // no night banner in screenshots — it would cover the HUD
  if (name === 'title') {
    state.screen = 'title';
    state.best = 12480;
    return;
  }
  if (name === 'play') {
    Object.assign(state, {
      screen: 'play', night: 3, quota: 12, served: 7, totalServed: 25,
      score: 4210, best: 12480, gold: 86, combo: 5, maxCombo: 6,
      reputation: 3, perfects: 3,
    });
    state.relics = ['chopsticks', 'apron', 'cat'];
    state.upgrades = { wok: 1, scoop: 1 };
    state.abilities = { flash: 2, hands: 1, ice: 1 };
    state.rush = { active: true, t: 6, next: 28 };
    const w = state.woks;
    w[0].addIngredient('noodle');
    w[0].addIngredient('shrimp');
    w[0].state = 'cooking';
    w[0].cook = 0.6;
    w[1].addIngredient('noodle');
    w[1].addIngredient('egg');
    w[1].addIngredient('chili');
    w[1].state = 'ready';
    w[1].cook = 1;
    w[1].perfectLeft = 2.1;
    w[2].addIngredient('greens');
    w[2].state = 'cooking';
    w[2].cook = 0.25;
    w[3].addIngredient('shrimp');
    w[3].addIngredient('shroom');
    w[3].state = 'burning';
    w[3].burn = 0.55;
    selectWok(1);
    state.orders = [
      demoOrder(['noodle', 'egg', 'chili'], 0.8),
      demoOrder(['shrimp', 'greens'], 0.55),
      demoOrder(['noodle', 'shroom', 'egg', 'chili'], 0.32),
      demoOrder(['shrimp', 'chili'], 0.92),
    ];
    state.incoming = [
      { items: ['egg', 'greens'], gold: 14 },
      { items: ['noodle', 'shrimp', 'chili'], gold: 17 },
      { items: ['shroom', 'greens'], gold: 14 },
      { items: ['noodle', 'egg'], gold: 14 },
      { items: ['shrimp', 'egg', 'greens'], gold: 17 },
    ];
    floatText(620, 232, 'PERFECT! +450', '#57cc6a', 30);
    floatText(620, 268, 'COMBO x5!', '#ff9f2e', 26);
    return;
  }
  if (name === 'boss') {
    Object.assign(state, {
      screen: 'play', night: 5, quota: 12, served: 9, totalServed: 41,
      score: 8930, best: 12480, gold: 210, combo: 5, maxCombo: 7,
      reputation: 3, perfects: 8,
    });
    state.critic = { active: true, approval: 62, served: 1, phase: 1 };
    state.criticTimer = 8;
    state.relics = ['chopsticks', 'apron', 'cat', 'phoenix'];
    state.upgrades = { wok: 2, scoop: 2, bellows: 1 };
    state.abilities = { flash: 2, hands: 2, ice: 1 };
    state.rush = { active: false, t: 0, next: 12 };
    const w = state.woks;
    w[0].addIngredient('noodle');
    w[0].addIngredient('shrimp');
    w[0].state = 'cooking';
    w[0].cook = 0.5;
    w[1].addIngredient('greens');
    w[1].addIngredient('shroom');
    w[1].addIngredient('egg');
    w[1].state = 'ready';
    w[1].cook = 1;
    w[1].perfectLeft = 1.6;
    w[2].addIngredient('chili');
    w[2].state = 'cooking';
    w[2].cook = 0.3;
    w[3].addIngredient('noodle');
    w[3].state = 'burning';
    w[3].burn = 0.4;
    selectWok(0);
    const criticOrder = demoOrder(['noodle', 'shrimp', 'egg', 'chili'], 0.6, true, ['noodle', 'shrimp', 'egg', 'chili']);
    state.orders = [
      criticOrder,
      demoOrder(['greens', 'shroom', 'egg'], 0.7),
      demoOrder(['noodle', 'chili'], 0.45),
      demoOrder(['shrimp', 'egg'], 0.85),
    ];
    state.incoming = [
      { items: ['egg', 'chili'], gold: 14 },
      { items: ['noodle', 'greens', 'shroom'], gold: 17 },
      { items: ['shrimp', 'noodle'], gold: 14 },
      { items: ['greens', 'egg', 'chili'], gold: 17 },
      { items: ['shroom', 'shrimp'], gold: 14 },
    ];
    floatText(710, 288, 'CRITIC PLEASED +20%', '#f2c94c', 26);
    return;
  }
  if (name === 'win') {
    Object.assign(state, {
      screen: 'win', night: 5, score: 12480, best: 12480, gold: 342,
      totalServed: 46, perfects: 14, maxCombo: 8,
    });
    state.relics = ['chopsticks', 'apron', 'cat', 'phoenix', 'cleaver'];
    state.critic = { active: true, approval: 100, served: 3, phase: 2 };
  }
}

// ---- boot + loop ----
loadBest();
state.woks = WOK_DEFS.map((d, i) => new Wok({ ...d, index: i }, 0, 0, 88));
state.woks[0].selected = true;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) setupShot(shot);

window.__game = state;
window.__wokhei = { startGame, toss, serveWok, dumpWok, selectWok, useAbilityById, state };

let last = performance.now();
let firstFrame = true;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, state, state.time);
  if (firstFrame) {
    firstFrame = false;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

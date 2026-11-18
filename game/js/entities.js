// WOK HEI — entities: woks, orders, flying ingredients, particles, floating text.
import { INGREDIENTS, ING } from './config.js';

let nextOrderId = 1;

export function dishMatchesOrder(contents, order) {
  if (order.critic) {
    // The critic's signature dish must be tossed in the exact shown sequence.
    if (contents.length !== order.seq.length) return false;
    return contents.every((c, i) => c === order.seq[i]);
  }
  if (contents.length !== order.items.length) return false;
  const a = [...contents].sort().join(',');
  const b = [...order.items].sort().join(',');
  return a === b;
}

export function randomOrderItems(rng, maxItems, minItems) {
  const pool = [...INGREDIENTS];
  const n = minItems + Math.floor(rng() * (maxItems - minItems + 1));
  const items = [];
  for (let i = 0; i < n; i++) {
    const k = Math.floor(rng() * pool.length);
    items.push(pool.splice(k, 1)[0].id);
  }
  return items;
}

export class Wok {
  constructor(def, x, y, r) {
    this.def = def;
    this.x = x;
    this.y = y;
    this.r = r;
    this.contents = [];
    this.state = 'empty'; // empty | cooking | ready | burning | burnt
    this.cook = 0; // 0..1 while cooking
    this.burn = 0; // 0..1 while burning
    this.perfectLeft = 0; // seconds of perfect window remaining
    this.selected = false;
    this.wobble = 0;
    this.smoke = 0;
  }

  get full() {
    return this.contents.length >= 4;
  }

  addIngredient(id) {
    if (this.full || this.state === 'burnt') return false;
    this.contents.push(id);
    if (this.state === 'empty') {
      this.state = 'cooking';
      this.cook = 0;
    }
    this.wobble = 1;
    return true;
  }

  clear() {
    this.contents = [];
    this.state = 'empty';
    this.cook = 0;
    this.burn = 0;
    this.perfectLeft = 0;
  }

  update(dt, cookTime, perfectWindow, burnTime) {
    this.wobble = Math.max(0, this.wobble - dt * 3);
    if (this.state === 'cooking') {
      this.cook += dt / cookTime;
      if (this.cook >= 1) {
        this.state = 'ready';
        this.cook = 1;
        this.perfectLeft = perfectWindow;
      }
    } else if (this.state === 'ready') {
      this.perfectLeft -= dt;
      if (this.perfectLeft <= 0) {
        this.state = 'burning';
        this.burn = 0;
      }
    } else if (this.state === 'burning') {
      this.burn += dt / burnTime;
      this.smoke += dt;
      if (this.burn >= 1) {
        this.state = 'burnt';
        this.burn = 1;
        return 'burnt';
      }
    }
    return null;
  }
}

export class Order {
  constructor(items, patience, reward, gold, critic, seq) {
    this.id = nextOrderId++;
    this.items = items;
    this.critic = !!critic;
    this.seq = seq || null;
    this.patience = patience;
    this.maxPatience = patience;
    this.reward = reward;
    this.gold = gold;
    this.born = Date.now();
  }

  get frac() {
    return Math.max(0, this.patience / this.maxPatience);
  }

  update(dt) {
    this.patience -= dt;
    return this.patience <= 0;
  }
}

export class Flyer {
  // An ingredient arcing from the button bar into a wok.
  constructor(ing, x0, y0, x1, y1) {
    this.ing = ing;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.t = 0;
    this.dur = 0.38;
  }

  update(dt) {
    this.t += dt / this.dur;
    return this.t >= 1;
  }

  pos() {
    const t = Math.min(1, this.t);
    const x = this.x0 + (this.x1 - this.x0) * t;
    const y = this.y0 + (this.y1 - this.y0) * t - Math.sin(t * Math.PI) * 90;
    return { x, y, s: 1 - t * 0.25 };
  }
}

export class Particle {
  constructor(x, y, vx, vy, life, color, size, kind) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.kind = kind || 'dot'; // dot | steam | spark | ring
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.kind === 'steam') {
      this.vy -= 12 * dt;
      this.size += 14 * dt;
    } else {
      this.vy += 60 * dt;
    }
    return this.life <= 0;
  }
}

export class FloatText {
  constructor(x, y, text, color, size) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size || 26;
    this.life = 1.4;
    this.maxLife = 1.4;
  }

  update(dt) {
    this.life -= dt;
    this.y -= 34 * dt;
    return this.life <= 0;
  }
}

export function ingredientColor(id) {
  return ING[id] ? ING[id].color : '#ffffff';
}

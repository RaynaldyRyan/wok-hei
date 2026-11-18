// WOK HEI — all drawing: background, HUD, panels, woks, tickets, screens.
import { W, H, PALETTE, INGREDIENTS, ING, WOK_DEFS, ABILITIES, CRITIC, WIN_LINE, LOSE_LINE } from './config.js';
import { tierOf, relicDef, upgradeDef, upgradeCost, canBuy } from './upgrades.js';

export const hitZones = [];
export function clearHits() {
  hitZones.length = 0;
}
function hit(x, y, w, h, action, arg) {
  hitZones.push({ x, y, w, h, action, arg });
}

export const WOK_X = [306, 506, 706, 906];
export const WOK_R = 88;
export function wokY(boss) {
  return boss ? 438 : 408;
}
export function wokCenter(i, boss) {
  return { x: WOK_X[i], y: wokY(boss) };
}
export const ING_BTN = INGREDIENTS.map((ing, i) => ({ ing, x: 210 + i * 94, y: 712, w: 84, h: 84 }));
export const AB_BTN = ABILITIES.map((ab, i) => ({ ab, x: 800 + i * 96, y: 712, w: 86, h: 84 }));

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, edge) {
  ctx.fillStyle = 'rgba(20, 13, 40, 0.88)';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = edge || PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function text(ctx, s, x, y, size, color, align, weight, font) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${font || 'system-ui, sans-serif'}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg || '#0d0918';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, h / 2);
  ctx.stroke();
}

// ---- ingredient icons (vector, consistent everywhere) ----
export function drawIngredientIcon(ctx, id, x, y, s) {
  const u = s / 32;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'noodle') {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 3 * u;
    ctx.lineCap = 'round';
    for (let r = -1; r <= 1; r++) {
      ctx.beginPath();
      for (let a = 0; a <= 6; a++) {
        const px = -11 * u + a * 4 * u;
        const py = r * 8 * u + Math.sin(a * 1.4) * 2.4 * u;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  } else if (id === 'shrimp') {
    ctx.strokeStyle = '#ff8a7a';
    ctx.fillStyle = '#ff8a7a';
    ctx.lineWidth = 5 * u;
    ctx.beginPath();
    ctx.arc(0, 2 * u, 10 * u, Math.PI * 0.15, Math.PI * 1.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9 * u, -6 * u);
    ctx.lineTo(14 * u, -11 * u);
    ctx.lineTo(13 * u, -4 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#171029';
    ctx.beginPath();
    ctx.arc(-4 * u, -2 * u, 1.8 * u, 0, 7);
    ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fff6da';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13 * u, 11 * u, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#ffb02e';
    ctx.beginPath();
    ctx.arc(1 * u, 1 * u, 6 * u, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#ffd977';
    ctx.beginPath();
    ctx.arc(-1 * u, -1 * u, 2.4 * u, 0, 7);
    ctx.fill();
  } else if (id === 'chili') {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.moveTo(-11 * u, -8 * u);
    ctx.quadraticCurveTo(2 * u, -14 * u, 12 * u, 6 * u);
    ctx.quadraticCurveTo(2 * u, 12 * u, -11 * u, 4 * u);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#57cc6a';
    ctx.lineWidth = 3.4 * u;
    ctx.beginPath();
    ctx.moveTo(-11 * u, -8 * u);
    ctx.quadraticCurveTo(-15 * u, -14 * u, -9 * u, -15 * u);
    ctx.stroke();
  } else if (id === 'greens') {
    ctx.fillStyle = '#57cc6a';
    for (const [dx, dy, rot] of [[-7, 3, -0.7], [0, -4, 0], [7, 3, 0.7]]) {
      ctx.save();
      ctx.translate(dx * u, dy * u);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5 * u, 10 * u, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2f9e44';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(0, 12 * u);
    ctx.lineTo(0, 4 * u);
    ctx.stroke();
  } else if (id === 'shroom') {
    ctx.fillStyle = '#b08968';
    ctx.beginPath();
    ctx.arc(0, -2 * u, 12 * u, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a6a4d';
    ctx.beginPath();
    ctx.arc(-5 * u, -6 * u, 2.4 * u, 0, 7);
    ctx.arc(4 * u, -8 * u, 2 * u, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#f5ead2';
    ctx.fillRect(-4 * u, -2 * u, 8 * u, 11 * u);
  }
  ctx.restore();
}

// ---- critic portrait (vector) ----
function drawCriticPortrait(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // hair bun + head
  ctx.fillStyle = '#3a2b22';
  ctx.beginPath();
  ctx.arc(0, -16, 9, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#3a2b22';
  ctx.beginPath();
  ctx.arc(0, -4, 16, Math.PI, 0);
  ctx.fill();
  // stern brows + eyes
  ctx.strokeStyle = '#2a1d16';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-11, -4);
  ctx.lineTo(-3, -1);
  ctx.moveTo(11, -4);
  ctx.lineTo(3, -1);
  ctx.stroke();
  ctx.fillStyle = '#171029';
  ctx.beginPath();
  ctx.arc(-6, 2, 2, 0, 7);
  ctx.arc(6, 2, 2, 0, 7);
  ctx.fill();
  // mouth: unimpressed line
  ctx.strokeStyle = '#a34d3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, 9);
  ctx.lineTo(5, 9);
  ctx.stroke();
  // golden ladle
  ctx.strokeStyle = '#f2c94c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, -14);
  ctx.lineTo(28, 6);
  ctx.stroke();
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.ellipse(28, 10, 5, 7, 0.3, 0, 7);
  ctx.fill();
  ctx.restore();
}

// ---- background: night market, packed, no dead space ----
function drawBackground(ctx, state, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#171029');
  g.addColorStop(0.55, '#1f1538');
  g.addColorStop(1, '#120b22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // awning stripes
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? '#7a1f2b' : '#a8323e';
    ctx.beginPath();
    ctx.moveTo(i * 80, 0);
    ctx.lineTo(i * 80 + 80, 0);
    ctx.lineTo(i * 80 + 66, 26);
    ctx.lineTo(i * 80 + 14, 26);
    ctx.closePath();
    ctx.fill();
  }
  // string lights
  ctx.strokeStyle = 'rgba(242,201,76,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.quadraticCurveTo(W / 2, 96, W, 60);
  ctx.stroke();
  for (let i = 0; i < 18; i++) {
    const x = 40 + i * 68;
    const y = 60 + Math.sin((i / 17) * Math.PI) * 30;
    ctx.fillStyle = i % 3 === 0 ? '#f2c94c' : i % 3 === 1 ? '#ff8a7a' : '#57cc6a';
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i);
    ctx.beginPath();
    ctx.arc(x, y + 6, 3.4, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // stall silhouettes + crates + floor tiles
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (const [x, w] of [[220, 120], [520, 90], [830, 130]]) {
    ctx.fillRect(x, 640, w, 60);
    ctx.fillRect(x - 8, 632, w + 16, 10);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 12; i++) ctx.fillRect(200 + i * 72, 700, 68, 4);
  // market shelf: crates of fresh ingredients fill the gap above the buttons
  // (play screens only — the title screen has its own mini woks down here)
  if (state.screen === 'play' || state.screen === 'pause' || state.screen === 'shop') {
    ctx.fillStyle = '#241a42';
    ctx.fillRect(204, 628, 832, 8);
    ctx.fillStyle = '#4a3572';
    ctx.fillRect(204, 628, 832, 2);
    const crateIcons = ['noodle', 'shrimp', 'greens', 'shroom', 'egg', 'chili'];
    crateIcons.forEach((id, i) => {
      const cx = 280 + i * 136;
      ctx.fillStyle = '#2c2148';
      rr(ctx, cx - 46, 640, 92, 52, 6);
      ctx.fill();
      ctx.strokeStyle = '#4a3572';
      ctx.lineWidth = 2;
      rr(ctx, cx - 46, 640, 92, 52, 6);
      ctx.stroke();
      drawIngredientIcon(ctx, id, cx - 16, 666, 26);
      drawIngredientIcon(ctx, crateIcons[(i + 3) % 6], cx + 16, 666, 26);
    });
  }
  // hanging lanterns
  for (const [x, c] of [[60, '#e5484d'], [1180, '#f2c94c']]) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(x, 26);
    ctx.lineTo(x, 52);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(x, 66, 12, 16, 0, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawHUD(ctx, state) {
  panel(ctx, 6, 30, 1228, 52, '#4a3572');
  // night chip
  ctx.fillStyle = PALETTE.gold;
  rr(ctx, 16, 40, 132, 32, 8);
  ctx.fill();
  text(ctx, `NIGHT ${state.night}/5`, 82, 57, 17, PALETTE.ink, 'center', 800);
  // quota progress
  bar(ctx, 158, 46, 130, 20, state.served / Math.max(1, state.quota), '#57cc6a');
  text(ctx, `${state.served}/${state.quota} served`, 223, 57, 13, '#f5ead2', 'center', 700);
  // score
  text(ctx, 'SCORE', 316, 46, 11, '#b9a8e0', 'left', 800);
  text(ctx, `${state.score}`, 316, 66, 22, '#ffffff', 'left', 800);
  text(ctx, `BEST ${state.best}`, 470, 57, 14, '#b9a8e0', 'left', 700);
  // gold
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(600, 57, 10, 0, 7);
  ctx.fill();
  text(ctx, 'G', 600, 58, 12, PALETTE.ink, 'center', 800);
  text(ctx, `${state.gold}`, 618, 57, 20, PALETTE.gold, 'left', 800);
  // combo
  const comboCol = state.combo >= 5 ? '#ff9f2e' : state.combo >= 3 ? PALETTE.gold : '#b9a8e0';
  text(ctx, `COMBO x${state.combo}`, 730, 57, 22, comboCol, 'left', 800);
  // reputation
  for (let i = 0; i < state.maxRep; i++) {
    const x = 900 + i * 30;
    const on = i < state.reputation;
    ctx.fillStyle = on ? '#e5484d' : 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.moveTo(x, 62);
    ctx.bezierCurveTo(x - 9, 52, x - 14, 60, x, 70);
    ctx.bezierCurveTo(x + 14, 60, x + 9, 52, x, 62);
    ctx.fill();
  }
  text(ctx, 'REP', 900, 40, 10, '#b9a8e0', 'left', 800);
  // rush indicator
  if (state.rush.active) {
    ctx.fillStyle = '#e5484d';
    rr(ctx, 996, 40, 128, 32, 8);
    ctx.fill();
    text(ctx, `RUSH! ${Math.ceil(state.rush.t)}s`, 1060, 57, 15, '#fff', 'center', 800);
  } else {
    text(ctx, `rush in ${Math.ceil(state.rush.next)}s`, 1060, 57, 13, '#b9a8e0', 'center', 700);
  }
  hit(1172, 38, 34, 36, 'pause');
  text(ctx, 'II', 1189, 57, 16, '#f5ead2', 'center', 800);
  hit(1132, 38, 34, 36, 'mute');
  text(ctx, state.muted ? 'X' : 'S', 1149, 57, 15, '#f5ead2', 'center', 800);
}

function drawWinLose(ctx) {
  ctx.fillStyle = '#1d7a3a';
  rr(ctx, 6, 86, 560, 24, 6);
  ctx.fill();
  text(ctx, WIN_LINE, 16, 99, 13, '#eafff0', 'left', 700);
  ctx.fillStyle = '#8a1f2b';
  rr(ctx, 574, 86, 660, 24, 6);
  ctx.fill();
  text(ctx, LOSE_LINE, 584, 99, 13, '#ffe9ea', 'left', 700);
}

function drawBossBar(ctx, state) {
  const c = state.critic;
  if (!c || !c.active) return;
  panel(ctx, 204, 114, 832, 40, '#f2c94c');
  drawCriticPortrait(ctx, 230, 134, 0.8);
  text(ctx, CRITIC.name, 268, 128, 15, PALETTE.gold, 'left', 800);
  text(ctx, CRITIC.phases[c.phase].label, 268, 145, 11, '#ff9f2e', 'left', 800);
  bar(ctx, 560, 124, 300, 20, c.approval / 100, c.approval < 30 ? '#e5484d' : '#f2c94c');
  text(ctx, `APPROVAL ${Math.round(c.approval)}%`, 710, 135, 13, '#fff', 'center', 800);
  text(ctx, 'serve her well to fill it', 880, 135, 12, '#b9a8e0', 'left', 700);
}

function drawTicket(ctx, order, x, y, w, h) {
  const edge = order.critic ? '#f2c94c' : order.frac < 0.3 ? '#e5484d' : PALETTE.panelEdge;
  panel(ctx, x, y, w, h, edge);
  if (order.critic) {
    ctx.fillStyle = '#f2c94c';
    rr(ctx, x, y, w, 20, 8);
    ctx.fill();
    text(ctx, '★ SIGNATURE · in this order', x + 8, y + 11, 11, PALETTE.ink, 'left', 800);
  }
  text(ctx, `#${order.id}`, x + 8, y + (order.critic ? 34 : 16), 12, '#b9a8e0', 'left', 800);
  text(ctx, `+${order.gold}g`, x + w - 8, y + (order.critic ? 34 : 16), 12, PALETTE.gold, 'right', 800);
  const items = order.critic ? order.seq : order.items;
  const iw = Math.min(30, (w - 16) / items.length - 4);
  items.forEach((id, i) => {
    const cx = x + 14 + iw / 2 + i * (iw + 4);
    const cy = y + (order.critic ? 58 : 46);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(cx, cy, iw / 2 + 2, 0, 7);
    ctx.fill();
    drawIngredientIcon(ctx, id, cx, cy, iw * 0.9);
    if (order.critic) {
      // Sequence number as a small gold badge on the icon's corner.
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(cx - iw / 2 + 2, cy - iw / 2 + 2, 8, 0, 7);
      ctx.fill();
      text(ctx, `${i + 1}`, cx - iw / 2 + 2, cy - iw / 2 + 3, 10, PALETTE.ink, 'center', 800);
    }
  });
  const frac = order.frac;
  bar(ctx, x + 8, y + h - 12, w - 16, 7, frac, frac < 0.3 ? '#e5484d' : frac < 0.6 ? '#ff9f2e' : '#57cc6a');
}

function drawOrderRail(ctx, state) {
  const top = state.critic && state.critic.active ? 162 : 116;
  state.orders.slice(0, 4).forEach((o, i) => {
    drawTicket(ctx, o, 204 + i * 208, top, 200, 84);
  });
  if (!state.orders.length) {
    text(ctx, 'No orders yet — the night is young…', 620, top + 42, 15, '#b9a8e0', 'center', 700);
  }
}

function drawWok(ctx, state, wok, t) {
  const boss = state.critic && state.critic.active;
  const { x, y } = wokCenter(wok.def.index, boss);
  wok.x = x;
  wok.y = y;
  const r = WOK_R;
  const wob = wok.wobble * Math.sin(t * 30) * 3;
  // heat glow
  const glow = ctx.createRadialGradient(x, y + r, 10, x, y + r, r * 1.5);
  glow.addColorStop(0, wok.state === 'burnt' ? 'rgba(60,60,60,0.5)' : 'rgba(255,120,40,0.4)');
  glow.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.7, r * 1.5, 0, 7);
  ctx.fill();
  // flames
  if (wok.state !== 'empty') {
    for (let i = 0; i < 5; i++) {
      const fx = x - r * 0.7 + i * r * 0.35;
      const fh = 14 + 8 * Math.sin(t * 9 + i * 1.7);
      ctx.fillStyle = i % 2 ? '#ff9f2e' : '#ffc93c';
      ctx.beginPath();
      ctx.moveTo(fx - 7, y + r + 6);
      ctx.quadraticCurveTo(fx, y + r - fh, fx + 7, y + r + 6);
      ctx.closePath();
      ctx.fill();
    }
  }
  // wok body
  ctx.fillStyle = '#241a42';
  ctx.beginPath();
  ctx.arc(x, y + wob, r + 6, 0, 7);
  ctx.fill();
  ctx.strokeStyle = wok.selected ? '#ffffff' : wok.def.color;
  ctx.lineWidth = wok.selected ? 5 : 3;
  ctx.stroke();
  ctx.fillStyle = '#0d0918';
  ctx.beginPath();
  ctx.arc(x, y + wob, r - 6, 0, 7);
  ctx.fill();
  // inner sheen
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x, y + wob, r - 16, Math.PI * 1.1, Math.PI * 1.7);
  ctx.stroke();
  // contents
  const spots = [[-30, -14], [28, -18], [-26, 26], [30, 24]];
  wok.contents.forEach((id, i) => {
    const [dx, dy] = spots[i % 4];
    const bob = Math.sin(t * 4 + i * 2) * 2;
    drawIngredientIcon(ctx, id, x + dx, y + dy + bob + wob, 34);
  });
  if (wok.state === 'empty') {
    text(ctx, 'empty', x, y + wob, 15, 'rgba(255,255,255,0.35)', 'center', 700);
  }
  // name + key (the selected wok is marked by its white ring below)
  text(ctx, wok.def.name, x, y - r - 26, 17, wok.def.color, 'center', 800);
  text(ctx, `press ${wok.def.index + 1}`, x, y - r - 8, 11, '#b9a8e0', 'center', 700);
  // heat / cook bar
  const bx = x - 62;
  const by = y + r + 16;
  if (wok.state === 'cooking') {
    bar(ctx, bx, by, 124, 12, wok.cook, wok.def.color);
    text(ctx, 'COOKING', x, by + 24, 11, '#b9a8e0', 'center', 800);
  } else if (wok.state === 'ready') {
    const pulse = 0.7 + 0.3 * Math.sin(t * 8);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#57cc6a';
    rr(ctx, bx, by, 124, 22, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    text(ctx, 'READY!', x, by + 12, 14, '#fff', 'center', 800);
    text(ctx, `perfect ${Math.max(0, wok.perfectLeft).toFixed(1)}s`, x, by + 34, 11, PALETTE.gold, 'center', 700);
  } else if (wok.state === 'burning') {
    bar(ctx, bx, by, 124, 12, wok.burn, '#e5484d');
    text(ctx, 'BURNING — serve or dump!', x, by + 24, 11, '#ff8a7a', 'center', 800);
  } else if (wok.state === 'burnt') {
    ctx.fillStyle = '#3a3a3a';
    rr(ctx, bx, by, 124, 22, 8);
    ctx.fill();
    text(ctx, 'BURNT', x, by + 12, 13, '#ccc', 'center', 800);
  }
  // serve / dump buttons
  if (wok.contents.length) {
    const canServe = wok.state === 'ready' || wok.state === 'burning';
    ctx.fillStyle = canServe ? '#1d7a3a' : 'rgba(255,255,255,0.12)';
    rr(ctx, x - 66, y + r + 52, 62, 28, 7);
    ctx.fill();
    text(ctx, 'SERVE', x - 35, y + r + 67, 13, '#fff', 'center', 800);
    if (canServe) hit(x - 66, y + r + 52, 62, 28, 'serve', wok.def.index);
    ctx.fillStyle = '#8a1f2b';
    rr(ctx, x + 6, y + r + 52, 60, 28, 7);
    ctx.fill();
    text(ctx, 'DUMP', x + 36, y + r + 67, 13, '#fff', 'center', 800);
    hit(x + 6, y + r + 52, 60, 28, 'dump', wok.def.index);
  }
  hit(x - r, y - r, r * 2, r * 2, 'selectWok', wok.def.index);
}

function drawLeftPanel(ctx, state) {
  const top = state.critic && state.critic.active ? 162 : 116;
  panel(ctx, 6, top, 190, 584 - (top - 116), '#4a3572');
  text(ctx, 'INCOMING', 16, top + 16, 13, PALETTE.gold, 'left', 800);
  text(ctx, 'what is coming', 16, top + 32, 10, '#b9a8e0', 'left', 700);
  state.incoming.slice(0, 5).forEach((spec, i) => {
    const y = top + 48 + i * 52;
    const urgency = i === 0 ? '#e5484d' : i === 1 ? '#ff9f2e' : '#57cc6a';
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    rr(ctx, 14, y, 174, 44, 7);
    ctx.fill();
    ctx.fillStyle = urgency;
    ctx.beginPath();
    ctx.arc(26, y + 12, 5, 0, 7);
    ctx.fill();
    text(ctx, i === 0 ? 'NEXT' : `+${i + 1}`, 36, y + 13, 11, urgency, 'left', 800);
    text(ctx, `+${spec.gold}g`, 180, y + 13, 11, PALETTE.gold, 'right', 700);
    spec.items.forEach((id, k) => {
      drawIngredientIcon(ctx, id, 30 + k * 30, y + 31, 22);
    });
    text(ctx, `${spec.items.length} items`, 150, y + 32, 10, '#b9a8e0', 'right', 700);
  });
  const gy = top + 320;
  text(ctx, 'GOALS', 16, gy, 13, PALETTE.gold, 'left', 800);
  const goals = [
    { label: `Serve ${state.quota} orders`, done: state.served, total: state.quota },
    { label: 'Perfect serves x5', done: Math.min(5, state.perfects), total: 5 },
    { label: 'No strikes', done: state.reputation, total: state.maxRep },
  ];
  goals.forEach((g, i) => {
    const y = gy + 22 + i * 26;
    const ok = g.done >= g.total;
    ctx.strokeStyle = ok ? '#57cc6a' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, y - 8, 14, 14);
    if (ok) text(ctx, '✓', 23, y, 13, '#57cc6a', 'center', 800);
    text(ctx, g.label, 38, y, 12, ok ? '#57cc6a' : '#f5ead2', 'left', 700);
    text(ctx, `${g.done}/${g.total}`, 188, y, 12, '#b9a8e0', 'right', 700);
  });
}

function drawRightPanel(ctx, state) {
  const top = state.critic && state.critic.active ? 162 : 116;
  panel(ctx, 1044, top, 190, 584 - (top - 116), '#4a3572');
  text(ctx, 'RELICS', 1054, top + 16, 13, PALETTE.gold, 'left', 800);
  if (!state.relics.length) {
    text(ctx, 'None yet.', 1054, top + 40, 12, '#b9a8e0', 'left', 700);
    text(ctx, 'Clear a night to', 1054, top + 58, 11, '#b9a8e0', 'left', 700);
    text(ctx, 'find one.', 1054, top + 74, 11, '#b9a8e0', 'left', 700);
  } else {
    state.relics.forEach((id, i) => {
      const r = relicDef(id);
      const y = top + 40 + i * 52;
      ctx.fillStyle = 'rgba(242,201,76,0.12)';
      rr(ctx, 1052, y, 174, 44, 7);
      ctx.fill();
      text(ctx, '◆ ' + r.name, 1060, y + 12, 12, PALETTE.gold, 'left', 800);
      text(ctx, r.desc, 1060, y + 30, 10, '#d8cde8', 'left', 700);
    });
  }
  const ty = top + 320;
  text(ctx, 'TONIGHT', 1054, ty, 13, PALETTE.gold, 'left', 800);
  text(ctx, `Night ${state.night} of 5`, 1054, ty + 22, 12, '#f5ead2', 'left', 700);
  text(ctx, `Orders ${state.served}/${state.quota}`, 1054, ty + 42, 12, '#f5ead2', 'left', 700);
  text(ctx, `Perfect ${state.perfects}`, 1054, ty + 62, 12, '#f5ead2', 'left', 700);
  text(ctx, `Best combo x${state.maxCombo}`, 1054, ty + 82, 12, '#f5ead2', 'left', 700);
  if (state.night < 5) {
    text(ctx, 'The critic arrives', 1054, ty + 112, 11, '#ff9f2e', 'left', 700);
    text(ctx, 'on night 5.', 1054, ty + 128, 11, '#ff9f2e', 'left', 700);
  } else {
    text(ctx, 'Madame is here.', 1054, ty + 112, 11, '#ff9f2e', 'left', 700);
    text(ctx, 'Mind her patience!', 1054, ty + 128, 11, '#ff9f2e', 'left', 700);
  }
}

function drawBottomBar(ctx, state) {
  panel(ctx, 6, 704, 1228, 124, '#4a3572');
  text(ctx, 'TOSS INTO SELECTED WOK', 210, 712, 11, '#b9a8e0', 'left', 800);
  ING_BTN.forEach((b, i) => {
    const sel = state.selectedWok >= 0;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    rr(ctx, b.x, b.y + 8, b.w, b.h - 8, 10);
    ctx.fill();
    ctx.strokeStyle = b.ing.color;
    ctx.lineWidth = 2;
    rr(ctx, b.x, b.y + 8, b.w, b.h - 8, 10);
    ctx.stroke();
    drawIngredientIcon(ctx, b.ing.id, b.x + b.w / 2, b.y + 42, 36);
    text(ctx, b.ing.name, b.x + b.w / 2, b.y + 70, 12, '#f5ead2', 'center', 700);
    text(ctx, b.ing.key, b.x + b.w - 8, b.y + 20, 12, b.ing.color, 'right', 800);
    hit(b.x, b.y + 8, b.w, b.h - 8, 'toss', i);
  });
  text(ctx, 'ABILITIES', 800, 712, 11, '#b9a8e0', 'left', 800);
  AB_BTN.forEach((b) => {
    const n = state.abilities[b.ab.id] || 0;
    ctx.fillStyle = n > 0 ? 'rgba(53,196,181,0.16)' : 'rgba(255,255,255,0.05)';
    rr(ctx, b.x, b.y + 8, b.w, b.h - 8, 10);
    ctx.fill();
    ctx.strokeStyle = n > 0 ? PALETTE.teal : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    rr(ctx, b.x, b.y + 8, b.w, b.h - 8, 10);
    ctx.stroke();
    text(ctx, b.ab.name, b.x + b.w / 2, b.y + 32, 12, n > 0 ? '#fff' : '#888', 'center', 800);
    text(ctx, b.ab.desc, b.x + b.w / 2, b.y + 52, 9, '#b9a8e0', 'center', 700);
    text(ctx, `x${n}  [${b.ab.key}]`, b.x + b.w / 2, b.y + 70, 12, n > 0 ? PALETTE.teal : '#888', 'center', 800);
    if (n > 0) hit(b.x, b.y + 8, b.w, b.h - 8, 'ability', b.ab.id);
  });
  // combo flame meter, bottom right
  const cx = 1150;
  text(ctx, 'COMBO', cx, 724, 11, '#b9a8e0', 'center', 800);
  text(ctx, `x${state.combo}`, cx, 756, 30, state.combo >= 5 ? '#ff9f2e' : '#f5ead2', 'center', 800);
  text(ctx, `best x${state.maxCombo}`, cx, 782, 11, '#b9a8e0', 'center', 700);
  text(
    ctx,
    '1-4 select wok · Q W E R T Y toss · SPACE serve · X dump · Z/C/V abilities · P pause · M sound · R restart',
    620, 842, 13, '#b9a8e0', 'center', 700
  );
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = p.kind === 'steam' ? a * 0.35 : a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFlyers(ctx, state) {
  for (const f of state.flyers) {
    const { x, y, s } = f.pos();
    ctx.save();
    ctx.globalAlpha = 0.95;
    drawIngredientIcon(ctx, f.ing, x, y, 34 * s);
    ctx.restore();
  }
}

function drawFloaters(ctx, state) {
  for (const f of state.events) {
    const a = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = Math.min(1, a * 2);
    ctx.font = `800 ${f.size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(10,6,20,0.9)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, state) {
  if (!state.banner || state.banner.t <= 0) return;
  const a = Math.min(1, state.banner.t);
  ctx.globalAlpha = a;
  ctx.font = '800 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(10,6,20,0.9)';
  ctx.strokeText(state.banner.text, 620, 300);
  ctx.fillStyle = state.banner.color || PALETTE.gold;
  ctx.fillText(state.banner.text, 620, 300);
  if (state.banner.sub) {
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.lineWidth = 5;
    ctx.strokeText(state.banner.sub, 620, 344);
    ctx.fillStyle = '#f5ead2';
    ctx.fillText(state.banner.sub, 620, 344);
  }
  ctx.globalAlpha = 1;
}

function drawPlay(ctx, state, t) {
  drawBackground(ctx, state, t);
  drawHUD(ctx, state);
  drawWinLose(ctx);
  drawBossBar(ctx, state);
  drawOrderRail(ctx, state);
  drawLeftPanel(ctx, state);
  drawRightPanel(ctx, state);
  for (const wok of state.woks) drawWok(ctx, state, wok, t);
  drawParticles(ctx, state);
  drawFlyers(ctx, state);
  drawBottomBar(ctx, state);
  drawFloaters(ctx, state);
  drawBanner(ctx, state);
  if (state.screen === 'pause') {
    ctx.fillStyle = 'rgba(10,6,20,0.7)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED', 620, 400, 54, '#fff', 'center', 800, 'Georgia, serif');
    text(ctx, 'P or click to resume · R to restart', 620, 450, 18, '#b9a8e0', 'center', 700);
    hit(0, 0, W, H, 'resume');
  }
}

function drawTitle(ctx, state, t) {
  drawBackground(ctx, state, t);
  // mini woks with flames
  WOK_DEFS.forEach((def, i) => {
    const x = 320 + i * 190;
    const y = 640;
    for (let k = 0; k < 4; k++) {
      const fx = x - 30 + k * 20;
      ctx.fillStyle = k % 2 ? '#ff9f2e' : '#ffc93c';
      ctx.beginPath();
      ctx.moveTo(fx - 8, y + 46);
      ctx.quadraticCurveTo(fx, y + 46 - (16 + 6 * Math.sin(t * 8 + k + i)), fx + 8, y + 46);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#241a42';
    ctx.beginPath();
    ctx.arc(x, y, 52, 0, 7);
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#0d0918';
    ctx.beginPath();
    ctx.arc(x, y, 44, 0, 7);
    ctx.fill();
    drawIngredientIcon(ctx, INGREDIENTS[(i * 2) % 6].id, x - 12, y - 6, 26);
    drawIngredientIcon(ctx, INGREDIENTS[(i * 2 + 1) % 6].id, x + 12, y + 8, 26);
    text(ctx, def.name, x, y + 72, 14, def.color, 'center', 800);
  });
  text(ctx, 'NIGHT MARKET · STALL NO. 7', 620, 150, 16, '#ff9f2e', 'center', 800);
  ctx.font = '800 110px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#7a1f2b';
  ctx.strokeText('WOK HEI', 620, 250);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText('WOK HEI', 620, 250);
  text(ctx, 'Four woks. One night market. Zero mercy.', 620, 330, 22, '#f5ead2', 'center', 700, 'Georgia, serif');
  text(ctx, 'Toss the right ingredients, mind the heat, serve before patience runs out.', 620, 366, 15, '#b9a8e0', 'center', 700);
  text(ctx, 'Five nights stand between you and the Golden Ladle — Madame arrives on night 5.', 620, 390, 15, '#b9a8e0', 'center', 700);
  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.gold;
  rr(ctx, 470, 440, 300, 54, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  text(ctx, '— CLICK TO BEGIN —', 620, 468, 20, PALETTE.ink, 'center', 800);
  text(ctx, `BEST SCORE  ${state.best}`, 620, 530, 16, '#b9a8e0', 'center', 700);
  text(ctx, '1-4 select wok · Q W E R T Y toss · SPACE serve · X dump · Z/C/V abilities · P pause · M sound', 620, 570, 13, '#b9a8e0', 'center', 700);
  hit(0, 0, W, H, 'start');
}

function drawShop(ctx, state) {
  drawPlay(ctx, state, 0);
  ctx.fillStyle = 'rgba(10,6,20,0.78)';
  ctx.fillRect(0, 0, W, H);
  panel(ctx, 170, 90, 900, 640, PALETTE.gold);
  text(ctx, `NIGHT ${state.night} CLEARED!`, 620, 130, 34, PALETTE.gold, 'center', 800, 'Georgia, serif');
  if (state.shopRelic) {
    ctx.fillStyle = 'rgba(242,201,76,0.14)';
    rr(ctx, 220, 158, 800, 44, 8);
    ctx.fill();
    text(ctx, `◆ FOUND RELIC: ${state.shopRelic.name} — ${state.shopRelic.desc}`, 620, 181, 15, PALETTE.gold, 'center', 800);
  }
  text(ctx, `Gold: ${state.gold}g`, 620, 226, 20, PALETTE.gold, 'center', 800);
  text(ctx, 'Spend it before the next night — the market only gets busier.', 620, 252, 14, '#b9a8e0', 'center', 700);
  state.shopItems.forEach((def, i) => {
    const y = 280 + i * 72;
    const tier = tierOf(state, def.id);
    const maxed = tier >= def.max;
    const cost = maxed ? 0 : upgradeCost(def, tier);
    const afford = canBuy(state, def);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, 220, y, 800, 60, 8);
    ctx.fill();
    text(ctx, def.name, 240, y + 20, 17, '#fff', 'left', 800);
    text(ctx, def.desc, 240, y + 42, 12, '#b9a8e0', 'left', 700);
    for (let p = 0; p < def.max; p++) {
      ctx.fillStyle = p < tier ? PALETTE.gold : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(660 + p * 22, y + 30, 7, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = maxed ? '#57cc6a' : afford ? PALETTE.gold : 'rgba(255,255,255,0.2)';
    rr(ctx, 880, y + 12, 120, 36, 8);
    ctx.fill();
    text(ctx, maxed ? 'MAXED' : `${cost}g BUY`, 940, y + 31, 14, maxed ? '#fff' : PALETTE.ink, 'center', 800);
    if (!maxed && afford) hit(880, y + 12, 120, 36, 'buy', def.id);
  });
  ctx.fillStyle = '#1d7a3a';
  rr(ctx, 470, 660, 300, 48, 10);
  ctx.fill();
  text(ctx, state.night >= 5 ? 'FACE MADAME →' : 'NEXT NIGHT →', 620, 685, 20, '#fff', 'center', 800);
  hit(470, 660, 300, 48, 'nextNight');
}

function drawStats(ctx, state, y0) {
  const rows = [
    ['Score', `${state.score}`],
    ['Best score', `${state.best}`],
    ['Orders served', `${state.totalServed}`],
    ['Perfect serves', `${state.perfects}`],
    ['Best combo', `x${state.maxCombo}`],
    ['Relics found', `${state.relics.length}`],
    ['Nights cleared', `${Math.min(5, state.night - (state.screen === 'win' ? 0 : 1))}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = y0 + i * 30;
    text(ctx, k, 470, y, 16, '#b9a8e0', 'left', 700);
    text(ctx, v, 770, y, 16, '#fff', 'right', 800);
  });
}

function drawWin(ctx, state, t) {
  drawBackground(ctx, state, t);
  panel(ctx, 220, 90, 800, 640, PALETTE.gold);
  text(ctx, 'FIVE STARS!', 620, 150, 56, PALETTE.gold, 'center', 800, 'Georgia, serif');
  for (let i = 0; i < 5; i++) {
    const x = 480 + i * 70;
    const s = 1 + 0.12 * Math.sin(t * 5 + i);
    ctx.save();
    ctx.translate(x, 210);
    ctx.scale(s, s);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 10 : 24;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  drawCriticPortrait(ctx, 620, 268, 1.6);
  text(ctx, 'Madame Golden Ladle awards you the Golden Ladle.', 620, 316, 17, '#f5ead2', 'center', 700, 'Georgia, serif');
  text(ctx, 'Stall No. 7 is the best table in the night market.', 620, 342, 14, '#b9a8e0', 'center', 700);
  drawStats(ctx, state, 390);
  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  ctx.globalAlpha = pulse;
  text(ctx, '— CLICK OR PRESS R TO PLAY AGAIN —', 620, 640, 20, PALETTE.gold, 'center', 800);
  ctx.globalAlpha = 1;
  hit(0, 0, W, H, 'restart');
}

function drawLose(ctx, state) {
  drawBackground(ctx, state, 0);
  panel(ctx, 220, 110, 800, 600, '#e5484d');
  text(ctx, 'THE STALL GOES DARK', 620, 170, 44, '#ff8a7a', 'center', 800, 'Georgia, serif');
  text(ctx, state.loseReason || 'The night market moves on.', 620, 220, 17, '#f5ead2', 'center', 700);
  drawStats(ctx, state, 280);
  text(ctx, '— CLICK OR PRESS R TO TRY AGAIN —', 620, 620, 20, PALETTE.gold, 'center', 800);
  hit(0, 0, W, H, 'restart');
}

export function render(ctx, state, t) {
  clearHits();
  ctx.save();
  if (state.shake > 0) {
    const m = state.shake * 6;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  if (state.screen === 'title') drawTitle(ctx, state, t);
  else if (state.screen === 'shop') drawShop(ctx, state);
  else if (state.screen === 'win') drawWin(ctx, state, t);
  else if (state.screen === 'lose') drawLose(ctx, state);
  else drawPlay(ctx, state, t);
  ctx.restore();
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,240,200,${state.flash * 0.25})`;
    ctx.fillRect(0, 0, W, H);
  }
}

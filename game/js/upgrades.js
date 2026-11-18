// WOK HEI — shop upgrades, relics and usable abilities.
import { UPGRADES, RELICS } from './config.js';

export function tierOf(state, id) {
  return state.upgrades[id] || 0;
}

export function hasRelic(state, id) {
  return state.relics.includes(id);
}

export function cookTimeOf(state) {
  // Base 4s per dish; Dragon Wok tiers speed it up.
  return 4.0 * Math.pow(0.85, tierOf(state, 'wok'));
}

export function perfectWindowOf(state) {
  // Base 3s perfect window; Fire Bellows extends it.
  return 3.0 + tierOf(state, 'bellows') * 1.0;
}

export function burnTimeOf() {
  return 4.5;
}

export function goldBonusOf(state) {
  return 1 + tierOf(state, 'scoop') * 0.2;
}

export function scoreBonusOf(state) {
  return hasRelic(state, 'cat') ? 1.1 : 1.0;
}

export function patienceBonusOf(state) {
  return hasRelic(state, 'apron') ? 5 : 0;
}

export function comboFloorOf(state) {
  return hasRelic(state, 'phoenix') ? 2 : 1;
}

export function upgradeCost(def, tier) {
  return def.cost[Math.min(tier, def.cost.length - 1)];
}

export function canBuy(state, def) {
  const tier = tierOf(state, def.id);
  if (tier >= def.max) return false;
  return state.gold >= upgradeCost(def, tier);
}

export function buyUpgrade(state, def) {
  const tier = tierOf(state, def.id);
  if (tier >= def.max) return false;
  const cost = upgradeCost(def, tier);
  if (state.gold < cost) return false;
  state.gold -= cost;
  state.upgrades[def.id] = tier + 1;
  if (def.id === 'stove') state.reputation = Math.min(5, state.reputation + 1);
  return true;
}

export function unownedRelics(state) {
  return RELICS.filter((r) => !state.relics.includes(r.id));
}

export function drawRelic(state, rng) {
  const pool = unownedRelics(state);
  if (!pool.length) return null;
  const relic = pool[Math.floor(rng() * pool.length)];
  state.relics.push(relic.id);
  return relic;
}

export function abilityUses(state, id) {
  return state.abilities[id] || 0;
}

export function useAbility(state, id) {
  if ((state.abilities[id] || 0) <= 0) return false;
  state.abilities[id]--;
  return true;
}

export function refillAbilities(state) {
  for (const id of ['flash', 'hands', 'ice']) {
    state.abilities[id] = Math.min(3, (state.abilities[id] || 0) + 1);
  }
}

export function upgradeDef(id) {
  return UPGRADES.find((u) => u.id === id);
}

export function relicDef(id) {
  return RELICS.find((r) => r.id === id);
}

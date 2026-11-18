// WOK HEI — shared constants: palette, ingredients, nights, upgrades, relics, critic.
export const W = 1240;
export const H = 860;

export const PALETTE = {
  bg: '#171029',
  bg2: '#1f1538',
  panel: '#241a42',
  panelEdge: '#4a3572',
  gold: '#f2c94c',
  cream: '#f5ead2',
  ink: '#14102a',
  red: '#e5484d',
  green: '#57cc6a',
  teal: '#35c4b5',
  pink: '#ff8a7a',
  amber: '#ff9f2e',
};

export const INGREDIENTS = [
  { id: 'noodle', name: 'Noodle', color: '#f2c94c', key: 'Q' },
  { id: 'shrimp', name: 'Shrimp', color: '#ff8a7a', key: 'W' },
  { id: 'egg', name: 'Egg', color: '#fff3b0', key: 'E' },
  { id: 'chili', name: 'Chili', color: '#e5484d', key: 'R' },
  { id: 'greens', name: 'Greens', color: '#57cc6a', key: 'T' },
  { id: 'shroom', name: 'Mushroom', color: '#b08968', key: 'Y' },
];
export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

export const WOK_DEFS = [
  { name: 'JADE', color: '#2fbf71', glow: '#7dffa9' },
  { name: 'EMBER', color: '#e5484d', glow: '#ff9a7a' },
  { name: 'GOLD', color: '#f2c94c', glow: '#ffe89a' },
  { name: 'AZURE', color: '#35a7ff', glow: '#9adbff' },
];

// One night: order quota, spawn gap (s), order patience (s), max items per order.
export const NIGHTS = [
  { quota: 8, spawn: 4.6, patience: 42, maxItems: 3 },
  { quota: 10, spawn: 4.0, patience: 38, maxItems: 3 },
  { quota: 12, spawn: 3.4, patience: 34, maxItems: 4 },
  { quota: 14, spawn: 2.9, patience: 30, maxItems: 4 },
  { quota: 12, spawn: 2.7, patience: 28, maxItems: 4 },
];

export const UPGRADES = [
  { id: 'wok', name: 'Dragon Wok', desc: 'Woks cook 15% faster per tier', cost: [30, 55, 90], max: 3 },
  { id: 'ladle', name: 'Lucky Ladle', desc: '+1 combo on every perfect serve', cost: [40, 70], max: 2 },
  { id: 'scoop', name: 'Copper Scoop', desc: '+20% gold from every order', cost: [35, 60, 95], max: 3 },
  { id: 'bellows', name: 'Fire Bellows', desc: 'Perfect window +1s per tier', cost: [30, 55], max: 2 },
  { id: 'stove', name: 'Second Stove', desc: '+1 reputation (max 5)', cost: [50, 85], max: 2 },
];

export const RELICS = [
  { id: 'chopsticks', name: 'Golden Chopsticks', desc: 'First mistake is forgiven' },
  { id: 'apron', name: "Sage's Apron", desc: 'Orders stay patient +5s' },
  { id: 'phoenix', name: 'Phoenix Chili', desc: 'Combo never falls below x2' },
  { id: 'cleaver', name: 'Jade Cleaver', desc: 'Tossing is instant, no cooldown' },
  { id: 'cat', name: 'Lucky Cat', desc: '+10% score on every serve' },
];

export const ABILITIES = [
  { id: 'flash', name: 'FLASH FRY', key: 'Z', desc: 'instant READY' },
  { id: 'hands', name: 'EXTRA HANDS', key: 'C', desc: 'auto-toss next' },
  { id: 'ice', name: 'ICE BUCKET', key: 'V', desc: 'cool all woks' },
];

export const CRITIC = {
  name: 'MADAME GOLDEN LADLE',
  title: 'Food critic of the Night Market Gazette',
  startApproval: 40,
  gain: 20,
  loss: 20,
  phases: [
    { label: 'PHASE 1/3 · TASTING', seq: 3, time: 22 },
    { label: 'PHASE 2/3 · SCRUTINY', seq: 4, time: 18 },
    { label: 'PHASE 3/3 · VERDICT', seq: 5, time: 14 },
  ],
};

export const WIN_LINE = 'WIN: clear 5 nights & earn 5 stars from Madame';
export const LOSE_LINE = 'LOSE: 3 strikes, or the critic walks out';

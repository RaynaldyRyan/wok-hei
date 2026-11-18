// WOK HEI — entry program for make.fun's best-game-01.
// Copies the game and its screenshots into the output directory and writes
// the dossier the judge reads, with the kit's own buildDossier library.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
for (const name of ['game', 'screenshots']) {
  const dest = join(outDir, name);
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(join(here, name), dest, { recursive: true });
}

// buildDossier reads game/ and screenshots/ from the entry directory and
// returns the dossier as canonical JSON bytes; caps are the bounty's gate.
const dossier = buildDossier(here, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Verify what we wrote: the dossier must parse and name this game's files.
const parsed = JSON.parse(readFileSync(join(outDir, 'dossier.json'), 'utf8'));
const shots = parsed.images ? parsed.images.length : 0;
const dossierBytes = statSync(join(outDir, 'dossier.json')).size;
console.log(`wrote ${outDir} (game, ${shots} screenshots, dossier.json ${dossierBytes} bytes)`);

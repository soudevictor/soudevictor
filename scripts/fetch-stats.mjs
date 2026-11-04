/**
 * Atualiza os cards de estatísticas a partir do github-profile-summary-cards
 * e salva como SVGs locais (assets/stats.svg e assets/langs.svg).
 *
 * Importante: os SVGs ficam commitados no repositório, então o README sempre
 * exibe os cards — mesmo que o serviço esteja fora do ar. Se o download falhar,
 * os arquivos atuais são mantidos intactos (exit 0).
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'assets');

const USERNAME = process.env.GITHUB_LOGIN || 'soudevictor';
const EXCLUDE_REPOS = process.env.EXCLUDE_REPOS || '';

const BASE = 'https://github-profile-summary-cards.vercel.app/api/cards';

const targets = [
  {
    file: 'stats.svg',
    url: `${BASE}/stats?username=${USERNAME}&theme=tokyonight&hide_logo=true`,
  },
  {
    file: 'langs.svg',
    url: `${BASE}/repos-per-language?username=${USERNAME}&theme=tokyonight${
      EXCLUDE_REPOS ? `&exclude_repos=${encodeURIComponent(EXCLUDE_REPOS)}` : ''
    }`,
  },
];

let updated = 0;
let failed = 0;

for (const { file, url } of targets) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'soudevictor-stats-fetcher' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const svg = await res.text();
    if (!svg.trimStart().startsWith('<svg')) {
      throw new Error('resposta não é um SVG válido');
    }

    writeFileSync(join(ASSETS, file), svg, 'utf8');
    console.log(`✅ ${file} atualizado (${svg.length} bytes)`);
    updated++;
  } catch (err) {
    console.warn(`⚠️  Falha ao atualizar ${file}: ${err.message}. Mantendo versão existente.`);
    failed++;
  }
}

console.log(`\nResumo: ${updated} atualizado(s), ${failed} mantido(s).`);

// Nunca falha o workflow: os arquivos já commitados continuam válidos.
process.exit(0);
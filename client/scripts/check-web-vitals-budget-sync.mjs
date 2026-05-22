/**
 * WEB_VITAL_BUDGET 상수가 design_principle.json performance 목표와 일치하는지 검증한다.
 * CI·로컬: `node client/scripts/check-web-vitals-budget-sync.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(clientRoot, '..');

const webVitalsPath = path.join(
  clientRoot,
  'src/lib/observability/web-vitals.ts',
);
const designPrinciplePath = path.join(
  repoRoot,
  'agent/design/spec/design_principle.json',
);

const webVitalsSource = fs.readFileSync(webVitalsPath, 'utf8');
const design = JSON.parse(fs.readFileSync(designPrinciplePath, 'utf8'));
const perf = design.platform?.performance ?? {};

function readBudgetFromSource(name) {
  const re = new RegExp(`${name}:\\s*([\\d.]+)`);
  const match = webVitalsSource.match(re);
  if (!match) {
    throw new Error(`WEB_VITAL_BUDGET에 ${name} 항목이 없습니다.`);
  }
  return Number(match[1]);
}

const expected = {
  LCP: Math.round((perf.lcpMaxSec ?? 2.5) * 1000),
  INP: perf.inpGoodMaxMs ?? 200,
  CLS: perf.clsMax ?? 0.1,
};

const actual = {
  LCP: readBudgetFromSource('LCP'),
  INP: readBudgetFromSource('INP'),
  CLS: readBudgetFromSource('CLS'),
};

const mismatches = [];
for (const key of Object.keys(expected)) {
  if (actual[key] !== expected[key]) {
    mismatches.push(
      `${key}: web-vitals.ts=${actual[key]}, design_principle=${expected[key]}`,
    );
  }
}

if (mismatches.length > 0) {
  console.error('[check-web-vitals-budget-sync] 불일치:\n', mismatches.join('\n'));
  process.exit(1);
}

console.log(
  '[check-web-vitals-budget-sync] OK — LCP/INP/CLS 예산이 design_principle.json과 일치합니다.',
);

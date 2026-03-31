/**
 * design_tokens.json 색상 대비 검증 (WCAG 2.1, design_principle.json 기준)
 * - normal: 본문·캡션·링크·시맨틱 텍스트 등 → 4.5:1
 * - largeUI: 테두리(비텍스트 UI) → 3:1
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function parseHex(hex) {
  const s = hex.replace(/^#/, "");
  if (s.length === 3) {
    return [
      parseInt(s[0] + s[0], 16) / 255,
      parseInt(s[1] + s[1], 16) / 255,
      parseInt(s[2] + s[2], 16) / 255,
    ];
  }
  const r = parseInt(s.slice(0, 2), 16) / 255;
  const g = parseInt(s.slice(2, 4), 16) / 255;
  const b = parseInt(s.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function channelLuminance(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgHex, bgHex) {
  const L1 = relativeLuminance(fgHex);
  const L2 = relativeLuminance(bgHex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function loadJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

const principle = loadJson("agent/design/design_principle.json");
const tokens = loadJson("agent/design/design_tokens.json");

const NORMAL = parseFloat(String(principle.accessibility.colorContrast.bodyText).replace(":1", ""));
const LARGE_UI = parseFloat(
  String(principle.accessibility.colorContrast.largeTextAndUI).replace(":1", ""),
);

function isColorKey(k) {
  if (k.endsWith("-usage")) return false;
  if (typeof tokens.color.light[k] !== "string") return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(tokens.color.light[k]);
}

function collectChecks(theme) {
  const c = tokens.color[theme];
  const checks = [];

  const textKeys = [
    "text-primary",
    "text-secondary",
    "text-caption",
    "text-link",
    "text-link-hover",
    "success",
    "error",
    "warning",
    "info",
  ];
  const bgKeys = ["background", "surface"];

  for (const tk of textKeys) {
    for (const bk of bgKeys) {
      checks.push({
        id: `${theme}.${tk}-on-${bk}`,
        fg: c[tk],
        bg: c[bk],
        min: NORMAL,
        kind: "normal",
      });
    }
  }

  checks.push(
    {
      id: `${theme}.on-primary-on-primary`,
      fg: c["on-primary"],
      bg: c.primary,
      min: NORMAL,
      kind: "normal",
    },
    {
      id: `${theme}.on-primary-on-primary-hover`,
      fg: c["on-primary"],
      bg: c["primary-hover"],
      min: NORMAL,
      kind: "normal",
    },
    {
      id: `${theme}.on-secondary-on-secondary`,
      fg: c["on-secondary"],
      bg: c.secondary,
      min: NORMAL,
      kind: "normal",
    },
    {
      id: `${theme}.border-on-background`,
      fg: c.border,
      bg: c.background,
      min: LARGE_UI,
      kind: "largeUI",
    },
    {
      id: `${theme}.border-on-surface`,
      fg: c.border,
      bg: c.surface,
      min: LARGE_UI,
      kind: "largeUI",
    },
  );

  return checks;
}

const allChecks = [...collectChecks("light"), ...collectChecks("dark")];
const failures = [];

for (const ch of allChecks) {
  const ratio = contrastRatio(ch.fg, ch.bg);
  if (ratio + 1e-6 < ch.min) {
    failures.push({ ...ch, ratio: Math.round(ratio * 1000) / 1000 });
  }
}

if (failures.length) {
  console.error("대비 미달:\n");
  for (const f of failures) {
    console.error(
      `  ${f.id}: ${f.fg} on ${f.bg} → ${f.ratio}:1 (필요 ≥ ${f.min}:1, ${f.kind})`,
    );
  }
  console.error(`\n총 ${failures.length}건 실패`);
  process.exit(1);
}

console.log(
  `OK: ${allChecks.length}개 쌍 모두 충족 (normal ≥ ${NORMAL}:1, UI ≥ ${LARGE_UI}:1)`,
);

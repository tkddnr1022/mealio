/**
 * design_tokens.json 색상 대비 검증 (WCAG 2.1, design_principle.json 기준)
 * - normal: 본문·캡션·링크·시맨틱 텍스트 등 → 4.5:1
 * - largeUI: 테두리(비텍스트 UI) → 3:1
 * - `variables.color.*` 리프의 `{ aliasOf: "variables...." }`는 canonical까지 따라가 hex를 해석한다.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");

function parseHex(hex) {
  const s = hex.replace(/^#/, "");
  if (s.length === 8) {
    return [
      parseInt(s.slice(0, 2), 16) / 255,
      parseInt(s.slice(2, 4), 16) / 255,
      parseInt(s.slice(4, 6), 16) / 255,
    ];
  }
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

const principle = loadJson("agent/design/spec/design_principle.json");
const tokens = loadJson("agent/design/spec/design_tokens.json");

const colors = tokens.variables?.color ?? tokens.color;

const NORMAL = parseFloat(String(principle.accessibility.colorContrast.bodyText).replace(":1", ""));
const LARGE_UI = parseFloat(
  String(principle.accessibility.colorContrast.largeTextAndUI).replace(":1", ""),
);

/** @param {string} pathStr e.g. variables.color.light.primary.default */
function resolvePath(tokens, pathStr, visited = new Set()) {
  if (visited.has(pathStr)) {
    throw new Error(`alias 순환: ${pathStr}`);
  }
  visited.add(pathStr);
  const parts = pathStr.replace(/^variables\./, "").split(".");
  let cur = tokens.variables;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return resolveValue(tokens, cur, visited);
}

function resolveValue(tokens, v, visited = new Set()) {
  if (v == null) return undefined;
  if (typeof v === "string" && /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/i.test(v)) {
    return v;
  }
  if (typeof v === "object" && v.aliasOf && typeof v.aliasOf === "string") {
    return resolvePath(tokens, v.aliasOf, visited);
  }
  return undefined;
}

function collectChecks(theme) {
  const c = colors[theme];
  const checks = [];

  const textPrimary = resolveValue(tokens, c.text?.primary);
  const textSecondary = resolveValue(tokens, c.text?.secondary);
  const textCaption = resolveValue(tokens, c.text?.caption);
  const textLink = resolveValue(tokens, c.extensions?.text?.link);
  const textLinkHover = resolveValue(tokens, c.extensions?.text?.["link-hover"]);
  const success = resolveValue(tokens, c.extensions?.state?.success);
  const error = resolveValue(tokens, c.extensions?.state?.error);
  const warning = resolveValue(tokens, c.extensions?.state?.warning);
  const info = resolveValue(tokens, c.extensions?.state?.info);

  const bgPrimary = resolveValue(tokens, c.background?.primary);
  const bgSurface = resolveValue(tokens, c.background?.surface);

  const textKeys = [
    ["text-primary", textPrimary],
    ["text-secondary", textSecondary],
    ["text-caption", textCaption],
    ["text-link", textLink],
    ["text-link-hover", textLinkHover],
    ["success", success],
    ["error", error],
    ["warning", warning],
    ["info", info],
  ];
  const bgKeys = [
    ["background", bgPrimary],
    ["surface", bgSurface],
  ];

  for (const [tk, fg] of textKeys) {
    if (!fg || typeof fg !== "string") continue;
    for (const [bk, bg] of bgKeys) {
      if (!bg || typeof bg !== "string") continue;
      checks.push({
        id: `${theme}.${tk}-on-${bk}`,
        fg,
        bg,
        min: NORMAL,
        kind: "normal",
      });
    }
  }

  checks.push(
    {
      id: `${theme}.on-primary-on-primary`,
      fg: resolveValue(tokens, c.on?.primary),
      bg: resolveValue(tokens, c.primary?.default),
      min: NORMAL,
      kind: "normal",
    },
    {
      id: `${theme}.on-primary-on-primary-hover`,
      fg: resolveValue(tokens, c.on?.primary),
      bg: resolveValue(tokens, c.primary?.hover),
      min: NORMAL,
      kind: "normal",
    },
    {
      id: `${theme}.on-secondary-on-secondary`,
      fg: resolveValue(tokens, c.on?.secondary),
      bg: resolveValue(tokens, c.secondary?.default),
      min: NORMAL,
      kind: "normal",
    },
    {
      id: `${theme}.border-on-background`,
      fg: resolveValue(tokens, c.extensions?.border),
      bg: bgPrimary,
      min: LARGE_UI,
      kind: "largeUI",
    },
    {
      id: `${theme}.border-on-surface`,
      fg: resolveValue(tokens, c.extensions?.border),
      bg: bgSurface,
      min: LARGE_UI,
      kind: "largeUI",
    },
  );

  return checks;
}

const allChecks = [...collectChecks("light"), ...collectChecks("dark")];
const failures = [];

for (const ch of allChecks) {
  if (!ch.fg || !ch.bg || typeof ch.fg !== "string" || typeof ch.bg !== "string") continue;
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

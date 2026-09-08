import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const webSrc = resolve(import.meta.dir, "../apps/web/src");

const PLURAL_SUFFIXES = /_(zero|one|two|few|many|other)$/;

interface FilePair {
  dir: string;
  enPath: string;
  plPath: string;
  key: string;
}

function findLocalePairs(dir: string, base: string): FilePair[] {
  const pairs: FilePair[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      pairs.push(...findLocalePairs(full, base));
    } else if (
      entry.isFile() &&
      (entry.name === "en-GB.json" || entry.name === "pl-PL.json")
    ) {
      const enPath =
        entry.name === "en-GB.json" ? full : join(dir, "en-GB.json");
      const plPath =
        entry.name === "pl-PL.json" ? full : join(dir, "pl-PL.json");
      pairs.push({
        dir: full,
        enPath,
        plPath,
        key: full.slice(base.length + 1),
      });
    }
  }
  return pairs;
}

type TranslationNode = Record<string, unknown>;

function normalizePluralKey(key: string): string {
  return key.replace(PLURAL_SUFFIXES, "");
}

export function flatten(
  node: TranslationNode,
  prefix = "",
  out: Record<string, string> = {}
): Record<string, string> {
  for (const rawKey of Object.keys(node)) {
    const key = prefix ? `${prefix}.${rawKey}` : rawKey;
    const value = node[rawKey];
    if (typeof value === "string") {
      out[normalizePluralKey(key)] = value;
    } else if (value !== null && typeof value === "object") {
      flatten(value as TranslationNode, key, out);
    }
  }
  return out;
}

function placeholders(value: string): string[] {
  const matches = value.match(/\{\{([^}]+)\}\}/g) ?? [];
  return matches.map((m) => m.slice(2, -2)).sort();
}

function loadJson(path: string): Record<string, string> {
  return flatten(JSON.parse(readFileSync(path, "utf-8")) as TranslationNode);
}

const pairs = findLocalePairs(webSrc, webSrc);

const missingInPl: string[] = [];
const missingInEn: string[] = [];
const placeholderMismatches: string[] = [];

pairs.forEach((pair) => {
  if (!existsSync(pair.enPath) || !existsSync(pair.plPath)) {
    console.error(`Missing locale pair at ${pair.dir}`);
    process.exitCode = 1;
    return;
  }
  const en = loadJson(pair.enPath);
  const pl = loadJson(pair.plPath);

  const enKeys = Object.keys(en);
  const plKeys = Object.keys(pl);

  for (const key of enKeys) {
    if (!(key in pl)) {
      missingInPl.push(key);
    } else if (placeholders(en[key]).join() !== placeholders(pl[key]).join()) {
      placeholderMismatches.push(key);
    }
  }
  for (const key of plKeys) {
    if (!(key in en)) {
      missingInEn.push(key);
    }
  }
});

const exit = () => {
  if (missingInEn.length > 0) {
    console.error(
      `[PL] Keys present in Polish but missing in English (${missingInEn.length}):`
    );
    missingInEn.sort().forEach((k) => console.error(`  ${k}`));
  }
  if (missingInPl.length > 0) {
    console.error(
      `[EN] Keys present in English but missing in Polish (${missingInPl.length}):`
    );
    missingInPl.sort().forEach((k) => console.error(`  ${k}`));
  }
  if (placeholderMismatches.length > 0) {
    console.error(
      `[PLACEHOLDERS] Interpolation variables differ per language (${placeholderMismatches.length}):`
    );
    placeholderMismatches.sort().forEach((k) => console.error(`  ${k}`));
  }
  if (
    missingInEn.length > 0 ||
    missingInPl.length > 0 ||
    placeholderMismatches.length > 0
  ) {
    process.exitCode = 1;
  } else {
    console.log(`All ${pairs.length} locale file pairs are in sync.`);
  }
};

exit();
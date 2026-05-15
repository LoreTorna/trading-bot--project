import fs from "fs";
import path from "path";

type RuntimeEnvMap = Record<string, string>;

let cachedEnvFile: RuntimeEnvMap | null = null;

function parseEnvFile(content: string): RuntimeEnvMap {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .reduce<RuntimeEnvMap>((accumulator, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!key) {
        return accumulator;
      }

      accumulator[key] = value.replace(/^['"]|['"]$/g, "");
      return accumulator;
    }, {});
}

function loadEnvFile(): RuntimeEnvMap {
  if (cachedEnvFile) {
    return cachedEnvFile;
  }

  const candidates = [
    process.env.REPO_PATH ? path.join(process.env.REPO_PATH, ".env") : null,
    process.env.BOT_WORKING_DIR
      ? path.join(process.env.BOT_WORKING_DIR, "..", ".env")
      : null,
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
  ].filter((value): value is string => Boolean(value));

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        cachedEnvFile = parseEnvFile(fs.readFileSync(filePath, "utf-8"));
        return cachedEnvFile;
      }
    } catch {
      continue;
    }
  }

  cachedEnvFile = {};
  return cachedEnvFile;
}

export function readRuntimeEnv(key: string, fallback = ""): string {
  const processValue = process.env[key];
  if (processValue && processValue.trim().length > 0) {
    return processValue.trim();
  }

  const fileValue = loadEnvFile()[key];
  if (fileValue && fileValue.trim().length > 0) {
    return fileValue.trim();
  }

  return fallback;
}

export function readRuntimeNumber(key: string, fallback: number): number {
  const parsed = Number(readRuntimeEnv(key, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readRuntimeList(
  key: string,
  fallback: readonly string[] = []
): string[] {
  const rawValue = readRuntimeEnv(key, "");
  if (!rawValue) {
    return [...fallback];
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

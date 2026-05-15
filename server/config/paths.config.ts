import fs from "fs";
import nodePath from "path";
import { readRuntimeEnv } from "./runtime-env";

const WINDOWS_REPOSITORY_CANDIDATES = [
  "C:\\Users\\loren\\OneDrive\\Desktop\\TRADE\\TRADING-AI-BOT-CLAUDE+MANUS\\trading-bot--project-main",
  "C:\\Users\\loren\\OneDrive\\Desktop\\TRADE\\newbotMANUS\\trading-bot--project-main",
];

function looksLikeRepository(candidate: string): boolean {
  return (
    fs.existsSync(candidate) &&
    fs.existsSync(nodePath.join(candidate, "trading-bot-ai", "run_bot.py")) &&
    fs.existsSync(nodePath.join(candidate, "package.json"))
  );
}

function resolveRepositoryRoot(): string {
  const explicitRepo = readRuntimeEnv("REPO_PATH", "");
  if (explicitRepo && looksLikeRepository(explicitRepo)) {
    return explicitRepo;
  }

  const botWorkingDir = readRuntimeEnv("BOT_WORKING_DIR", "");
  if (botWorkingDir) {
    const absoluteBotDir = nodePath.resolve(process.cwd(), botWorkingDir);
    if (
      fs.existsSync(absoluteBotDir) &&
      fs.existsSync(nodePath.join(absoluteBotDir, "run_bot.py"))
    ) {
      return nodePath.dirname(absoluteBotDir);
    }
  }

  const currentDir = process.cwd();
  if (looksLikeRepository(currentDir)) {
    return currentDir;
  }

  if (nodePath.basename(currentDir) === "trading-bot-ai") {
    const parentDir = nodePath.dirname(currentDir);
    if (looksLikeRepository(parentDir)) {
      return parentDir;
    }
  }

  const candidates =
    process.platform === "win32"
      ? [...WINDOWS_REPOSITORY_CANDIDATES, currentDir]
      : ["/home/ubuntu/trading-bot--project", currentDir];

  for (const candidate of candidates) {
    if (looksLikeRepository(candidate)) {
      return candidate;
    }
  }

  return currentDir;
}

const repoRoot = resolveRepositoryRoot();
const botDir = nodePath.join(repoRoot, "trading-bot-ai");

export const PATHS_CONFIG = {
  repositoryRoot: repoRoot,
  python: {
    backtest: nodePath.join(botDir, "backtest.py"),
    runBot: nodePath.join(botDir, "run_bot.py"),
    setup: nodePath.join(botDir, "setup.py"),
    dashboard: nodePath.join(botDir, "run_dashboard.py"),
  },
  batch: {
    setup: nodePath.join(botDir, "setup.bat"),
    runBot: nodePath.join(botDir, "run_bot.bat"),
    backtest: nodePath.join(botDir, "backtest.bat"),
    dashboard: nodePath.join(botDir, "run_dashboard.bat"),
    installDeps: nodePath.join(botDir, "install_deps.bat"),
  },
  shell: {
    setup: nodePath.join(botDir, "setup.sh"),
    runBot: nodePath.join(botDir, "run_bot.sh"),
    backtest: nodePath.join(botDir, "backtest.sh"),
    dashboard: nodePath.join(botDir, "run_dashboard.sh"),
  },
  folders: {
    config: nodePath.join(repoRoot, "config"),
    logs: nodePath.join(repoRoot, "logs"),
    data: nodePath.join(repoRoot, "data"),
    reports: nodePath.join(repoRoot, "reports"),
    strategies: nodePath.join(repoRoot, "strategies"),
    botAi: botDir,
  },
  config: {
    env: nodePath.join(repoRoot, ".env"),
    envExample: nodePath.join(repoRoot, ".env.example"),
  },
  logs: {
    main: nodePath.join(repoRoot, "logs", "bot.log"),
    backtest: nodePath.join(repoRoot, "logs", "backtest.log"),
    setup: nodePath.join(repoRoot, "logs", "setup.log"),
  },
  data: {
    trades: nodePath.join(repoRoot, "data", "trades.json"),
    metrics: nodePath.join(repoRoot, "data", "metrics.json"),
    backtest: nodePath.join(repoRoot, "data", "backtest_results.json"),
  },
};

export type PathsConfig = typeof PATHS_CONFIG;

export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function isWindowsAppsAlias(filePath: string): boolean {
  return filePath.toLowerCase().includes("\\microsoft\\windowsapps\\");
}

function findExecutableOnPath(commandName: string): string | null {
  const rawPath = process.env.Path ?? process.env.PATH ?? "";
  const extensions =
    process.platform === "win32" && !nodePath.extname(commandName)
      ? [".exe", ".cmd", ".bat", ""]
      : [""];

  for (const directory of rawPath.split(nodePath.delimiter)) {
    if (!directory) {
      continue;
    }

    for (const extension of extensions) {
      const candidate = nodePath.join(directory, `${commandName}${extension}`);
      if (fileExists(candidate) && !isWindowsAppsAlias(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function findLocalPythonInstall(): string | null {
  if (process.platform !== "win32") {
    return null;
  }

  const candidates: string[] = [];
  const localAppData = process.env.LOCALAPPDATA;

  if (localAppData) {
    const programsPython = nodePath.join(localAppData, "Programs", "Python");
    try {
      for (const entry of fs.readdirSync(programsPython)) {
        candidates.push(nodePath.join(programsPython, entry, "python.exe"));
      }
    } catch {
      // Ignore missing Python install folder.
    }

    const pythonCore = nodePath.join(localAppData, "Python");
    try {
      for (const entry of fs.readdirSync(pythonCore)) {
        candidates.push(nodePath.join(pythonCore, entry, "python.exe"));
      }
      candidates.push(nodePath.join(pythonCore, "bin", "python.exe"));
    } catch {
      // Ignore missing Python core folder.
    }
  }

  const existing = candidates
    .filter((candidate) => fileExists(candidate) && !isWindowsAppsAlias(candidate))
    .sort()
    .reverse();

  return existing[0] ?? null;
}

export function getPythonCommand(): string {
  const explicitPython = readRuntimeEnv("BOT_PYTHON_PATH", "");
  if (
    explicitPython &&
    !["python", "python.exe", "python3", "python3.exe"].includes(
      explicitPython.toLowerCase()
    )
  ) {
    return explicitPython;
  }

  const localVenvPython =
    process.platform === "win32"
      ? nodePath.join(repoRoot, ".venv", "Scripts", "python.exe")
      : nodePath.join(repoRoot, ".venv", "bin", "python");

  if (fileExists(localVenvPython)) {
    return localVenvPython;
  }

  const requestedCommand =
    explicitPython || (process.platform === "win32" ? "python" : "python3");
  const pathPython = findExecutableOnPath(requestedCommand);
  if (pathPython) {
    return pathPython;
  }

  const localPython = findLocalPythonInstall();
  if (localPython) {
    return localPython;
  }

  return requestedCommand;
}

export function getShellCommand(): string {
  return process.platform === "win32" ? "cmd.exe" : "/bin/bash";
}

export function getFilePath(
  fileType: "python" | "batch" | "shell" | "config" | "logs" | "data",
  fileName: string
): string {
  let fileGroup: Record<string, string> | undefined;
  switch (fileType) {
    case "python":
      fileGroup = PATHS_CONFIG.python;
      break;
    case "batch":
      fileGroup = PATHS_CONFIG.batch;
      break;
    case "shell":
      fileGroup = PATHS_CONFIG.shell;
      break;
    case "config":
      fileGroup = PATHS_CONFIG.config;
      break;
    case "logs":
      fileGroup = PATHS_CONFIG.logs;
      break;
    case "data":
      fileGroup = PATHS_CONFIG.data;
      break;
  }

  if (!fileGroup) {
    throw new Error(`Tipo di file non supportato: ${fileType}`);
  }

  return fileGroup[fileName] || nodePath.join(repoRoot, fileName);
}

export default PATHS_CONFIG;

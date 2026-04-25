import fs from "fs";
import nodePath from "path";
import { readRuntimeEnv } from "./runtime-env";

function isRepositoryRoot(candidate: string): boolean {
  return (
    fs.existsSync(nodePath.join(candidate, "package.json")) &&
    fs.existsSync(nodePath.join(candidate, "trading-bot-ai"))
  );
}

function findRepositoryRoot(startDir: string): string | null {
  let currentDir = nodePath.resolve(startDir);

  while (true) {
    if (isRepositoryRoot(currentDir)) {
      return currentDir;
    }

    const parentDir = nodePath.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function getRepositoryPath(): string {
  const explicitRepoPath = readRuntimeEnv("REPO_PATH", "");
  if (explicitRepoPath && isRepositoryRoot(explicitRepoPath)) {
    return explicitRepoPath;
  }

  const explicitBotDir = readRuntimeEnv("BOT_WORKING_DIR", "");
  if (explicitBotDir) {
    const candidateRoot = nodePath.resolve(explicitBotDir, "..");
    if (isRepositoryRoot(candidateRoot)) {
      return candidateRoot;
    }
  }

  const resolvedFromCwd = findRepositoryRoot(process.cwd());
  if (resolvedFromCwd) {
    return resolvedFromCwd;
  }

  return process.cwd();
}

const repoRoot = getRepositoryPath();
const botRoot = nodePath.join(repoRoot, "trading-bot-ai");

export const PATHS_CONFIG = {
  repositoryRoot: repoRoot,

  python: {
    backtest: nodePath.join(botRoot, "backtest.py"),
    runBot: nodePath.join(botRoot, "run_bot.py"),
    setup: nodePath.join(botRoot, "setup.py"),
    dashboard: nodePath.join(botRoot, "run_dashboard.py"),
  },

  batch: {
    setup: nodePath.join(botRoot, "setup.bat"),
    runBot: nodePath.join(botRoot, "run_bot.bat"),
    backtest: nodePath.join(botRoot, "backtest.bat"),
    dashboard: nodePath.join(botRoot, "run_dashboard.bat"),
    installDeps: nodePath.join(botRoot, "install_deps.bat"),
  },

  shell: {
    setup: nodePath.join(botRoot, "setup.sh"),
    runBot: nodePath.join(botRoot, "run_bot.sh"),
    backtest: nodePath.join(botRoot, "backtest.sh"),
    dashboard: nodePath.join(botRoot, "run_dashboard.sh"),
  },

  folders: {
    core: nodePath.join(repoRoot, "core"),
    strategies: nodePath.join(repoRoot, "strategies"),
    config: nodePath.join(repoRoot, "config"),
    logs: nodePath.join(repoRoot, "logs"),
    data: nodePath.join(repoRoot, "data"),
    backtester: nodePath.join(repoRoot, "backtester"),
    botAi: botRoot,
  },

  config: {
    main: nodePath.join(repoRoot, "config", "config.yaml"),
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

export function getPythonCommand(): string {
  const configuredPath = readRuntimeEnv("BOT_PYTHON_PATH", "");
  if (configuredPath) {
    return configuredPath;
  }

  return process.platform === "win32" ? "python" : "python3";
}

export function getShellCommand(): string {
  return process.platform === "win32" ? "cmd.exe" : "/bin/bash";
}

export function getFilePath(
  fileType: "python" | "batch" | "shell" | "config" | "logs" | "data",
  fileName: string
): string {
  switch (fileType) {
    case "python":
      return PATHS_CONFIG.python[fileName as keyof typeof PATHS_CONFIG.python] || nodePath.join(repoRoot, fileName);
    case "batch":
      return PATHS_CONFIG.batch[fileName as keyof typeof PATHS_CONFIG.batch] || nodePath.join(repoRoot, fileName);
    case "shell":
      return PATHS_CONFIG.shell[fileName as keyof typeof PATHS_CONFIG.shell] || nodePath.join(repoRoot, fileName);
    case "config":
      return PATHS_CONFIG.config[fileName as keyof typeof PATHS_CONFIG.config] || nodePath.join(repoRoot, fileName);
    case "logs":
      return PATHS_CONFIG.logs[fileName as keyof typeof PATHS_CONFIG.logs] || nodePath.join(repoRoot, fileName);
    case "data":
      return PATHS_CONFIG.data[fileName as keyof typeof PATHS_CONFIG.data] || nodePath.join(repoRoot, fileName);
    default:
      throw new Error(`Tipo di file non supportato: ${fileType}`);
  }
}

export default PATHS_CONFIG;

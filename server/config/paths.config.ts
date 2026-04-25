import nodePath from "path";
import fs from "fs";

/**
 * Configurazione percorsi per il repository GitHub
 * Supporta sia Windows che Linux/Mac
 * process.cwd() è il metodo più affidabile quando si lancia da dentro la cartella del progetto
 */

const getRepositoryPath = (): string => {
  // 1. Variabile d'ambiente esplicita (massima priorità)
  if (process.env.REPO_PATH && fs.existsSync(process.env.REPO_PATH)) {
    return process.env.REPO_PATH;
  }

  // 2. Directory corrente — caso più comune: node dist/index.cjs lanciato dalla root del progetto
  if (fs.existsSync(nodePath.join(process.cwd(), "trading-bot-ai"))) {
    return process.cwd();
  }

  if (process.platform === "win32") {
    const candidates = [
      "C:\\Users\\loren\\OneDrive\\Desktop\\TRADE\\TRADING-AI-BOT-CLAUDE+MANUS\\trading-bot--project-main",
      "C:\\Users\\loren\\OneDrive\\Desktop\\TRADE\\newbotMANUS\\trading-bot--project",
      "C:\\Users\\loren\\Desktop\\trading-bot--project",
      process.cwd(),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return candidates[0];
  } else {
    const candidates = [
      "/home/ubuntu/trading-bot--project",
      process.cwd(),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return candidates[0];
  }
};

const repoRoot = getRepositoryPath();

export const PATHS_CONFIG = {
  repositoryRoot: repoRoot,

  python: {
    backtest:  nodePath.join(repoRoot, "trading-bot-ai", "backtest.py"),
    runBot:    nodePath.join(repoRoot, "trading-bot-ai", "run_bot.py"),
    setup:     nodePath.join(repoRoot, "trading-bot-ai", "setup.py"),
    dashboard: nodePath.join(repoRoot, "trading-bot-ai", "run_dashboard.py"),
  },

  batch: {
    setup:       nodePath.join(repoRoot, "setup.bat"),
    runBot:      nodePath.join(repoRoot, "run_bot.bat"),
    backtest:    nodePath.join(repoRoot, "backtest.bat"),
    dashboard:   nodePath.join(repoRoot, "dashboard.bat"),
    installDeps: nodePath.join(repoRoot, "install_deps.bat"),
  },

  shell: {
    setup:     nodePath.join(repoRoot, "trading-bot-ai", "setup.sh"),
    runBot:    nodePath.join(repoRoot, "trading-bot-ai", "run_bot.sh"),
    backtest:  nodePath.join(repoRoot, "trading-bot-ai", "backtest.sh"),
    dashboard: nodePath.join(repoRoot, "trading-bot-ai", "dashboard.sh"),
  },

  folders: {
    core:       nodePath.join(repoRoot, "core"),
    strategies: nodePath.join(repoRoot, "strategies"),
    config:     nodePath.join(repoRoot, "config"),
    logs:       nodePath.join(repoRoot, "logs"),
    data:       nodePath.join(repoRoot, "data"),
    backtester: nodePath.join(repoRoot, "backtester"),
    botAi:      nodePath.join(repoRoot, "trading-bot-ai"),
  },

  config: {
    main:       nodePath.join(repoRoot, "config", "config.yaml"),
    env:        nodePath.join(repoRoot, ".env"),
    envExample: nodePath.join(repoRoot, ".env.example"),
  },

  logs: {
    main:     nodePath.join(repoRoot, "logs", "bot.log"),
    backtest: nodePath.join(repoRoot, "logs", "backtest.log"),
    setup:    nodePath.join(repoRoot, "logs", "setup.log"),
  },

  data: {
    trades:   nodePath.join(repoRoot, "data", "trades.json"),
    metrics:  nodePath.join(repoRoot, "data", "metrics.json"),
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
  return process.platform === "win32" ? "python" : "python3";
}

export function getShellCommand(): string {
  return process.platform === "win32" ? "cmd.exe" : "/bin/bash";
}

export function getFilePath(
  fileType: "python" | "batch" | "shell" | "config" | "logs" | "data",
  fileName: string
): string {
  const config = PATHS_CONFIG as any;
  const fileConfig = config[fileType];
  if (!fileConfig) throw new Error(`Tipo di file non supportato: ${fileType}`);
  return fileConfig[fileName] || nodePath.join(repoRoot, fileName);
}

export default PATHS_CONFIG;

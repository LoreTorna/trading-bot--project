import path from "path";
import os from "os";

/**
 * Configurazione percorsi per il repository GitHub
 * Supporta sia Windows che Linux/Mac
 */

// Percorso base del repository (su Windows)
const WINDOWS_REPO_PATH = "C:\\Users\\loren\\OneDrive\\Desktop\\TRADE\\newbotMANUS\\trading-bot--project-main";

// Percorso alternativo (se scaricato altrove)
const LINUX_REPO_PATH = "/home/ubuntu/trading-bot-ai";

// Determina il percorso in base al sistema operativo
const getRepositoryPath = (): string => {
  if (process.platform === "win32") {
    // Windows
    return WINDOWS_REPO_PATH;
  } else {
    // Linux/Mac
    return LINUX_REPO_PATH;
  }
};

export const PATHS_CONFIG = {
  // Percorso base del repository
  repositoryRoot: getRepositoryPath(),

  // Percorsi dei file Python
  python: {
    backtest: path.join(getRepositoryPath(), "backtest.py"),
    runBot: path.join(getRepositoryPath(), "run_bot.py"),
    setup: path.join(getRepositoryPath(), "setup.py"),
    dashboard: path.join(getRepositoryPath(), "run_dashboard.py"),
  },

  // Percorsi dei file batch (Windows)
  batch: {
    setup: path.join(getRepositoryPath(), "setup.bat"),
    runBot: path.join(getRepositoryPath(), "run_bot.bat"),
    backtest: path.join(getRepositoryPath(), "backtest.bat"),
    dashboard: path.join(getRepositoryPath(), "dashboard.bat"),
    installDeps: path.join(getRepositoryPath(), "install_deps.bat"),
  },

  // Percorsi dei file shell (Linux/Mac)
  shell: {
    setup: path.join(getRepositoryPath(), "setup.sh"),
    runBot: path.join(getRepositoryPath(), "run_bot.sh"),
    backtest: path.join(getRepositoryPath(), "backtest.sh"),
    dashboard: path.join(getRepositoryPath(), "dashboard.sh"),
  },

  // Percorsi delle cartelle
  folders: {
    core: path.join(getRepositoryPath(), "core"),
    strategies: path.join(getRepositoryPath(), "strategies"),
    config: path.join(getRepositoryPath(), "config"),
    logs: path.join(getRepositoryPath(), "logs"),
    data: path.join(getRepositoryPath(), "data"),
    backtester: path.join(getRepositoryPath(), "backtester"),
  },

  // Percorsi dei file di configurazione
  config: {
    main: path.join(getRepositoryPath(), "config", "config.yaml"),
    env: path.join(getRepositoryPath(), ".env"),
    envExample: path.join(getRepositoryPath(), ".env.example"),
  },

  // Percorsi dei file di log
  logs: {
    main: path.join(getRepositoryPath(), "logs", "bot.log"),
    backtest: path.join(getRepositoryPath(), "logs", "backtest.log"),
    setup: path.join(getRepositoryPath(), "logs", "setup.log"),
  },

  // Percorsi dei file di dati
  data: {
    trades: path.join(getRepositoryPath(), "data", "trades.json"),
    metrics: path.join(getRepositoryPath(), "data", "metrics.json"),
    backtest: path.join(getRepositoryPath(), "data", "backtest_results.json"),
  },
};

export type PathsConfig = typeof PATHS_CONFIG;

/**
 * Funzione helper per ottenere il percorso di un file
 * @param fileType - Tipo di file (python, batch, shell, config, logs, data)
 * @param fileName - Nome del file
 * @returns Percorso completo del file
 */
export function getFilePath(
  fileType: "python" | "batch" | "shell" | "config" | "logs" | "data",
  fileName: string
): string {
  const config = PATHS_CONFIG as any;
  const fileConfig = config[fileType];

  if (!fileConfig) {
    throw new Error(`Tipo di file non supportato: ${fileType}`);
  }

  return fileConfig[fileName] || path.join(getRepositoryPath(), fileName);
}

/**
 * Funzione helper per verificare se un file esiste
 */
export function fileExists(filePath: string): boolean {
  try {
    const fs = require("fs");
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Funzione helper per ottenere il comando di esecuzione corretto
 * @returns Comando di esecuzione (python, python3, py, ecc.)
 */
export function getPythonCommand(): string {
  if (process.platform === "win32") {
    // Windows: prova python, py, python3
    return "python";
  } else {
    // Linux/Mac: prova python3, python
    return "python3";
  }
}

/**
 * Funzione helper per ottenere il comando shell corretto
 * @returns Comando shell (bash, sh, cmd, ecc.)
 */
export function getShellCommand(): string {
  if (process.platform === "win32") {
    // Windows
    return "cmd.exe";
  } else {
    // Linux/Mac
    return "/bin/bash";
  }
}

export default PATHS_CONFIG;

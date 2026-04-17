import path from "path";
import os from "os";

/**
 * Configurazione percorsi per il repository GitHub
 * Supporta sia Windows che Linux/Mac
 */

// Determina il percorso in base al sistema operativo e all'ambiente
const getRepositoryPath = (): string => {
  // Prova prima le variabili d'ambiente
  if (process.env.REPO_PATH) {
    return process.env.REPO_PATH;
  }
  
  if (process.platform === "win32") {
    // Windows: percorsi comuni
    const possiblePaths = [
      "C:\\Users\\loren\\OneDrive\\Desktop\\TRADE\\newbotMANUS\\trading-bot--project",
      "C:\\Users\\loren\\Desktop\\trading-bot--project",
      process.cwd() // Directory corrente
    ];
    
    // Ritorna il primo percorso che esiste
    const fs = require('fs');
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
    
    // Se nessuno esiste, ritorna il primo
    return possiblePaths[0];
  } else {
    // Linux/Mac
    const possiblePaths = [
      "/home/ubuntu/trading-bot--project",
      process.cwd()
    ];
    
    const fs = require('fs');
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
    
    return possiblePaths[0];
  }
};

export const PATHS_CONFIG = {
  // Percorso base del repository
  repositoryRoot: getRepositoryPath(),

  // Percorsi dei file Python
  python: {
    backtest: path.join(getRepositoryPath(), "trading-bot-ai", "backtest.py"),
    runBot: path.join(getRepositoryPath(), "trading-bot-ai", "run_bot.py"),
    setup: path.join(getRepositoryPath(), "trading-bot-ai", "setup.py"),
    dashboard: path.join(getRepositoryPath(), "trading-bot-ai", "run_dashboard.py"),
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
    setup: path.join(getRepositoryPath(), "trading-bot-ai", "setup.sh"),
    runBot: path.join(getRepositoryPath(), "trading-bot-ai", "run_bot.sh"),
    backtest: path.join(getRepositoryPath(), "trading-bot-ai", "backtest.sh"),
    dashboard: path.join(getRepositoryPath(), "trading-bot-ai", "dashboard.sh"),
  },

  // Percorsi delle cartelle
  folders: {
    core: path.join(getRepositoryPath(), "core"),
    strategies: path.join(getRepositoryPath(), "strategies"),
    config: path.join(getRepositoryPath(), "config"),
    logs: path.join(getRepositoryPath(), "logs"),
    data: path.join(getRepositoryPath(), "data"),
    backtester: path.join(getRepositoryPath(), "backtester"),
    botAi: path.join(getRepositoryPath(), "trading-bot-ai"),
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

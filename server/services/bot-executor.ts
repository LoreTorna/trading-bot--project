import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { PATHS_CONFIG, fileExists, getPythonCommand, getShellCommand } from "../config/paths.config";

const execAsync = promisify(exec);

export interface BotExecutionResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
  executedPath?: string;
}

/**
 * Bot Executor Service
 * Esegue gli script Python e batch del bot di trading
 * Supporta sia Windows che Linux/Mac
 */

class BotExecutor {
  private isWindows = process.platform === "win32";
  private repositoryPath = PATHS_CONFIG.repositoryRoot;

  /**
   * Esegui lo script setup
   */
  async runSetup(): Promise<BotExecutionResult> {
    try {
      console.log(`[BotExecutor] Esecuzione setup dal repository: ${this.repositoryPath}`);

      // Prova a eseguire il file batch/shell
      if (this.isWindows) {
        const setupBat = PATHS_CONFIG.batch.setup;
        if (fileExists(setupBat)) {
          console.log(`[BotExecutor] Trovato: ${setupBat}`);
          const { stdout, stderr } = await execAsync(`"${setupBat}"`, {
            cwd: this.repositoryPath,
            timeout: 300000, // 5 minuti
          });
          return {
            success: true,
            message: "✅ Setup completato con successo",
            output: stdout,
            executedPath: setupBat,
          };
        }
      } else {
        const setupSh = PATHS_CONFIG.shell.setup;
        if (fileExists(setupSh)) {
          console.log(`[BotExecutor] Trovato: ${setupSh}`);
          const { stdout, stderr } = await execAsync(`bash "${setupSh}"`, {
            cwd: this.repositoryPath,
            timeout: 300000,
          });
          return {
            success: true,
            message: "✅ Setup completato con successo",
            output: stdout,
            executedPath: setupSh,
          };
        }
      }

      // Se il file batch/shell non esiste, prova Python
      const pythonSetup = PATHS_CONFIG.python.setup;
      if (fileExists(pythonSetup)) {
        console.log(`[BotExecutor] Trovato: ${pythonSetup}`);
        const pythonCmd = getPythonCommand();
        const { stdout, stderr } = await execAsync(`${pythonCmd} "${pythonSetup}"`, {
          cwd: this.repositoryPath,
          timeout: 300000,
        });
        return {
          success: true,
          message: "✅ Setup completato con successo",
          output: stdout,
          executedPath: pythonSetup,
        };
      }

      return {
        success: false,
        message: `❌ File setup non trovato in ${this.repositoryPath}`,
        error: `Cercato: ${PATHS_CONFIG.batch.setup} o ${PATHS_CONFIG.python.setup}`,
      };
    } catch (error: any) {
      console.error("[BotExecutor] Errore setup:", error);
      return {
        success: false,
        message: "❌ Errore durante l'esecuzione del setup",
        error: error.message,
      };
    }
  }

  /**
   * Avvia il bot di trading
   */
  async startBot(): Promise<BotExecutionResult> {
    try {
      console.log(`[BotExecutor] Avvio bot dal repository: ${this.repositoryPath}`);

      // Prova a eseguire il file batch/shell
      if (this.isWindows) {
        const runBotBat = PATHS_CONFIG.batch.runBot;
        if (fileExists(runBotBat)) {
          console.log(`[BotExecutor] Trovato: ${runBotBat}`);
          const { stdout, stderr } = await execAsync(`"${runBotBat}"`, {
            cwd: this.repositoryPath,
            timeout: 600000, // 10 minuti
          });
          return {
            success: true,
            message: "✅ Bot avviato con successo",
            output: stdout,
            executedPath: runBotBat,
          };
        }
      } else {
        const runBotSh = PATHS_CONFIG.shell.runBot;
        if (fileExists(runBotSh)) {
          console.log(`[BotExecutor] Trovato: ${runBotSh}`);
          const { stdout, stderr } = await execAsync(`bash "${runBotSh}"`, {
            cwd: this.repositoryPath,
            timeout: 600000,
          });
          return {
            success: true,
            message: "✅ Bot avviato con successo",
            output: stdout,
            executedPath: runBotSh,
          };
        }
      }

      // Se il file batch/shell non esiste, prova Python
      const pythonRunBot = PATHS_CONFIG.python.runBot;
      if (fileExists(pythonRunBot)) {
        console.log(`[BotExecutor] Trovato: ${pythonRunBot}`);
        const pythonCmd = getPythonCommand();
        const { stdout, stderr } = await execAsync(`${pythonCmd} "${pythonRunBot}"`, {
          cwd: this.repositoryPath,
          timeout: 600000,
        });
        return {
          success: true,
          message: "✅ Bot avviato con successo",
          output: stdout,
          executedPath: pythonRunBot,
        };
      }

      return {
        success: false,
        message: `❌ File bot non trovato in ${this.repositoryPath}`,
        error: `Cercato: ${PATHS_CONFIG.batch.runBot} o ${PATHS_CONFIG.python.runBot}`,
      };
    } catch (error: any) {
      console.error("[BotExecutor] Errore avvio bot:", error);
      return {
        success: false,
        message: "❌ Errore durante l'avvio del bot",
        error: error.message,
      };
    }
  }

  /**
   * Esegui il backtesting
   */
  async runBacktest(): Promise<BotExecutionResult> {
    try {
      console.log(`[BotExecutor] Esecuzione backtesting dal repository: ${this.repositoryPath}`);

      // Prova a eseguire il file batch/shell
      if (this.isWindows) {
        const backtestBat = PATHS_CONFIG.batch.backtest;
        if (fileExists(backtestBat)) {
          console.log(`[BotExecutor] Trovato: ${backtestBat}`);
          const { stdout, stderr } = await execAsync(`"${backtestBat}"`, {
            cwd: this.repositoryPath,
            timeout: 600000, // 10 minuti
          });
          return {
            success: true,
            message: "✅ Backtesting completato con successo",
            output: stdout,
            executedPath: backtestBat,
          };
        }
      } else {
        const backtestSh = PATHS_CONFIG.shell.backtest;
        if (fileExists(backtestSh)) {
          console.log(`[BotExecutor] Trovato: ${backtestSh}`);
          const { stdout, stderr } = await execAsync(`bash "${backtestSh}"`, {
            cwd: this.repositoryPath,
            timeout: 600000,
          });
          return {
            success: true,
            message: "✅ Backtesting completato con successo",
            output: stdout,
            executedPath: backtestSh,
          };
        }
      }

      // Se il file batch/shell non esiste, prova Python
      const pythonBacktest = PATHS_CONFIG.python.backtest;
      if (fileExists(pythonBacktest)) {
        console.log(`[BotExecutor] Trovato: ${pythonBacktest}`);
        const pythonCmd = getPythonCommand();
        const { stdout, stderr } = await execAsync(`${pythonCmd} "${pythonBacktest}"`, {
          cwd: this.repositoryPath,
          timeout: 600000,
        });
        return {
          success: true,
          message: "✅ Backtesting completato con successo",
          output: stdout,
          executedPath: pythonBacktest,
        };
      }

      return {
        success: false,
        message: `❌ File backtesting non trovato in ${this.repositoryPath}`,
        error: `Cercato: ${PATHS_CONFIG.batch.backtest} o ${PATHS_CONFIG.python.backtest}`,
      };
    } catch (error: any) {
      console.error("[BotExecutor] Errore backtesting:", error);
      return {
        success: false,
        message: "❌ Errore durante l'esecuzione del backtesting",
        error: error.message,
      };
    }
  }

  /**
   * Avvia la dashboard
   */
  async startDashboard(): Promise<BotExecutionResult> {
    try {
      console.log(`[BotExecutor] Avvio dashboard dal repository: ${this.repositoryPath}`);

      // Prova a eseguire il file batch/shell
      if (this.isWindows) {
        const dashboardBat = PATHS_CONFIG.batch.dashboard;
        if (fileExists(dashboardBat)) {
          console.log(`[BotExecutor] Trovato: ${dashboardBat}`);
          const { stdout, stderr } = await execAsync(`"${dashboardBat}"`, {
            cwd: this.repositoryPath,
            timeout: 300000,
          });
          return {
            success: true,
            message: "✅ Dashboard avviata con successo",
            output: stdout,
            executedPath: dashboardBat,
          };
        }
      } else {
        const dashboardSh = PATHS_CONFIG.shell.dashboard;
        if (fileExists(dashboardSh)) {
          console.log(`[BotExecutor] Trovato: ${dashboardSh}`);
          const { stdout, stderr } = await execAsync(`bash "${dashboardSh}"`, {
            cwd: this.repositoryPath,
            timeout: 300000,
          });
          return {
            success: true,
            message: "✅ Dashboard avviata con successo",
            output: stdout,
            executedPath: dashboardSh,
          };
        }
      }

      // Se il file batch/shell non esiste, prova Python
      const pythonDashboard = PATHS_CONFIG.python.dashboard;
      if (fileExists(pythonDashboard)) {
        console.log(`[BotExecutor] Trovato: ${pythonDashboard}`);
        const pythonCmd = getPythonCommand();
        const { stdout, stderr } = await execAsync(`${pythonCmd} "${pythonDashboard}"`, {
          cwd: this.repositoryPath,
          timeout: 300000,
        });
        return {
          success: true,
          message: "✅ Dashboard avviata con successo",
          output: stdout,
          executedPath: pythonDashboard,
        };
      }

      return {
        success: false,
        message: `❌ File dashboard non trovato in ${this.repositoryPath}`,
        error: `Cercato: ${PATHS_CONFIG.batch.dashboard} o ${PATHS_CONFIG.python.dashboard}`,
      };
    } catch (error: any) {
      console.error("[BotExecutor] Errore dashboard:", error);
      return {
        success: false,
        message: "❌ Errore durante l'avvio della dashboard",
        error: error.message,
      };
    }
  }

  /**
   * Ottieni il percorso del repository
   */
  getRepositoryPath(): string {
    return this.repositoryPath;
  }

  /**
   * Verifica se il repository esiste
   */
  repositoryExists(): boolean {
    return fs.existsSync(this.repositoryPath);
  }

  /**
   * Ottieni la lista dei file nel repository
   */
  getRepositoryFiles(): string[] {
    try {
      if (!this.repositoryExists()) {
        return [];
      }
      return fs.readdirSync(this.repositoryPath);
    } catch (error) {
      console.error("[BotExecutor] Errore lettura repository:", error);
      return [];
    }
  }
}

// Singleton instance
let executorInstance: BotExecutor | null = null;

export function getBotExecutor(): BotExecutor {
  if (!executorInstance) {
    executorInstance = new BotExecutor();
  }
  return executorInstance;
}

export default BotExecutor;

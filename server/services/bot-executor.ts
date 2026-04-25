import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import {
  PATHS_CONFIG,
  fileExists,
  getPythonCommand,
} from "../config/paths.config";
import {
  broadcastBotStatus,
  broadcastMetrics,
  broadcastTradeExecuted,
} from "../_core/websocket";

const execAsync = promisify(exec);

export interface BotExecutionResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
  executedPath?: string;
}

// ─── Data directory setup ──────────────────────────────────────────────────
function ensureDataDir() {
  const dataDir = PATHS_CONFIG.folders.data;
  const logsDir = PATHS_CONFIG.folders.logs;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
}

// ─── Polling: legge i JSON scritti dal Python e li trasmette via WebSocket ─
let pollInterval: ReturnType<typeof setInterval> | null = null;
let lastMetricsHash = "";
let lastTradesHash = "";

function startDataPolling() {
  if (pollInterval) return; // già attivo
  ensureDataDir();

  pollInterval = setInterval(() => {
    // Leggi metrics.json
    try {
      if (fileExists(PATHS_CONFIG.data.metrics)) {
        const raw = fs.readFileSync(PATHS_CONFIG.data.metrics, "utf-8");
        if (raw && raw !== lastMetricsHash) {
          lastMetricsHash = raw;
          const metrics = JSON.parse(raw);
          broadcastMetrics(metrics);
        }
      }
    } catch (e) {
      // file corrotto o in scrittura — ignora questo ciclo
    }

    // Leggi trades.json
    try {
      if (fileExists(PATHS_CONFIG.data.trades)) {
        const raw = fs.readFileSync(PATHS_CONFIG.data.trades, "utf-8");
        if (raw && raw !== lastTradesHash) {
          lastTradesHash = raw;
          const data = JSON.parse(raw);
          // Trasmetti solo l'ultimo trade aggiunto
          if (Array.isArray(data) && data.length > 0) {
            broadcastTradeExecuted(data[data.length - 1]);
          }
        }
      }
    } catch (e) {
      // file corrotto — ignora
    }
  }, 2000); // ogni 2 secondi
}

function stopDataPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    lastMetricsHash = "";
    lastTradesHash = "";
  }
}

// ─── BotExecutor ──────────────────────────────────────────────────────────
class BotExecutor {
  private isWindows = process.platform === "win32";
  private repositoryPath = PATHS_CONFIG.repositoryRoot;
  private botProcess: ChildProcess | null = null;
  private startTime: number | null = null;

  // ── Setup ──────────────────────────────────────────────────────────────
  async runSetup(): Promise<BotExecutionResult> {
    try {
      console.log(`[BotExecutor] Setup dal repository: ${this.repositoryPath}`);
      ensureDataDir();

      const pythonCmd = getPythonCommand();
      const setupScript = PATHS_CONFIG.python.setup;

      if (fileExists(setupScript)) {
        console.log(`[BotExecutor] Trovato: ${setupScript}`);
        const { stdout } = await execAsync(
          `"${pythonCmd}" "${setupScript}"`,
          { cwd: this.repositoryPath, timeout: 300_000 }
        );
        return {
          success: true,
          message: "✅ Setup completato con successo",
          output: stdout,
          executedPath: setupScript,
        };
      }

      // Fallback: batch/shell
      if (this.isWindows && fileExists(PATHS_CONFIG.batch.setup)) {
        const { stdout } = await execAsync(`"${PATHS_CONFIG.batch.setup}"`, {
          cwd: this.repositoryPath,
          timeout: 300_000,
        });
        return { success: true, message: "✅ Setup completato", output: stdout };
      }
      if (!this.isWindows && fileExists(PATHS_CONFIG.shell.setup)) {
        const { stdout } = await execAsync(
          `bash "${PATHS_CONFIG.shell.setup}"`,
          { cwd: this.repositoryPath, timeout: 300_000 }
        );
        return { success: true, message: "✅ Setup completato", output: stdout };
      }

      return {
        success: false,
        message: `❌ File setup non trovato in ${this.repositoryPath}`,
        error: `Cercato: ${setupScript}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Errore durante il setup",
        error: error.message,
      };
    }
  }

  // ── Avvia bot ──────────────────────────────────────────────────────────
  async startBot(): Promise<BotExecutionResult> {
    if (this.botProcess) {
      return { success: false, message: "⚠️ Bot già in esecuzione" };
    }

    try {
      console.log(`[BotExecutor] Avvio bot: ${this.repositoryPath}`);
      ensureDataDir();

      const pythonCmd = getPythonCommand();
      let command = "";
      let args: string[] = [];
      let executedPath = "";

      if (fileExists(PATHS_CONFIG.python.runBot)) {
        command = pythonCmd;
        args = [PATHS_CONFIG.python.runBot];
        executedPath = PATHS_CONFIG.python.runBot;
      } else if (this.isWindows && fileExists(PATHS_CONFIG.batch.runBot)) {
        command = "cmd";
        args = ["/c", PATHS_CONFIG.batch.runBot];
        executedPath = PATHS_CONFIG.batch.runBot;
      } else if (!this.isWindows && fileExists(PATHS_CONFIG.shell.runBot)) {
        command = "bash";
        args = [PATHS_CONFIG.shell.runBot];
        executedPath = PATHS_CONFIG.shell.runBot;
      } else {
        return {
          success: false,
          message: `❌ Script bot non trovato in ${this.repositoryPath}`,
          error: `Cercato: ${PATHS_CONFIG.python.runBot}`,
        };
      }

      this.botProcess = spawn(command, args, {
        cwd: this.repositoryPath,
        env: { ...process.env, DATA_DIR: PATHS_CONFIG.folders.data },
        stdio: ["ignore", "pipe", "pipe"],
      });

      this.startTime = Date.now();

      // Logga stdout del bot
      this.botProcess.stdout?.on("data", (data) => {
        process.stdout.write(`[Bot] ${data}`);
      });
      this.botProcess.stderr?.on("data", (data) => {
        process.stderr.write(`[Bot ERR] ${data}`);
      });

      this.botProcess.on("exit", (code) => {
        console.log(`[BotExecutor] Bot uscito con codice: ${code}`);
        this.botProcess = null;
        this.startTime = null;
        stopDataPolling();
        broadcastBotStatus({
          running: false,
          uptime: "0h 0m",
          tradesCount: 0,
          portfolioValue: 10000,
          totalReturn: 0,
          winRate: 0,
        });
      });

      // Avvia polling file JSON → WebSocket
      startDataPolling();

      broadcastBotStatus({
        running: true,
        uptime: "0h 0m",
        tradesCount: 0,
        portfolioValue: 10000,
        totalReturn: 0,
        winRate: 0,
      });

      return {
        success: true,
        message: "🚀 Bot avviato con successo",
        executedPath,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Errore durante l'avvio del bot",
        error: error.message,
      };
    }
  }

  // ── Ferma bot ──────────────────────────────────────────────────────────
  async stopBot(): Promise<BotExecutionResult> {
    if (!this.botProcess) {
      return { success: false, message: "⚠️ Bot non in esecuzione" };
    }
    try {
      this.botProcess.kill("SIGTERM");
      this.botProcess = null;
      this.startTime = null;
      stopDataPolling();
      broadcastBotStatus({
        running: false,
        uptime: "0h 0m",
        tradesCount: 0,
        portfolioValue: 10000,
        totalReturn: 0,
        winRate: 0,
      });
      return { success: true, message: "⏹️ Bot fermato con successo" };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Errore durante l'arresto del bot",
        error: error.message,
      };
    }
  }

  // ── Backtest ───────────────────────────────────────────────────────────
  async runBacktest(): Promise<BotExecutionResult> {
    try {
      console.log(`[BotExecutor] Backtest: ${this.repositoryPath}`);
      ensureDataDir();

      const pythonCmd = getPythonCommand();
      const backtestScript = PATHS_CONFIG.python.backtest;

      if (fileExists(backtestScript)) {
        const { stdout } = await execAsync(
          `"${pythonCmd}" "${backtestScript}"`,
          { cwd: this.repositoryPath, timeout: 600_000 }
        );
        return {
          success: true,
          message: "✅ Backtesting completato",
          output: stdout,
          executedPath: backtestScript,
        };
      }

      return {
        success: false,
        message: `❌ Script backtest non trovato`,
        error: `Cercato: ${backtestScript}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Errore durante il backtest",
        error: error.message,
      };
    }
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  async startDashboard(): Promise<BotExecutionResult> {
    try {
      const dashboardScript = PATHS_CONFIG.python.dashboard;
      const pythonCmd = getPythonCommand();

      if (fileExists(dashboardScript)) {
        const { stdout } = await execAsync(
          `"${pythonCmd}" "${dashboardScript}"`,
          { cwd: this.repositoryPath, timeout: 300_000 }
        );
        return { success: true, message: "✅ Dashboard avviata", output: stdout };
      }

      return {
        success: false,
        message: "❌ File dashboard non trovato",
        error: `Cercato: ${dashboardScript}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Errore avvio dashboard",
        error: error.message,
      };
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────
  getStatus() {
    const uptime = this.startTime
      ? Math.floor((Date.now() - this.startTime) / 60_000)
      : 0;
    const hours = Math.floor(uptime / 60);
    const minutes = uptime % 60;
    return {
      running: !!this.botProcess,
      uptime: `${hours}h ${minutes}m`,
      startTime: this.startTime,
    };
  }

  getRepositoryPath(): string {
    return this.repositoryPath;
  }

  repositoryExists(): boolean {
    return fs.existsSync(this.repositoryPath);
  }

  getRepositoryFiles(): string[] {
    try {
      if (!this.repositoryExists()) return [];
      return fs.readdirSync(this.repositoryPath);
    } catch {
      return [];
    }
  }
}

// Singleton
let executorInstance: BotExecutor | null = null;

export function getBotExecutor(): BotExecutor {
  if (!executorInstance) executorInstance = new BotExecutor();
  return executorInstance;
}

export default BotExecutor;

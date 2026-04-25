import { ChildProcess, exec, spawn } from "child_process";
import fs from "fs";
import { promisify } from "util";
import {
  PATHS_CONFIG,
  fileExists,
  getPythonCommand,
} from "../config/paths.config";
import {
  broadcastBotStatus,
  broadcastMetrics,
  broadcastTradeExecuted,
  broadcastTradesSnapshot,
} from "../_core/websocket";

const execAsync = promisify(exec);

export interface BotExecutionResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
  executedPath?: string;
}

function ensureRuntimeDirectories() {
  const dataDir = PATHS_CONFIG.folders.data;
  const logsDir = PATHS_CONFIG.folders.logs;

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fileExists(filePath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

let pollInterval: ReturnType<typeof setInterval> | null = null;
let lastMetricsHash = "";
let lastTradesHash = "";

function startDataPolling() {
  if (pollInterval) {
    return;
  }

  ensureRuntimeDirectories();

  pollInterval = setInterval(() => {
    try {
      if (fileExists(PATHS_CONFIG.data.metrics)) {
        const rawMetrics = fs.readFileSync(PATHS_CONFIG.data.metrics, "utf-8");
        if (rawMetrics && rawMetrics !== lastMetricsHash) {
          lastMetricsHash = rawMetrics;
          broadcastMetrics(JSON.parse(rawMetrics));
        }
      }
    } catch {
      // Ignore partial writes from the Python process.
    }

    try {
      if (fileExists(PATHS_CONFIG.data.trades)) {
        const rawTrades = fs.readFileSync(PATHS_CONFIG.data.trades, "utf-8");
        if (rawTrades && rawTrades !== lastTradesHash) {
          lastTradesHash = rawTrades;
          const trades = JSON.parse(rawTrades);
          if (Array.isArray(trades)) {
            const snapshot = trades.slice(-50).reverse();
            broadcastTradesSnapshot(snapshot);
            if (snapshot.length > 0) {
              broadcastTradeExecuted(snapshot[0]);
            }
          }
        }
      }
    } catch {
      // Ignore partial writes from the Python process.
    }
  }, 2000);
}

function stopDataPolling() {
  if (!pollInterval) {
    return;
  }

  clearInterval(pollInterval);
  pollInterval = null;
  lastMetricsHash = "";
  lastTradesHash = "";
}

class BotExecutor {
  private readonly isWindows = process.platform === "win32";
  private readonly repositoryPath = PATHS_CONFIG.repositoryRoot;
  private botProcess: ChildProcess | null = null;
  private startTime: number | null = null;

  private getBroadcastStatus(running: boolean) {
    const metrics = readJsonFile<Record<string, number>>(PATHS_CONFIG.data.metrics);
    const trades = readJsonFile<any[]>(PATHS_CONFIG.data.trades);
    const uptimeMinutes = this.startTime
      ? Math.floor((Date.now() - this.startTime) / 60_000)
      : 0;

    return {
      running,
      uptime: `${Math.floor(uptimeMinutes / 60)}h ${uptimeMinutes % 60}m`,
      tradesCount: Array.isArray(trades) ? trades.length : 0,
      portfolioValue: Number(metrics?.portfolioValue ?? 10000),
      totalReturn: Number(metrics?.totalReturn ?? 0),
      winRate: Number(metrics?.winRate ?? 0),
    };
  }

  private resetRunningState() {
    this.botProcess = null;
    this.startTime = null;
    stopDataPolling();
    broadcastBotStatus(this.getBroadcastStatus(false));
  }

  private async executeScript(
    command: string,
    args: string[],
    executedPath: string,
    timeoutMs: number,
    successMessage: string,
    failureMessage: string
  ): Promise<BotExecutionResult> {
    try {
      ensureRuntimeDirectories();
      const { stdout, stderr } = await execAsync(
        `"${command}" ${args.map((arg) => `"${arg}"`).join(" ")}`,
        {
          cwd: this.repositoryPath,
          env: {
            ...process.env,
            DATA_DIR: PATHS_CONFIG.folders.data,
          },
          timeout: timeoutMs,
        }
      );

      return {
        success: true,
        message: successMessage,
        output: stdout || stderr,
        executedPath,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore sconosciuto";
      return {
        success: false,
        message: failureMessage,
        error: message,
        executedPath,
      };
    }
  }

  private resolveScriptPaths(scriptType: "setup" | "runBot" | "backtest" | "dashboard") {
    return {
      python: PATHS_CONFIG.python[scriptType],
      batch: PATHS_CONFIG.batch[scriptType],
      shell: PATHS_CONFIG.shell[scriptType],
    };
  }

  async runSetup(): Promise<BotExecutionResult> {
    console.log(`[BotExecutor] Setup in ${this.repositoryPath}`);

    const paths = this.resolveScriptPaths("setup");
    const pythonCmd = getPythonCommand();

    if (fileExists(paths.python)) {
      return this.executeScript(
        pythonCmd,
        [paths.python],
        paths.python,
        300_000,
        "Setup completato con successo.",
        "Errore durante il setup."
      );
    }

    if (this.isWindows && fileExists(paths.batch)) {
      return this.executeScript(
        "cmd",
        ["/c", paths.batch],
        paths.batch,
        300_000,
        "Setup completato con successo.",
        "Errore durante il setup."
      );
    }

    if (!this.isWindows && fileExists(paths.shell)) {
      return this.executeScript(
        "bash",
        [paths.shell],
        paths.shell,
        300_000,
        "Setup completato con successo.",
        "Errore durante il setup."
      );
    }

    return {
      success: false,
      message: "File di setup non trovato.",
      error: `Percorso atteso: ${paths.python}`,
    };
  }

  async startBot(): Promise<BotExecutionResult> {
    if (this.botProcess) {
      return {
        success: false,
        message: "Il bot risulta gia in esecuzione.",
      };
    }

    ensureRuntimeDirectories();

    const paths = this.resolveScriptPaths("runBot");
    const pythonCmd = getPythonCommand();
    let command = "";
    let args: string[] = [];
    let executedPath = "";

    if (fileExists(paths.python)) {
      command = pythonCmd;
      args = [paths.python];
      executedPath = paths.python;
    } else if (this.isWindows && fileExists(paths.batch)) {
      command = "cmd";
      args = ["/c", paths.batch];
      executedPath = paths.batch;
    } else if (!this.isWindows && fileExists(paths.shell)) {
      command = "bash";
      args = [paths.shell];
      executedPath = paths.shell;
    } else {
      return {
        success: false,
        message: "Script del bot non trovato.",
        error: `Percorso atteso: ${paths.python}`,
      };
    }

    try {
      const processRef = spawn(command, args, {
        cwd: this.repositoryPath,
        env: {
          ...process.env,
          DATA_DIR: PATHS_CONFIG.folders.data,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      this.botProcess = processRef;

      const stdoutBuffer: string[] = [];
      const stderrBuffer: string[] = [];

      processRef.stdout?.on("data", (chunk) => {
        const text = chunk.toString();
        stdoutBuffer.push(text);
        process.stdout.write(`[Bot] ${text}`);
      });

      processRef.stderr?.on("data", (chunk) => {
        const text = chunk.toString();
        stderrBuffer.push(text);
        process.stderr.write(`[Bot ERR] ${text}`);
      });

      return await new Promise<BotExecutionResult>((resolve) => {
        let started = false;

        const startupTimer = setTimeout(() => {
          started = true;
          this.startTime = Date.now();
          startDataPolling();
          broadcastBotStatus(this.getBroadcastStatus(true));

          resolve({
            success: true,
            message: "Bot avviato con successo.",
            executedPath,
            output: stdoutBuffer.join(""),
          });
        }, 1500);

        processRef.once("error", (error) => {
          clearTimeout(startupTimer);
          if (started) {
            return;
          }

          this.resetRunningState();
          resolve({
            success: false,
            message: "Errore durante l'avvio del bot.",
            error: error.message,
            executedPath,
          });
        });

        processRef.once("exit", (code) => {
          clearTimeout(startupTimer);
          const output = stderrBuffer.join("").trim() || stdoutBuffer.join("").trim();

          if (!started) {
            this.resetRunningState();
            resolve({
              success: false,
              message: "Il bot si e chiuso subito dopo l'avvio.",
              error: output || `Processo terminato con codice ${code ?? "sconosciuto"}`,
              executedPath,
            });
            return;
          }

          console.log(`[BotExecutor] Bot terminato con codice ${code}`);
          this.resetRunningState();
        });
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore sconosciuto";
      this.resetRunningState();
      return {
        success: false,
        message: "Errore durante l'avvio del bot.",
        error: message,
        executedPath,
      };
    }
  }

  async stopBot(): Promise<BotExecutionResult> {
    if (!this.botProcess) {
      return {
        success: false,
        message: "Il bot non e in esecuzione.",
      };
    }

    try {
      if (this.isWindows && this.botProcess.pid) {
        await execAsync(`taskkill /pid ${this.botProcess.pid} /t /f`);
      } else {
        this.botProcess.kill("SIGTERM");
      }

      this.resetRunningState();

      return {
        success: true,
        message: "Bot fermato con successo.",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore sconosciuto";
      return {
        success: false,
        message: "Errore durante l'arresto del bot.",
        error: message,
      };
    }
  }

  async runBacktest(): Promise<BotExecutionResult> {
    console.log(`[BotExecutor] Backtest in ${this.repositoryPath}`);

    const paths = this.resolveScriptPaths("backtest");
    const pythonCmd = getPythonCommand();

    if (fileExists(paths.python)) {
      return this.executeScript(
        pythonCmd,
        [paths.python],
        paths.python,
        600_000,
        "Backtest completato.",
        "Errore durante il backtest."
      );
    }

    if (!this.isWindows && fileExists(paths.shell)) {
      return this.executeScript(
        "bash",
        [paths.shell],
        paths.shell,
        600_000,
        "Backtest completato.",
        "Errore durante il backtest."
      );
    }

    if (this.isWindows && fileExists(paths.batch)) {
      return this.executeScript(
        "cmd",
        ["/c", paths.batch],
        paths.batch,
        600_000,
        "Backtest completato.",
        "Errore durante il backtest."
      );
    }

    return {
      success: false,
      message: "Script di backtest non trovato.",
      error: `Percorso atteso: ${paths.python}`,
    };
  }

  async startDashboard(): Promise<BotExecutionResult> {
    const paths = this.resolveScriptPaths("dashboard");
    const pythonCmd = getPythonCommand();

    if (fileExists(paths.python)) {
      return this.executeScript(
        pythonCmd,
        [paths.python],
        paths.python,
        120_000,
        "Dashboard Python avviata.",
        "Errore durante l'avvio della dashboard."
      );
    }

    return {
      success: true,
      message: "Dashboard web disponibile su /dashboard.",
      output: "Apri la dashboard React dal percorso /dashboard.",
    };
  }

  getStatus() {
    const uptimeMinutes = this.startTime
      ? Math.floor((Date.now() - this.startTime) / 60_000)
      : 0;

    return {
      running: Boolean(this.botProcess),
      uptime: `${Math.floor(uptimeMinutes / 60)}h ${uptimeMinutes % 60}m`,
      startTime: this.startTime,
    };
  }

  getRepositoryPath() {
    return this.repositoryPath;
  }

  repositoryExists() {
    return (
      fs.existsSync(this.repositoryPath) &&
      fs.existsSync(PATHS_CONFIG.folders.botAi)
    );
  }

  getRepositoryFiles() {
    try {
      if (!this.repositoryExists()) {
        return [];
      }

      return fs
        .readdirSync(this.repositoryPath)
        .filter((entry) => entry !== "node_modules")
        .sort();
    } catch {
      return [];
    }
  }
}

let executorInstance: BotExecutor | null = null;

export function getBotExecutor() {
  if (!executorInstance) {
    executorInstance = new BotExecutor();
  }

  return executorInstance;
}

export default BotExecutor;

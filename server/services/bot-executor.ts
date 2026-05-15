import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import {
  DEFAULT_BACKTEST_SYMBOLS,
  DEFAULT_LIVE_SYMBOLS,
  normalizeSymbolList,
} from "../../shared/trading";
import {
  broadcastBacktestComplete,
  broadcastBacktestProgress,
  broadcastBotStatus,
  broadcastMetrics,
  broadcastTradeExecuted,
  broadcastTradesSnapshot,
} from "../_core/websocket";
import { HEROFX_CONFIG } from "../config/herofx.config";
import {
  PATHS_CONFIG,
  fileExists,
  getPythonCommand,
} from "../config/paths.config";

export interface BotExecutionResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
  executedPath?: string;
  data?: unknown;
}

interface StartBotOptions {
  symbols?: string[];
}

interface BacktestOptions {
  symbols?: string[];
  years?: number;
  capital?: number;
}

interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

interface StartupResult {
  ok: boolean;
  error?: Error;
  code?: number | null;
  signal?: NodeJS.Signals | null;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;
let lastMetricsRaw = "";
let lastTradesRaw = "";

function ensureRuntimeDirs() {
  for (const directory of [
    PATHS_CONFIG.folders.data,
    PATHS_CONFIG.folders.logs,
    PATHS_CONFIG.folders.reports,
  ]) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
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

function startDataPolling() {
  if (pollInterval) {
    return;
  }

  ensureRuntimeDirs();
  const initialTrades = readJsonFile<unknown[]>(PATHS_CONFIG.data.trades) ?? [];
  if (initialTrades.length > 0) {
    broadcastTradesSnapshot(initialTrades);
  }

  const initialMetrics = readJsonFile<Record<string, unknown>>(
    PATHS_CONFIG.data.metrics
  );
  if (initialMetrics) {
    broadcastMetrics(initialMetrics);
  }

  pollInterval = setInterval(() => {
    try {
      if (fileExists(PATHS_CONFIG.data.metrics)) {
        const rawMetrics = fs.readFileSync(PATHS_CONFIG.data.metrics, "utf-8");
        if (rawMetrics && rawMetrics !== lastMetricsRaw) {
          lastMetricsRaw = rawMetrics;
          const metrics = JSON.parse(rawMetrics);
          broadcastMetrics(metrics);
        }
      }
    } catch {
      // Ignore partial writes.
    }

    try {
      if (fileExists(PATHS_CONFIG.data.trades)) {
        const rawTrades = fs.readFileSync(PATHS_CONFIG.data.trades, "utf-8");
        if (rawTrades && rawTrades !== lastTradesRaw) {
          lastTradesRaw = rawTrades;
          const trades = JSON.parse(rawTrades);
          if (Array.isArray(trades)) {
            broadcastTradesSnapshot(trades.slice(-200));
            if (trades.length > 0) {
              broadcastTradeExecuted(trades[trades.length - 1]);
            }
          }
        }
      }
    } catch {
      // Ignore partial writes.
    }
  }, 2000);
}

function stopDataPolling() {
  if (!pollInterval) {
    return;
  }

  clearInterval(pollInterval);
  pollInterval = null;
  lastMetricsRaw = "";
  lastTradesRaw = "";
}

function buildStoppedStatus() {
  return {
    running: false,
    uptime: "0h 0m",
    tradesCount: 0,
    portfolioValue: HEROFX_CONFIG.backtesting.initialBalance,
    totalReturn: 0,
    winRate: 0,
    activeSymbols: [],
  };
}

function tailOutput(value: string, maxLength = 4000): string {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(value.length - maxLength);
}

function extractFatalMessage(stdout: string, stderr: string): string | null {
  const combinedOutput = `${stderr}\n${stdout}`;
  const fatalMatch = combinedOutput.match(/Fatal bot error:\s*([^\r\n]+)/);
  return fatalMatch?.[1]?.trim() || null;
}

function waitForProcessStartup(
  child: ChildProcess,
  timeoutMs: number
): Promise<StartupResult> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const finish = (result: StartupResult) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      child.off("error", onError);
      child.off("exit", onExit);
      resolve(result);
    };

    const onError = (error: Error) => finish({ ok: false, error });
    const onExit = (code: number | null, signal: NodeJS.Signals | null) =>
      finish({ ok: false, code, signal });

    timer = setTimeout(() => finish({ ok: true }), timeoutMs);

    child.once("error", onError);
    child.once("exit", onExit);
  });
}

async function executeCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  timeoutMs: number
): Promise<CommandResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: PATHS_CONFIG.repositoryRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill();
      reject(new Error(`Timeout dopo ${timeoutMs} ms`));
    }, timeoutMs);

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

class BotExecutor {
  private botProcess: ChildProcess | null = null;
  private startTime: number | null = null;
  private activeSymbols = [...DEFAULT_LIVE_SYMBOLS];

  async runSetup(): Promise<BotExecutionResult> {
    try {
      ensureRuntimeDirs();
      const setupScript = PATHS_CONFIG.python.setup;
      if (!fileExists(setupScript)) {
        return {
          success: false,
          message: "Script setup non trovato",
          error: setupScript,
        };
      }

      const result = await executeCommand(
        getPythonCommand(),
        [setupScript],
        {
          ...process.env,
          DATA_DIR: PATHS_CONFIG.folders.data,
          REPO_PATH: PATHS_CONFIG.repositoryRoot,
          PYTHONUNBUFFERED: "1",
        },
        300_000
      );

      if (result.code !== 0) {
        return {
          success: false,
          message: "Errore durante il setup",
          output: result.stdout,
          error: result.stderr || `Exit code ${result.code}`,
          executedPath: setupScript,
        };
      }

      return {
        success: true,
        message: "Setup completato con successo",
        output: result.stdout,
        executedPath: setupScript,
      };
    } catch (error) {
      return {
        success: false,
        message: "Errore durante il setup",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async startBot(options: StartBotOptions = {}): Promise<BotExecutionResult> {
    if (this.botProcess) {
      return {
        success: false,
        message: "Bot gia in esecuzione",
      };
    }

    const symbols = normalizeSymbolList(
      options.symbols,
      HEROFX_CONFIG.defaultLiveSymbols
    );

    if (!fileExists(PATHS_CONFIG.python.runBot)) {
      return {
        success: false,
        message: "Script bot non trovato",
        error: PATHS_CONFIG.python.runBot,
      };
    }

    try {
      ensureRuntimeDirs();
      this.activeSymbols = symbols;
      let startupStdout = "";
      let startupStderr = "";
      const pythonCommand = getPythonCommand();
      const child = spawn(
        pythonCommand,
        [PATHS_CONFIG.python.runBot, "--symbols", ...symbols],
        {
          cwd: PATHS_CONFIG.repositoryRoot,
          env: {
            ...process.env,
            DATA_DIR: PATHS_CONFIG.folders.data,
            BOT_SYMBOLS: symbols.join(","),
            REPO_PATH: PATHS_CONFIG.repositoryRoot,
            PYTHONUNBUFFERED: "1",
          },
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      this.botProcess = child;
      this.startTime = Date.now();

      child.stdout?.setEncoding("utf8");
      child.stderr?.setEncoding("utf8");

      child.stdout?.on("data", (chunk) => {
        startupStdout += String(chunk);
        startupStdout = tailOutput(startupStdout);
        process.stdout.write(`[Bot] ${chunk}`);
      });

      child.stderr?.on("data", (chunk) => {
        startupStderr += String(chunk);
        startupStderr = tailOutput(startupStderr);
        process.stderr.write(`[Bot ERR] ${chunk}`);
      });

      child.on("exit", () => {
        this.botProcess = null;
        this.startTime = null;
        this.activeSymbols = [...DEFAULT_LIVE_SYMBOLS];
        stopDataPolling();
        broadcastBotStatus(buildStoppedStatus());
      });

      const startup = await waitForProcessStartup(child, 2500);
      if (!startup.ok) {
        this.botProcess = null;
        this.startTime = null;
        this.activeSymbols = [...DEFAULT_LIVE_SYMBOLS];
        stopDataPolling();
        broadcastBotStatus(buildStoppedStatus());
        const fatalMessage = extractFatalMessage(startupStdout, startupStderr);

        return {
          success: false,
          message:
            fatalMessage ??
            startup.error?.message ??
            `Il processo Python del bot si e chiuso subito (code ${startup.code ?? "n/a"}, signal ${startup.signal ?? "n/a"})`,
          output: startupStdout,
          error: startupStderr || startup.error?.message,
          executedPath: PATHS_CONFIG.python.runBot,
        };
      }

      startDataPolling();
      broadcastBotStatus({
        ...this.getStatus(),
        tradesCount: 0,
        portfolioValue: HEROFX_CONFIG.backtesting.initialBalance,
        totalReturn: 0,
        winRate: 0,
      });

      return {
        success: true,
        message: `Bot avviato su ${symbols.join(", ")} con ${pythonCommand}`,
        executedPath: PATHS_CONFIG.python.runBot,
        output: startupStdout,
      };
    } catch (error) {
      this.botProcess = null;
      this.startTime = null;
      return {
        success: false,
        message: "Errore durante l'avvio del bot",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async stopBot(): Promise<BotExecutionResult> {
    if (!this.botProcess) {
      return {
        success: false,
        message: "Bot non in esecuzione",
      };
    }

    try {
      this.botProcess.kill();
      this.botProcess = null;
      this.startTime = null;
      this.activeSymbols = [...DEFAULT_LIVE_SYMBOLS];
      stopDataPolling();
      broadcastBotStatus(buildStoppedStatus());
      return {
        success: true,
        message: "Bot fermato con successo",
      };
    } catch (error) {
      return {
        success: false,
        message: "Errore durante lo stop del bot",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async runBacktest(options: BacktestOptions = {}): Promise<BotExecutionResult> {
    const symbols = normalizeSymbolList(
      options.symbols,
      HEROFX_CONFIG.defaultBacktestSymbols
    );
    const years = options.years ?? HEROFX_CONFIG.backtesting.defaultYears;
    const capital =
      options.capital ?? HEROFX_CONFIG.backtesting.initialBalance;

    if (!fileExists(PATHS_CONFIG.python.backtest)) {
      return {
        success: false,
        message: "Script backtest non trovato",
        error: PATHS_CONFIG.python.backtest,
      };
    }

    try {
      ensureRuntimeDirs();
      broadcastBacktestProgress(10);

      const result = await executeCommand(
        getPythonCommand(),
        [
          PATHS_CONFIG.python.backtest,
          "--years",
          String(years),
          "--capital",
          String(capital),
          "--symbols",
          ...symbols,
        ],
        {
          ...process.env,
          DATA_DIR: PATHS_CONFIG.folders.data,
          BACKTEST_SYMBOLS: symbols.join(","),
          REPO_PATH: PATHS_CONFIG.repositoryRoot,
          PYTHONUNBUFFERED: "1",
        },
        600_000
      );

      if (result.code !== 0) {
        return {
          success: false,
          message: "Errore durante il backtest",
          output: result.stdout,
          error: result.stderr || `Exit code ${result.code}`,
          executedPath: PATHS_CONFIG.python.backtest,
        };
      }

      const payload =
        readJsonFile<Record<string, unknown>>(PATHS_CONFIG.data.backtest) ??
        null;

      const trades = Array.isArray(payload?.trades)
        ? (payload?.trades as unknown[])
        : [];

      if (trades.length > 0) {
        broadcastTradesSnapshot(trades);
      }

      broadcastBacktestProgress(100);
      broadcastBacktestComplete(payload ?? { symbols });

      return {
        success: true,
        message: `Backtest completato su ${symbols.join(", ")}`,
        output: result.stdout,
        executedPath: PATHS_CONFIG.python.backtest,
        data: payload,
      };
    } catch (error) {
      return {
        success: false,
        message: "Errore durante il backtest",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async startDashboard(): Promise<BotExecutionResult> {
    if (!fileExists(PATHS_CONFIG.python.dashboard)) {
      return {
        success: false,
        message: "Script dashboard non trovato",
        error: PATHS_CONFIG.python.dashboard,
      };
    }

    try {
      const result = await executeCommand(
        getPythonCommand(),
        [PATHS_CONFIG.python.dashboard],
        {
          ...process.env,
          DATA_DIR: PATHS_CONFIG.folders.data,
          REPO_PATH: PATHS_CONFIG.repositoryRoot,
          PYTHONUNBUFFERED: "1",
        },
        300_000
      );

      if (result.code !== 0) {
        return {
          success: false,
          message: "Errore avvio dashboard",
          output: result.stdout,
          error: result.stderr || `Exit code ${result.code}`,
          executedPath: PATHS_CONFIG.python.dashboard,
        };
      }

      return {
        success: true,
        message: "Dashboard aggiornata",
        output: result.stdout,
        executedPath: PATHS_CONFIG.python.dashboard,
      };
    } catch (error) {
      return {
        success: false,
        message: "Errore avvio dashboard",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getStatus() {
    const uptimeMinutes = this.startTime
      ? Math.floor((Date.now() - this.startTime) / 60_000)
      : 0;
    const hours = Math.floor(uptimeMinutes / 60);
    const minutes = uptimeMinutes % 60;

    return {
      running: Boolean(this.botProcess),
      uptime: `${hours}h ${minutes}m`,
      startTime: this.startTime,
      activeSymbols: this.botProcess ? this.activeSymbols : [],
    };
  }

  getRepositoryPath(): string {
    return PATHS_CONFIG.repositoryRoot;
  }

  repositoryExists(): boolean {
    return fs.existsSync(PATHS_CONFIG.repositoryRoot);
  }

  getRepositoryFiles(): string[] {
    try {
      return this.repositoryExists()
        ? fs.readdirSync(PATHS_CONFIG.repositoryRoot)
        : [];
    } catch {
      return [];
    }
  }

  getRuntimeDiagnostics() {
    return {
      pythonCommand: getPythonCommand(),
      runBotPath: PATHS_CONFIG.python.runBot,
      setupPath: PATHS_CONFIG.python.setup,
      dataDir: PATHS_CONFIG.folders.data,
      logsDir: PATHS_CONFIG.folders.logs,
    };
  }
}

let executorInstance: BotExecutor | null = null;

export function getBotExecutor(): BotExecutor {
  if (!executorInstance) {
    executorInstance = new BotExecutor();
  }

  return executorInstance;
}

export default BotExecutor;

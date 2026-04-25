#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = __dirname;
const BOT_DIR = path.join(PROJECT_ROOT, 'trading-bot-ai');

/**
 * Verifica se un comando è disponibile nel sistema
 */
function isCommandAvailable(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Esegue un comando shell
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\x1b[36m> Eseguendo: ${command} ${args.join(' ')}\x1b[0m`);
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Comando fallito con codice ${code}`));
    });
  });
}

async function main() {
  try {
    console.log('\x1b[32m=== Trading Bot Project - Avvio Unificato ===\x1b[0m\n');

    // Determina il gestore di pacchetti (pnpm o npm)
    const pkgManager = isCommandAvailable('pnpm') ? 'pnpm' : 'npm';
    console.log(`\x1b[33mGestore pacchetti rilevato: ${pkgManager}\x1b[0m`);

    // 1. Verifica cartella bot
    if (!fs.existsSync(BOT_DIR)) {
      console.log('\x1b[33mCartella trading-bot-ai non trovata. Creazione cartella mock...\x1b[0m');
      fs.mkdirSync(BOT_DIR, { recursive: true });
      
      const setupScript = process.platform === 'win32' ? 'setup.bat' : 'setup.sh';
      const runScript = process.platform === 'win32' ? 'run_bot.bat' : 'run_bot.sh';
      
      if (process.platform === 'win32') {
        fs.writeFileSync(path.join(BOT_DIR, setupScript), '@echo off\necho Mock setup complete.');
        fs.writeFileSync(path.join(BOT_DIR, runScript), '@echo off\necho Mock bot running...\nping 127.0.0.1 -n 10 > nul');
      } else {
        fs.writeFileSync(path.join(BOT_DIR, setupScript), '#!/bin/bash\necho Mock setup complete.');
        fs.writeFileSync(path.join(BOT_DIR, runScript), '#!/bin/bash\necho Mock bot running...\nsleep 10');
        fs.chmodSync(path.join(BOT_DIR, setupScript), '755');
        fs.chmodSync(path.join(BOT_DIR, runScript), '755');
      }
    }

    // 2. Installazione dipendenze
    console.log('\n\x1b[34m[1/3] Installazione dipendenze...\x1b[0m');
    const installArgs = ['install'];
    if (pkgManager === 'npm') {
      installArgs.push('--legacy-peer-deps');
    }
    await runCommand(pkgManager, installArgs, { cwd: PROJECT_ROOT });

    // 3. Build del progetto
    console.log('\n\x1b[34m[2/3] Compilazione Frontend e Backend...\x1b[0m');
    await runCommand(pkgManager, ['run', 'build'], { cwd: PROJECT_ROOT });

    // 4. Avvio del server
    console.log('\n\x1b[34m[3/3] Avvio del Server...\x1b[0m');
    console.log('\x1b[32mIl sito sarà disponibile a breve su http://localhost:3000\x1b[0m\n');
    
    // Avviamo il server in modalità produzione
    await runCommand('node', ['dist/index.cjs'], { 
      cwd: PROJECT_ROOT,
      env: { ...process.env, NODE_ENV: 'production' }
    });

  } catch (error) {
    console.error('\n\x1b[31mErrore durante l\'avvio:\x1b[0m', error.message);
    process.exit(1);
  }
}

main();

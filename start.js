#!/usr/bin/env node
/**
 * Trading Bot Project - Universal Launcher
 * Automates Node.js and Python setup, build, and execution.
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const isWin = process.platform === 'win32';

function log(msg) { console.log(`\x1b[36m${msg}\x1b[0m`); }
function ok(msg)  { console.log(`\x1b[32m${msg}\x1b[0m`); }
function err(msg) { console.log(`\x1b[31m${msg}\x1b[0m`); }

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    log(`> ${cmd} ${args.join(' ')}`);
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd: ROOT, ...opts });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
    proc.on('error', reject);
  });
}

function hasBin(cmd) {
  try { execSync(isWin ? `where ${cmd}` : `which ${cmd}`, { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function getPythonCmd() {
  if (hasBin('python')) return 'python';
  if (hasBin('python3')) return 'python3';
  return null;
}

async function main() {
  console.log('\n\x1b[32m==========================================');
  console.log(' Trading Bot Project - Setup & Avvio');
  console.log('==========================================\x1b[0m\n');

  const pythonCmd = getPythonCmd();
  if (!pythonCmd) {
    err("[ERRORE] Python non trovato! Installalo per far girare il bot.");
  }

  // 1. Node.js Dependencies
  const pkg = hasBin('pnpm') ? 'pnpm' : 'npm';
  log(`[1/4] Installazione dipendenze Node.js (${pkg})...`);
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    const installArgs = pkg === 'npm' ? ['install', '--legacy-peer-deps'] : ['install'];
    await run(pkg, installArgs);
  } else {
    ok('      node_modules presente, skip install');
  }

  // 2. Python Dependencies
  if (pythonCmd) {
    log('\n[2/4] Installazione dipendenze Python...');
    const requirementsPath = path.join(ROOT, 'trading-bot-ai', 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      await run(pythonCmd, ['-m', 'pip', 'install', '-r', requirementsPath]);
    } else {
      err('      requirements.txt non trovato in trading-bot-ai/');
    }
  }

  // 3. Build
  log('\n[3/4] Compilazione frontend e backend...');
  await run(pkg, ['run', 'build']);

  // 4. Start
  log('\n[4/4] Avvio sistema completo...');
  ok('\n  Apri il browser sull URL indicato dal server.');
  ok('  Il bot di trading girerà in background.');
  ok('  Premi Ctrl+C per fermare tutto.\n');

  // Start the server which will manage the bot process
  await run('node', ['dist/index.cjs'], {
    env: { ...process.env, NODE_ENV: 'production' }
  });
}

main().catch(e => {
  err(`\nErrore critico: ${e.message}`);
  process.exit(1);
});

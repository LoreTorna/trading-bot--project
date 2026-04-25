#!/usr/bin/env node
/**
 * Trading Bot Project - Universal Launcher
 * Works on Windows, Mac, Linux
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

async function main() {
  console.log('\n\x1b[32m==========================================');
  console.log(' Trading Bot Project - Avvio Unificato');
  console.log('==========================================\x1b[0m\n');

  // Package manager
  const pkg = hasBin('pnpm') ? 'pnpm' : 'npm';
  log(`Package manager: ${pkg}`);

  // 1. Install
  log('\n[1/3] Installazione dipendenze...');
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    const installArgs = pkg === 'npm' ? ['install', '--legacy-peer-deps'] : ['install'];
    await run(pkg, installArgs);
  } else {
    ok('      node_modules presente, skip install');
  }

  // 2. Build
  log('\n[2/3] Compilazione...');
  await run(pkg, ['run', 'build']);

  // 3. Start
  log('\n[3/3] Avvio server...');
  ok('\n  Apri il browser su: http://localhost:3000');
  ok('  Premi Ctrl+C per fermare\n');

  await run('node', ['dist/index.cjs'], {
    env: { ...process.env, NODE_ENV: 'production' }
  });
}

main().catch(e => {
  err(`\nErrore: ${e.message}`);
  process.exit(1);
});

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const child = spawn('D:/Software/DSH/DeepSeek Harness.exe', ['--expose-internals', resolve('scripts/verify-github-preflight.mjs')], { cwd: process.cwd(), windowsHide: true, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('close', code => { process.exitCode = code ?? 1; });

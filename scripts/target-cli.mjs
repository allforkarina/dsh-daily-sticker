import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const home = resolve('.test-runtime/home');
await mkdir(home, { recursive: true });
const program = 'D:/Software/DSH/DeepSeek Harness.exe';
const entry = 'D:/Software/DSH/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js';
const child = spawn(program, ['--expose-internals', entry, ...process.argv.slice(2)], {
  cwd: process.cwd(), windowsHide: true,
  env: { ...process.env, DSH_HOME: home, DSH_DAILY_TEST: '1', ELECTRON_RUN_AS_NODE: '1' }, stdio: ['ignore', 'pipe', 'pipe']
});
const redact = data => data.toString().replace(/([?&]token=)[^\s&"'<>]+/g, '$1[TEST-TOKEN]');
child.stdout.on('data', data => process.stdout.write(redact(data)));
child.stderr.on('data', data => process.stderr.write(redact(data)));
process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('close', code => { process.exitCode = code ?? 1; });

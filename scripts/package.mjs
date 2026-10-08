import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, delimiter } from 'node:path';
await mkdir('dist', { recursive: true });
const pnpm = process.env.PNPM_CLI || 'D:/Software/DSH/resources/runtime/primary-runtime/dependencies/pnpm/bin/pnpm.cjs';
const child = spawn(process.execPath, [pnpm, 'pack', '--pack-destination', 'dist'], { windowsHide: true, stdio: 'inherit', env: { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH || ''}` } });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('close', code => { process.exitCode = code ?? 1; });

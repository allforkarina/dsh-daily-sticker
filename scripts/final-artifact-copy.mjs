import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('.test-runtime/artifacts', { recursive: true });
await copyFile('dist/dsh-daily-learning-0.1.0.tgz', '.test-runtime/artifacts/dsh-daily-learning-0.1.0-final.tgz');

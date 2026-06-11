import { spawn } from 'node:child_process';

const port = process.env.CLIENT_PORT ?? '4000';
const command = process.argv[2] ?? 'dev';

const child = spawn('next', [command, '-p', port], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

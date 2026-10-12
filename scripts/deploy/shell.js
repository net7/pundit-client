const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

// Runs a command without a shell. `capture` returns stdout instead of streaming it.
const run = (cmd, args, { capture = false, cwd = ROOT } = {}) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { cwd, stdio: ['inherit', capture ? 'pipe' : 'inherit', capture ? 'pipe' : 'inherit'] });
  let stdout = '';
  let stderr = '';
  if (capture) {
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
  }
  child.on('error', reject);
  child.on('close', (code) => {
    if (code === 0) resolve(stdout.trim());
    else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}${stderr ? `: ${stderr.trim()}` : ''}`));
  });
});

const commandExists = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0;

module.exports = { ROOT, run, commandExists };

const { run } = require('./shell');

// -X: no extra file attributes, -q: quiet. Run inside dir so manifest.json is at the zip root.
const zipDir = (dir, outFile) => run('zip', ['-r', '-X', '-q', outFile, '.'], { cwd: dir });

module.exports = { zipDir };

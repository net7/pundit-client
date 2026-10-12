const readline = require('readline/promises');

let rl = null;
const getRl = () => {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Ctrl+C at a prompt is caught by readline: hand it to the process handler (cleanup + exit).
    rl.on('SIGINT', () => process.emit('SIGINT'));
  }
  return rl;
};

const ask = async (question) => (await getRl().question(question)).trim();

// Default is No: only an explicit y/yes confirms.
const confirm = async (question) => /^y(es)?$/i.test(await ask(`${question} [y/N] `));

// options: [{ label, value }]. Returns the chosen value, or null for "type a version".
const choose = async (question, options, defaultIndex = 0) => {
  console.log(question);
  options.forEach((o, i) => console.log(`  ${i + 1}) ${o.label}${i === defaultIndex ? ' (default)' : ''}`));
  console.log(`  ${options.length + 1}) type a version`);
  for (;;) {
    const answer = await ask(`Choice [${defaultIndex + 1}]: `);
    const index = answer === '' ? defaultIndex : Number(answer) - 1;
    if (index === options.length) return null;
    if (Number.isInteger(index) && options[index]) return options[index].value;
    console.log('Invalid choice.');
  }
};

const close = () => {
  if (rl) rl.close();
  rl = null;
};

module.exports = { ask, confirm, choose, close };

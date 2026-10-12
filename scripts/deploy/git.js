const { run } = require('./shell');

const git = (...args) => run('git', args, { capture: true });

const assertClean = async () => {
  const status = await git('status', '--porcelain', '--untracked-files=all');
  if (status) throw new Error(`Working tree is not clean:\n${status}`);
};

const assertProdBranch = async () => {
  const branch = await git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch !== 'master') throw new Error(`Prod releases run from master, current branch is ${branch}`);
  await git('fetch', 'origin', 'master');
  const [head, remote] = await Promise.all([git('rev-parse', 'HEAD'), git('rev-parse', 'origin/master')]);
  if (head !== remote) throw new Error('master is not in sync with origin/master (pull or push first)');
};

const tagExists = async (tag) => (await git('tag', '--list', tag)) === tag;

const headCommit = () => git('rev-parse', '--short', 'HEAD');

const restore = (files) => git('checkout', 'HEAD', '--', ...files);

const commitAndTag = async (files, message, tag) => {
  await git('add', '--', ...files);
  await git('commit', '-m', message, '--', ...files);
  await git('tag', '-a', tag, '-m', message);
};

module.exports = {
  assertClean, assertProdBranch, tagExists, headCommit, restore, commitAndTag,
};

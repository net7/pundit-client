// Version rules for releases. Pure functions, no I/O.
//
// prod  = X.Y.Z    (package.json)
// stage = X.Y.Z.N  (scripts/.stage.version, X.Y.Z = package.json at release time)
// Every part is an integer 0..65535 without leading zeros (Chrome manifest rules).

const PARTS = { prod: 3, stage: 4 };
const MAX_PART = 65535;
const PART_RE = /^(0|[1-9]\d*)$/;

const parse = (value, env) => {
  const parts = String(value).split('.');
  const valid = parts.length === PARTS[env]
    && parts.every((p) => PART_RE.test(p) && Number(p) <= MAX_PART);
  if (!valid) {
    throw new Error(`Invalid ${env} version "${value}": expected ${PARTS[env]} integers 0-${MAX_PART} without leading zeros`);
  }
  return parts.map(Number);
};

// Chrome semantics: missing trailing parts count as 0.
const compare = (a, b) => {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
};

const max = (versions) => versions
  .filter(Boolean)
  .reduce((acc, v) => (acc === null || compare(v, acc) > 0 ? v : acc), null);

// The only versions accepted without forcing.
const nextVersions = (env, current, pkgVersion) => {
  if (env === 'prod') {
    const [major, minor, patch] = parse(current, 'prod');
    return [
      [major, minor, patch + 1],
      [major, minor + 1, 0],
      [major + 1, 0, 0],
    ].map((p) => p.join('.'));
  }
  const [major, minor, patch, n] = parse(current, 'stage');
  const base = [major, minor, patch].join('.');
  parse(pkgVersion, 'prod');
  const cmp = compare(pkgVersion, base);
  if (cmp < 0) {
    throw new Error(`package.json version ${pkgVersion} is lower than the stage base ${base}`);
  }
  return [cmp === 0 ? `${base}.${n + 1}` : `${pkgVersion}.0`];
};

// local must equal every available remote; a null remote (e.g. no S3 version.json yet) is skipped.
const checkAgreement = ({ local, store, s3 }) => {
  const known = [local, store, s3].filter(Boolean);
  return {
    agreed: known.every((v) => compare(v, local) === 0),
    current: local,
    highest: max(known),
  };
};

// Hard rules: well-formed, above every remote. Soft rule: one of `allowed`, otherwise forced.
const validateCandidate = (env, candidate, { allowed, remotes }) => {
  try {
    parse(candidate, env);
  } catch (err) {
    return { ok: false, error: err.message };
  }
  const highestRemote = max(remotes);
  if (highestRemote && compare(candidate, highestRemote) <= 0) {
    return { ok: false, error: `Version ${candidate} must be greater than ${highestRemote} (already released)` };
  }
  return { ok: true, forced: !allowed.includes(candidate) };
};

module.exports = {
  PARTS, parse, compare, max, nextVersions, checkAgreement, validateCandidate,
};

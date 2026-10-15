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

// The only versions accepted without forcing, as [{ version, label }].
// Stage X.Y.Z.N tests the upcoming prod X.Y.Z: its base stays until prod
// X.Y.Z is released (package.json >= base), then a new base is chosen.
const nextVersions = (env, { pkgVersion, stageVersion }) => {
  const [major, minor, patch] = parse(pkgVersion, 'prod');
  const bumps = [
    { version: `${major}.${minor}.${patch + 1}`, label: 'patch' },
    { version: `${major}.${minor + 1}.0`, label: 'minor' },
    { version: `${major + 1}.0.0`, label: 'major' },
  ];
  const [sMajor, sMinor, sPatch, n] = parse(stageVersion, 'stage');
  const base = `${sMajor}.${sMinor}.${sPatch}`;
  const baseReleased = compare(base, pkgVersion) <= 0;
  if (env === 'prod') {
    if (baseReleased) return bumps;
    return [
      { version: base, label: `tested on stage as ${stageVersion}` },
      ...bumps.filter((b) => b.version !== base),
    ];
  }
  if (!baseReleased) return [{ version: `${base}.${n + 1}`, label: 'next stage' }];
  return bumps.map((b) => ({ version: `${b.version}.0`, label: `new ${b.label} stage base` }));
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

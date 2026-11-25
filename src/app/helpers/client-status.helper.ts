/**
 * The maintenance status of the client (GET <APP_URL>/api/client-status), format 1:
 *
 *   { "version": 1,
 *     "notices": [{ "id": "maintenance", "active": true, "level": "maintenance",
 *                   "appliesTo": { "maxClientVersion": "1.18.0" } }] }
 *
 * Pure functions: parsing never throws, unknown fields are ignored.
 */

const FORMAT_VERSION = 1;
const MAINTENANCE_LEVEL = 'maintenance';
const VERSION_RE = /^\d+(\.\d+)*$/;

/** A maintenance notice as read from the status. */
export type ParsedNotice = {
  id: string;
  /** null: applies to every client; '' or any other invalid value: treated as null. */
  maxClientVersion: string | null;
};

export type ParsedClientStatus = {
  notices: ParsedNotice[];
};

/** The maintenance notice that applies to this client. */
export type MaintenanceNotice = {
  id: string;
  /** true when the notice targets this client's version: it should update (or reload). */
  outdated: boolean;
};

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const parseNotice = (value: unknown): ParsedNotice | null => {
  if (!isObject(value)) return null;
  const { id, active, level, appliesTo } = value;
  if (typeof id !== 'string' || active !== true || level !== MAINTENANCE_LEVEL) {
    return null;
  }
  let maxClientVersion: string | null = null;
  if (isObject(appliesTo) && 'maxClientVersion' in appliesTo) {
    const max = appliesTo.maxClientVersion;
    maxClientVersion = typeof max === 'string' ? max : '';
  }
  return { id, maxClientVersion };
};

/**
 * The status in the response, or null when the response is not a valid status
 * (another format version, no notices array, not an object).
 */
export const parseClientStatus = (json: unknown): ParsedClientStatus | null => {
  if (!isObject(json) || json.version !== FORMAT_VERSION || !Array.isArray(json.notices)) {
    return null;
  }
  const notices = json.notices
    .map(parseNotice)
    .filter((notice): notice is ParsedNotice => notice !== null);
  return { notices };
};

const isVersion = (value: string | null): value is string => (
  value !== null && VERSION_RE.test(value)
);

/**
 * Whether `client` is up to `max`, compared on the segments `max` has: with "1.18.0", the
 * stage build 1.18.0.1 counts as 1.18.0. Missing segments count as 0.
 */
const isUpTo = (client: string, max: string): boolean => {
  const maxParts = max.split('.').map(Number);
  const clientParts = client.split('.').map(Number);
  for (let i = 0; i < maxParts.length; i += 1) {
    const diff = (clientParts[i] || 0) - maxParts[i];
    if (diff !== 0) return diff < 0;
  }
  return true;
};

/**
 * The notice as it applies to this client, or null when it does not apply. An invalid
 * maxClientVersion, or an unknown client version, applies with the maintenance text: when
 * unsure, a notice is safer than nothing for a client whose API is down.
 */
export const noticeApplies = (
  notice: ParsedNotice,
  clientVersion: string | null
): MaintenanceNotice | null => {
  const { id, maxClientVersion } = notice;
  if (!isVersion(maxClientVersion) || !isVersion(clientVersion)) {
    return { id, outdated: false };
  }
  return isUpTo(clientVersion, maxClientVersion) ? { id, outdated: true } : null;
};

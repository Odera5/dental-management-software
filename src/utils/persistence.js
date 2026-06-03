import { getStoredUser } from "./authStorage";

const STORAGE_KEYS = {
  lastVisitedRoute: "primuxcare:last-visited-route",
};

const INVALID_LAST_ROUTE_PREFIXES = [
  "/",
  "/login",
  "/register-clinic",
  "/verify-email",
  "/support",
  "/billing/paystack/callback",
  "/appointment-response",
  "/intake/",
  "/forgot-password",
  "/reset-password",
  "/waitlist",
];

function canUseStorage(storage) {
  if (!storage) return false;
  try {
    const testKey = "__primuxcare_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getStorage(preferred = "session") {
  if (typeof window === "undefined") return null;

  const session = canUseStorage(window.sessionStorage)
    ? window.sessionStorage
    : null;
  const local = canUseStorage(window.localStorage) ? window.localStorage : null;

  if (preferred === "local") return local || session;
  return session || local;
}

export function readStoredJson(key, fallbackValue, preferred = "session") {
  const storage = getStorage(preferred);
  if (!storage) return fallbackValue;

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function resolveUserRouteScope(userOverride = null) {
  let user = userOverride;

  if (!user) {
    try {
      user = JSON.parse(getStoredUser() || "null");
    } catch {
      user = null;
    }
  }

  const clinicId = user?.clinicId || user?.clinic?.id || "";
  const branchId = user?.branchId || user?.branch?.id || "";
  const userId = user?.id || user?.email || "";

  if (!clinicId && !branchId && !userId) {
    return null;
  }

  return [clinicId || "clinic", branchId || "branch", userId || "user"].join(":");
}

function getLastVisitedRouteKey(userOverride = null) {
  const scope = resolveUserRouteScope(userOverride);
  return scope
    ? `${STORAGE_KEYS.lastVisitedRoute}:${scope}`
    : STORAGE_KEYS.lastVisitedRoute;
}

export function writeStoredJson(key, value, preferred = "session") {
  const storage = getStorage(preferred);
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or storage availability issues.
  }
}

export function removeStoredValue(key, preferred = "session") {
  const storage = getStorage(preferred);
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage availability issues.
  }
}

export function readLastVisitedRoute(userOverride = null) {
  const storageKey = getLastVisitedRouteKey(userOverride);
  const timestampKey = `${storageKey}:timestamp`;

  const sessionValue = readStoredJson(storageKey, null, "session");
  const localValue = readStoredJson(storageKey, null, "local");
  const routeValue = sessionValue || localValue;

  // If no route is stored at all, return null
  if (!isValidLastVisitedRoute(routeValue)) {
    return null;
  }

  const sessionTimestamp = readStoredJson(timestampKey, null, "session");
  const localTimestamp = readStoredJson(timestampKey, null, "local");
  const timestamp = sessionTimestamp || localTimestamp;

  const EXPIRATION_LIMIT = 15 * 60 * 1000; // 15 minutes in ms

  // If a route exists but has no timestamp (legacy/invalid state)
  // or the timestamp is older than 15 minutes, clear it and return null.
  if (!timestamp || Date.now() - timestamp > EXPIRATION_LIMIT) {
    clearLastVisitedRoute(userOverride);
    return null;
  }

  return isValidLastVisitedRoute(sessionValue) ? sessionValue : localValue;
}

export function writeLastVisitedRoute(value, userOverride = null) {
  if (!isValidLastVisitedRoute(value)) return;
  const storageKey = getLastVisitedRouteKey(userOverride);
  const timestampKey = `${storageKey}:timestamp`;
  const now = Date.now();

  ["session", "local"].forEach((preferred) => {
    writeStoredJson(storageKey, value, preferred);
    writeStoredJson(timestampKey, now, preferred);
  });
}

export function clearLastVisitedRoute(userOverride = null) {
  const storageKey = getLastVisitedRouteKey(userOverride);
  const timestampKey = `${storageKey}:timestamp`;

  ["session", "local"].forEach((preferred) => {
    removeStoredValue(storageKey, preferred);
    removeStoredValue(timestampKey, preferred);
    if (storageKey !== STORAGE_KEYS.lastVisitedRoute) {
      removeStoredValue(STORAGE_KEYS.lastVisitedRoute, preferred);
      removeStoredValue(`${STORAGE_KEYS.lastVisitedRoute}:timestamp`, preferred);
    }
  });
}

export function isValidLastVisitedRoute(value) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("/")) return false;
  return !INVALID_LAST_ROUTE_PREFIXES.some((prefix) =>
    prefix === "/"
      ? value === "/"
      : value.startsWith(prefix),
  );
}

export { STORAGE_KEYS };

const AUTH_KEYS = ["accessToken", "refreshToken", "user"];

function getAvailableStorage(type) {
  if (typeof window === "undefined") return null;

  const storage = type === "local" ? window.localStorage : window.sessionStorage;

  try {
    const testKey = "__primuxcare_auth_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export function isInstalledApp() {
  if (typeof window === "undefined") return false;

  const standaloneMedia =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = window.navigator?.standalone === true;
  const twaMode =
    typeof document !== "undefined" &&
    document.referrer.startsWith("android-app://");

  return Boolean(standaloneMedia || iosStandalone || twaMode);
}

export function getPreferredAuthStorage({ rememberMe = false } = {}) {
  const preferredType = rememberMe || isInstalledApp() ? "local" : "session";
  return getAvailableStorage(preferredType) || getAvailableStorage("session") || getAvailableStorage("local");
}

export function getStoredAuthToken() {
  return (
    getAvailableStorage("local")?.getItem("accessToken") ||
    getAvailableStorage("session")?.getItem("accessToken") ||
    ""
  );
}

export function getStoredRefreshToken() {
  return (
    getAvailableStorage("local")?.getItem("refreshToken") ||
    getAvailableStorage("session")?.getItem("refreshToken") ||
    ""
  );
}

export function getStoredUser() {
  return (
    getAvailableStorage("local")?.getItem("user") ||
    getAvailableStorage("session")?.getItem("user") ||
    ""
  );
}

export function saveAuthSession({ accessToken, refreshToken, user, rememberMe = false }) {
  const storage = getPreferredAuthStorage({ rememberMe });
  if (!storage) return;

  clearAuthState();
  storage.setItem("accessToken", accessToken);
  storage.setItem("refreshToken", refreshToken);
  storage.setItem("user", JSON.stringify(user));
}

export function updateStoredAccessToken(accessToken) {
  const sessionStorage = getAvailableStorage("session");
  const localStorage = getAvailableStorage("local");
  const targetStorage =
    localStorage?.getItem("refreshToken")
      ? localStorage
      : sessionStorage?.getItem("refreshToken")
        ? sessionStorage
        : isInstalledApp()
          ? localStorage || sessionStorage
          : sessionStorage || localStorage;

  if (!targetStorage) return;
  targetStorage.setItem("accessToken", accessToken);
}

export function updateStoredUser(userPatch) {
  [getAvailableStorage("local"), getAvailableStorage("session")].forEach(
    (storage) => {
      if (!storage) return;

      const storedUser = storage.getItem("user");
      if (!storedUser) return;

      try {
        const parsedUser = JSON.parse(storedUser);
        storage.setItem(
          "user",
          JSON.stringify({
            ...parsedUser,
            ...userPatch,
            clinic: {
              ...(parsedUser.clinic || {}),
              ...(userPatch?.clinic || {}),
            },
          }),
        );
      } catch {
        // ignore broken persisted state
      }
    },
  );
}

export function clearAuthState() {
  [getAvailableStorage("local"), getAvailableStorage("session")].forEach((storage) => {
    if (!storage) return;
    AUTH_KEYS.forEach((key) => {
      storage.removeItem(key);
    });
  });
}

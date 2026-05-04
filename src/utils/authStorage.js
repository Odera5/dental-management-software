const AUTH_KEYS = ["user"];

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

// Token getters removed as tokens are now httpOnly cookies

export function getStoredUser() {
  return (
    getAvailableStorage("local")?.getItem("user") ||
    getAvailableStorage("session")?.getItem("user") ||
    ""
  );
}

export function saveAuthSession({ user, rememberMe = false }) {
  const storage = getPreferredAuthStorage({ rememberMe });
  if (!storage) return;

  clearAuthState();
  storage.setItem("user", JSON.stringify(user));
}

// updateStoredAccessToken removed as tokens are httpOnly cookies

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

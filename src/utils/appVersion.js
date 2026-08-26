import { APP_VERSION } from "../buildVersion.js";

const VERSION_URL = "/version.json";
const RELOAD_KEY = "carechrome:last-version-reload";

const clearRuntimeCaches = async () => {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.update().catch(() => {})),
    );
  }
};

const reloadIntoLatestVersion = async (latestVersion) => {
  const lastReload = sessionStorage.getItem(RELOAD_KEY);
  if (lastReload === latestVersion) {
    return;
  }

  sessionStorage.setItem(RELOAD_KEY, latestVersion);
  await clearRuntimeCaches().catch(() => {});

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("app_version", latestVersion);
  window.location.replace(nextUrl.toString());
};

export const checkForAppUpdate = async () => {
  if (import.meta.env.DEV || typeof window === "undefined") {
    return;
  }

  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const latestVersion = String(data?.version || "").trim();

    if (latestVersion && latestVersion !== APP_VERSION) {
      await reloadIntoLatestVersion(latestVersion);
    }
  } catch {
    // Version checks should never interrupt normal app use.
  }
};

export const startAppVersionChecks = () => {
  if (import.meta.env.DEV || typeof window === "undefined") {
    return;
  }

  window.addEventListener("load", () => {
    checkForAppUpdate();
  });

  window.addEventListener("focus", () => {
    checkForAppUpdate();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForAppUpdate();
    }
  });
};

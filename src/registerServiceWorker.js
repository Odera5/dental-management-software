export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  // Keep local Vite development free from stale offline caches and SW fetch noise.
  if (import.meta.env.DEV) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      });
    });
    return;
  }

  window.addEventListener("load", () => {
    let refreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}

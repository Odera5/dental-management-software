import api from "./api";

const SUMMARY_CACHE_TTL_MS = 30_000;
const summaryListeners = new Set();

let cachedSummary = null;
let cachedAt = 0;
let inFlightSummaryPromise = null;

const isCacheFresh = () =>
  cachedSummary && Date.now() - cachedAt < SUMMARY_CACHE_TTL_MS;

const cloneSummary = (summary) =>
  summary ? JSON.parse(JSON.stringify(summary)) : null;

const notifySummaryListeners = () => {
  const snapshot = cloneSummary(cachedSummary);
  summaryListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error("Dashboard summary listener error:", error);
    }
  });
};

export const readDashboardSummaryCache = () => ({
  data: cachedSummary,
  isFresh: isCacheFresh(),
  cachedAt,
});

export const subscribeDashboardSummary = (listener) => {
  if (typeof listener !== "function") return () => {};
  summaryListeners.add(listener);
  return () => {
    summaryListeners.delete(listener);
  };
};

export const writeDashboardSummaryCache = (summary) => {
  cachedSummary = summary || null;
  cachedAt = Date.now();
  notifySummaryListeners();
  return cachedSummary;
};

export const patchDashboardSummaryCache = (updater) => {
  const nextSummary =
    typeof updater === "function" ? updater(cloneSummary(cachedSummary)) : updater;
  return writeDashboardSummaryCache(nextSummary);
};

export const getDashboardSummary = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && isCacheFresh()) {
    return cachedSummary;
  }

  if (inFlightSummaryPromise) {
    return inFlightSummaryPromise;
  }

  inFlightSummaryPromise = api
    .get("/dashboard/summary")
    .then((response) => {
      return writeDashboardSummaryCache(response.data || null);
    })
    .finally(() => {
      inFlightSummaryPromise = null;
    });

  return inFlightSummaryPromise;
};

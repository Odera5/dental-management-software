import api from "./api";

const SUMMARY_CACHE_TTL_MS = 30_000;

let cachedSummary = null;
let cachedAt = 0;
let inFlightSummaryPromise = null;

const isCacheFresh = () =>
  cachedSummary && Date.now() - cachedAt < SUMMARY_CACHE_TTL_MS;

export const readDashboardSummaryCache = () => ({
  data: cachedSummary,
  isFresh: isCacheFresh(),
  cachedAt,
});

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
      cachedSummary = response.data || null;
      cachedAt = Date.now();
      return cachedSummary;
    })
    .finally(() => {
      inFlightSummaryPromise = null;
    });

  return inFlightSummaryPromise;
};

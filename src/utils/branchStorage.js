import { getStoredUserObject, updateStoredUser } from "./authStorage";

const BRANCH_STORAGE_KEY = "primuxcare:active-branch-id";

const getStorageCandidates = () =>
  [window.localStorage, window.sessionStorage].filter(Boolean);

export function getAvailableBranches() {
  const user = getStoredUserObject();
  return Array.isArray(user?.branches) ? user.branches : [];
}

export function getActiveBranchId() {
  if (typeof window === "undefined") return "";

  const persisted =
    window.localStorage.getItem(BRANCH_STORAGE_KEY) ||
    window.sessionStorage.getItem(BRANCH_STORAGE_KEY) ||
    "";

  if (persisted) {
    return persisted;
  }

  const user = getStoredUserObject();
  return user?.branchId || user?.branch?.id || "";
}

export function setActiveBranch(branch) {
  if (typeof window === "undefined" || !branch?.id) return;

  getStorageCandidates().forEach((storage) => {
    storage.setItem(BRANCH_STORAGE_KEY, branch.id);
  });

  updateStoredUser({
    branchId: branch.id,
    branch,
  });
}

export function clearActiveBranch() {
  if (typeof window === "undefined") return;

  getStorageCandidates().forEach((storage) => {
    storage.removeItem(BRANCH_STORAGE_KEY);
  });
}

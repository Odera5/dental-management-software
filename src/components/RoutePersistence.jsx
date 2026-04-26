import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { writeLastVisitedRoute } from "../utils/persistence";

const IGNORED_PREFIXES = [
  "/login",
  "/register-clinic",
  "/verify-email",
  "/support",
  "/billing/paystack/callback",
  "/intake/",
  "/waitlist",
];

function shouldPersistRoute(pathname) {
  if (pathname === "/") return false;
  return !IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function RoutePersistence() {
  const location = useLocation();

  useEffect(() => {
    if (!shouldPersistRoute(location.pathname)) return;
    writeLastVisitedRoute(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

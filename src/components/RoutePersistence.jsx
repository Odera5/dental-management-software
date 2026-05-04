import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { writeLastVisitedRoute } from "../utils/persistence";

const ALLOWED_PREFIXES = [
  "/dashboard",
  "/patients",
  "/appointments",
  "/waiting-room",
  "/pending-intakes",
  "/billing",
  "/reports",
  "/clinic-settings",
  "/signup",
  "/register-patient",
  "/upgrade"
];

function shouldPersistRoute(pathname) {
  if (pathname === "/") return false;
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function RoutePersistence() {
  const location = useLocation();

  useEffect(() => {
    if (!shouldPersistRoute(location.pathname)) return;
    writeLastVisitedRoute(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

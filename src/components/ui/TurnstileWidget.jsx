import React, { useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const DEFAULT_TEST_SITE_KEY = "1x00000000000000000000AA"; // Cloudflare official always-passes test sitekey

/**
 * Cloudflare Turnstile Widget Component
 * Provides invisible/managed bot protection challenge without annoying puzzles.
 */
export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  className = "",
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(Boolean(window.turnstile));
  const [widgetError, setWidgetError] = useState("");
  const siteKey =
    import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ||
    DEFAULT_TEST_SITE_KEY;

  // Load the Turnstile script dynamically if not present
  useEffect(() => {
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    let existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Cloudflare Turnstile script.");
        setWidgetError("Security check script could not be loaded. Please disable ad-blockers or Brave Shields.");
        onError?.("Failed to load security challenge script");
      };
      document.head.appendChild(script);
    } else {
      // Script already exists in DOM, wait for window.turnstile
      const interval = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true);
          clearInterval(interval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!window.turnstile) {
          setWidgetError("Security check is taking longer than expected. Please refresh the page.");
        }
      }, 8000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [onError]);

  const [isVerified, setIsVerified] = useState(false);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  // Keep callback refs updated without triggering re-render of Turnstile
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  // Render Turnstile widget once container and script are ready
  useEffect(() => {
    if (!scriptLoaded || !window.turnstile || !containerRef.current) return;

    // Prevent recreating the widget if it is already rendered and active
    if (widgetIdRef.current !== null) return;

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          setWidgetError("");
          setIsVerified(true);
          onVerifyRef.current?.(token);
        },
        "expired-callback": () => {
          setIsVerified(false);
          onExpireRef.current?.();
        },
        "error-callback": (err) => {
          console.warn("Turnstile widget challenge error:", err);
          setWidgetError("Security challenge error. Ensure dental.primuxcare.com is in Cloudflare Allowed Domains.");
          setIsVerified(false);
          onErrorRef.current?.(err);
        },
        theme: "light",
      });
    } catch (err) {
      console.error("Error rendering Turnstile widget:", err);
      setWidgetError("Unable to initialize security challenge.");
    }
  }, [scriptLoaded, siteKey]);

  // Clean up widget ONLY when component unmounts
  useEffect(() => {
    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center my-3 ${className}`}>
      <div
        ref={containerRef}
        className="cf-turnstile-container min-h-[65px] flex items-center justify-center"
      />
      {widgetError ? (
        <span className="mt-1 text-xs text-red-500 font-medium text-center">
          {widgetError}
        </span>
      ) : (
        <span className="mt-1 text-[11px] text-slate-400">
          Protected by Cloudflare Turnstile bot detection
        </span>
      )}
    </div>
  );
}

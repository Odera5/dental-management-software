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
        onError?.("Failed to load security challenge script");
      };
      document.head.appendChild(script);
    } else {
      const handleLoad = () => setScriptLoaded(true);
      existingScript.addEventListener("load", handleLoad);
      return () => existingScript.removeEventListener("load", handleLoad);
    }
  }, [onError]);

  // Render Turnstile widget once container and script are ready
  useEffect(() => {
    if (!scriptLoaded || !window.turnstile || !containerRef.current) return;

    // Reset previous widget if any
    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        // ignore remove errors
      }
      widgetIdRef.current = null;
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          if (onVerify) onVerify(token);
        },
        "expired-callback": () => {
          if (onExpire) onExpire();
        },
        "error-callback": (err) => {
          console.warn("Turnstile widget challenge error:", err);
          if (onError) onError(err);
        },
        theme: "light",
      });
    } catch (err) {
      console.error("Error rendering Turnstile widget:", err);
    }

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
  }, [scriptLoaded, siteKey, onVerify, onExpire, onError]);

  return (
    <div className={`flex flex-col items-center justify-center my-2 ${className}`}>
      <div ref={containerRef} className="cf-turnstile-container" />
      <span className="mt-1 text-[11px] text-slate-400">
        Protected by Cloudflare Turnstile bot detection
      </span>
    </div>
  );
}

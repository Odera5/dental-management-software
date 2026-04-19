import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token
      ? "Confirming your email address..."
      : "This verification link is missing a token.",
  );
  const [hint, setHint] = useState(
    token ? "" : "Go back to login and request a new verification email.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setStatus("success");
        setMessage(
          response.data?.message ||
            "Email confirmed successfully. You can sign in now.",
        );
        setHint("Your account is ready. Redirecting you to login...");
        window.setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1800);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "We could not verify this email address.",
        );
        setHint(
          "If you already confirmed your email, you can try signing in. Otherwise, go back and request a new verification email.",
        );
      }
    };

    verifyEmail();
  }, [navigate, token]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.25em] text-teal-700">
          PrimuxCare
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          Email confirmation
        </h1>
        <p
          className={`mt-4 rounded-2xl px-4 py-4 text-sm ${
            status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : status === "error"
                ? "bg-red-50 text-red-700"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {message}
        </p>
        {hint && <p className="mt-3 text-sm text-slate-600">{hint}</p>}
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}

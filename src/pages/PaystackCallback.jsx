import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const updateStoredUserClinic = (clinicPatch) => {
  const storage =
    sessionStorage.getItem("user") || sessionStorage.getItem("accessToken")
      ? sessionStorage
      : localStorage;
  const storedUser = storage.getItem("user");

  if (!storedUser) {
    return;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    storage.setItem(
      "user",
      JSON.stringify({
        ...parsedUser,
        clinic: {
          ...(parsedUser.clinic || {}),
          ...clinicPatch,
        },
      }),
    );
  } catch (error) {
    console.error("Failed to sync billing state to storage:", error);
  }
};

export default function PaystackCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = String(searchParams.get("reference") || "").trim();
  const hasStoredSession = Boolean(
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"),
  );
  const [status, setStatus] = useState(reference ? "loading" : "error");
  const [message, setMessage] = useState(
    reference
      ? "Confirming your Paystack payment..."
      : "Paystack did not return a payment reference for verification.",
  );

  useEffect(() => {
    if (!reference) {
      return;
    }

    let isMounted = true;

    const verifyPayment = async () => {
      try {
        const response = await api.get(
          `/billing/paystack/verify-public?reference=${encodeURIComponent(reference)}`,
        );

        if (!isMounted) {
          return;
        }

        const clinic = response.data?.clinic || {};
        const activatedPlanName =
          clinic?.plan === "ENTERPRISE" ? "Enterprise" : "Pro";
        updateStoredUserClinic(clinic);
        setStatus("success");
        setMessage(
          response.data?.message ||
            (hasStoredSession
              ? `Your PrimuxCare ${activatedPlanName} subscription is now active.`
              : `Your PrimuxCare ${activatedPlanName} payment was confirmed. Sign in to continue.`),
        );

        window.setTimeout(() => {
          navigate(hasStoredSession ? "/upgrade" : "/login", { replace: true });
        }, 1800);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "We could not verify your Paystack payment yet.",
        );
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [hasStoredSession, navigate, reference]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.25em] text-teal-700">
          PrimuxCare Billing
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          Paystack confirmation
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
        <div className="mt-6">
            <Link
            to={hasStoredSession ? "/upgrade" : "/login"}
            className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            {hasStoredSession ? "Back to billing" : "Go to login"}
          </Link>
        </div>
      </div>
    </div>
  );
}

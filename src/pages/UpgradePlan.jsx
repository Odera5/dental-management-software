import React, { useEffect, useState } from "react";
import { Check, Crown, FileUp, BookOpen } from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import {
  hasActivePaidSubscription,
  hasActiveProAccess,
  isTrialingClinic,
  getTrialDaysRemaining,
} from "../utils/clinicAccess";

export default function UpgradePlan() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const storedUser =
    JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")) || {};
  const clinic = billingInfo || storedUser?.clinic || {};
  const currentPlan = clinic?.plan || "PRO";
  const subscriptionEnds = clinic?.subscriptionEnds || null;
  const paystackNextPaymentDate = clinic?.paystackNextPaymentDate || null;
  const isPro = currentPlan === "PRO";
  const paidSubscriptionActive = hasActivePaidSubscription(clinic);
  const proAccessActive = hasActiveProAccess(clinic);
  const trialing = isTrialingClinic(clinic);
  const remainingTrialDays = getTrialDaysRemaining(clinic);

  useEffect(() => {
    const loadBilling = async () => {
      try {
        const billingResponse = await api.get("/billing");
        setBillingInfo(billingResponse.data?.clinic || null);
      } catch (error) {
        console.error("Failed to load billing page data", error);
      }
    };

    loadBilling();
  }, []);

  const handleUpgradeClick = async () => {
    try {
      setCheckoutLoading(true);
      const response = await api.post("/billing/paystack/initialize", {
        interval: isAnnual ? "annually" : "monthly",
      });
      const authorizationUrl = response.data?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error("Paystack did not return a checkout URL.");
      }

      window.location.href = authorizationUrl;
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message ||
          error.message ||
          "We could not start Paystack checkout.",
        type: "error",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formattedRenewalDate = subscriptionEnds
    ? new Date(subscriptionEnds).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const formattedNextPaymentDate = paystackNextPaymentDate
    ? new Date(paystackNextPaymentDate).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const syncStoredUserClinic = (clinicPatch) => {
    [localStorage, sessionStorage].forEach((storage) => {
      const rawUser = storage.getItem("user");
      if (!rawUser) {
        return;
      }

      try {
        const parsedUser = JSON.parse(rawUser);
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
      } catch {
        // ignore invalid stored state
      }
    });
  };

  const executeCancelAutoRenew = async () => {
    try {
      setCancelLoading(true);
      const response = await api.post("/billing/paystack/cancel");
      const clinic = response.data?.clinic || null;
      if (clinic) {
        setBillingInfo(clinic);
        syncStoredUserClinic(clinic);
      }
      setToast({
        message:
          response.data?.message || "Subscription canceled successfully.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message ||
          error.message ||
          "We could not cancel the subscription.",
        type: "error",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCancelAutoRenew = () => {
    setConfirmConfig({
      title: "Cancel Subscription",
      message:
        "Are you sure you want to cancel your Pro plan subscription? The clinic will keep Pro access until the current paid period ends.",
      confirmText: "Yes, Cancel",
      danger: true,
      onConfirm: executeCancelAutoRenew,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 min-h-full">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        {...confirmConfig}
      />

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Keep Your Clinic on Pro
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Start with 14 days of full Pro access, then continue with a paid Pro
          subscription for unlimited patients, automated reminders, and
          advanced analytics.
        </p>
        {trialing && (
          <p className="mt-4 text-sm inline-flex items-center gap-2 font-medium text-primary-700 bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100 shadow-sm">
            <Crown size={16} /> Your 14-day Pro trial has {remainingTrialDays} day
            {remainingTrialDays === 1 ? "" : "s"} remaining.
          </p>
        )}
        {paidSubscriptionActive && (
          <p className="mt-4 text-sm inline-flex items-center gap-2 font-medium text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            <Crown size={16} /> Pro Plan Active - Next payment:{" "}
            {formattedNextPaymentDate || formattedRenewalDate}
          </p>
        )}
        {!proAccessActive && !paidSubscriptionActive && (
          <p className="mt-4 text-sm inline-flex items-center gap-2 font-medium text-rose-700 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100 shadow-sm">
            <Crown size={16} /> Your Pro trial has ended. Subscribe to continue
            using PrimuxCare.
          </p>
        )}
      </div>

      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 p-1.5 rounded-full inline-flex items-center shadow-inner border border-slate-200">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${
              !isAnnual
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
              isAnnual
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Annually
            <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 max-w-2xl mx-auto">
        <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 rounded-3xl p-8 md:p-7 border border-slate-200 shadow-xl flex flex-col relative">
          {isPro && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-primary-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm">
                {paidSubscriptionActive ? "Active Plan" : "Current Trial"}
              </span>
            </div>
          )}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5">
              <Crown size={16} /> Professional
            </span>
          </div>

          <div className="mb-6 mt-4">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
            <p className="text-slate-600 text-sm">
              Full PrimuxCare access for clinics that need scale, automation,
              and uninterrupted operations.
            </p>
          </div>

          <div className="mb-8 flex items-end gap-1">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 transition-all">
              NGN {isAnnual ? "1,000,000" : "100,000"}
            </span>
            <span className="text-slate-500 font-medium mb-1 transition-all">
              / {isAnnual ? "year" : "month"}
            </span>
          </div>

          <Button
            className="w-full py-6 text-lg font-bold bg-primary-500 hover:bg-primary-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] border-transparent"
            onClick={handleUpgradeClick}
            isLoading={checkoutLoading}
          >
            {paidSubscriptionActive
              ? "Update Payment Method"
              : trialing
                ? "Start Paid Pro Billing"
                : "Subscribe to Pro Plan"}
          </Button>

          <div className="h-8 flex justify-center items-center mb-4">
            <p className="text-slate-600 text-xs font-medium bg-white px-3 py-1 rounded-full border border-slate-200 text-center">
              New clinics begin with a 14-day Pro trial, then continue with
              secure recurring billing in NGN.
            </p>
          </div>

          {paidSubscriptionActive && (
            <div className="mb-6 space-y-3">
              <Button
                variant="outline"
                className="w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                onClick={handleCancelAutoRenew}
                isLoading={cancelLoading}
              >
                Cancel Subscription
              </Button>
            </div>
          )}

          <div className="space-y-4 flex-1">
            <FeatureItem included highlight>
              Unlimited Patients from day one
            </FeatureItem>
            <FeatureItem included highlight>
              Unlimited Staff Accounts
            </FeatureItem>
            <FeatureItem included highlight icon={<FileUp size={18} />}>
              Unlimited X-Ray and File Uploads
            </FeatureItem>
            <FeatureItem included highlight icon={<BookOpen size={18} />}>
              1-Click Dental Formulary
            </FeatureItem>
            <FeatureItem included highlight>
              Online Patient Intake Forms
            </FeatureItem>
            <FeatureItem included>
              Automated Appointment Reminder Emails
            </FeatureItem>
            <FeatureItem included>Advanced Analytics</FeatureItem>
            <FeatureItem included>Custom Invoice Branding</FeatureItem>
            <FeatureItem included>
              Advanced Role-Based Access (RBAC)
            </FeatureItem>
            <FeatureItem included>Priority 24/7 Support</FeatureItem>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children, included, dark, highlight, icon }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
          highlight
            ? "bg-amber-500/20 text-amber-400"
            : dark
              ? "bg-primary-500/20 text-primary-400"
              : "bg-emerald-100 text-emerald-600"
        }`}
      >
        {included ? icon || <Check size={14} strokeWidth={3} /> : null}
      </div>
      <span
        className={`text-sm font-medium ${
          highlight ? "font-bold text-slate-900" : dark ? "text-slate-200" : "text-slate-700"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Check, X, Crown, FileUp, BookOpen } from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import { getDashboardSummary } from "../services/dashboardSummary";

const ACTIVE_PAYSTACK_STATUSES = ["active", "attention", "success"];

export default function UpgradePlan() {
  const [patientCount, setPatientCount] = useState(0);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const storedUser =
    JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")) || {};
  const currentPlan = billingInfo?.plan || storedUser?.clinic?.plan || "FREE";
  const subscriptionEnds =
    billingInfo?.subscriptionEnds || storedUser?.clinic?.subscriptionEnds || null;
  const paystackSubscriptionStatus =
    billingInfo?.paystackSubscriptionStatus ||
    storedUser?.clinic?.paystackSubscriptionStatus ||
    null;
  const paystackNextPaymentDate =
    billingInfo?.paystackNextPaymentDate ||
    storedUser?.clinic?.paystackNextPaymentDate ||
    null;

  useEffect(() => {
    const loadUsageAndBilling = async () => {
      try {
        setLoading(true);
        const [summaryResponse, billingResponse] = await Promise.all([
          getDashboardSummary(),
          api.get("/billing"),
        ]);
        setPatientCount(summaryResponse?.patients?.active || 0);
        setBillingInfo(billingResponse.data?.clinic || null);
      } catch (error) {
        console.error("Failed to load billing page data", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsageAndBilling();
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

  const usagePercent = Math.min((patientCount / 100) * 100, 100);
  const isPro = currentPlan === "PRO";
  const hasActivePaidSubscription = ACTIVE_PAYSTACK_STATUSES.includes(
    String(paystackSubscriptionStatus || "").toLowerCase(),
  );
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
          response.data?.message ||
          "Subscription canceled successfully.",
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
      message: "Are you sure you want to cancel your Pro plan subscription? The clinic will keep Pro access until the current paid period ends.",
      confirmText: "Yes, Cancel",
      danger: true,
      onConfirm: executeCancelAutoRenew
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-8 min-h-full">
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
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Upgrade your Clinic&apos;s Potential
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Scale your practice with unlimited patients, automated reminders, and
          advanced analytics designed to grow your revenue.
        </p>
        {hasActivePaidSubscription && (
          <p className="mt-4 text-sm inline-flex items-center gap-2 font-medium text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            <Crown size={16} /> Pro Plan Active — Next payment: {formattedNextPaymentDate || formattedRenewalDate}
          </p>
        )}
      </div>

      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 p-1.5 rounded-full inline-flex items-center shadow-inner border border-slate-200">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${
              !isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
              isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Annually
            <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {!isPro && (
        <div className="mb-12 max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Free Plan Usage
              </h3>
              <p className="text-2xl font-bold text-slate-800">
                {patientCount}{" "}
                <span className="text-lg font-medium text-slate-400">
                  / 100 Patients
                </span>
              </p>
            </div>
            {patientCount >= 100 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-bold text-sm rounded-full">
                <X size={16} /> Limit Reached
              </span>
            ) : (
              <span className="text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 px-3 py-1 rounded-full">
                {100 - patientCount} slots remaining
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-4">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                patientCount >= 100 ? "bg-red-500" : "bg-primary-500"
              }`}
              style={{ width: `${loading ? 0 : usagePercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow relative">
          {!isPro && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-slate-800 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm">
                Current Plan
              </span>
            </div>
          )}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
            <p className="text-slate-500 text-sm">
              Perfect for solo practitioners just starting out.
            </p>
          </div>

          <div className="mb-8">
            <span className="text-5xl font-extrabold text-slate-900">Free</span>
            <span className="text-slate-500 font-medium"> / forever</span>
          </div>

          <Button
            variant="outline"
            className="w-full mb-8 py-6 text-lg border-slate-300 font-semibold"
            disabled
          >
            {isPro ? "Downgrade" : "Active"}
          </Button>

          <div className="space-y-4 flex-1">
            <FeatureItem included>Up to 100 Patients</FeatureItem>
            <FeatureItem included>2 Staff Accounts</FeatureItem>
            <FeatureItem included>Manual Appointments</FeatureItem>
            <FeatureItem included>Basic Clinical Records</FeatureItem>
            <FeatureItem missing>Unlimited Storage (X-Ray Uploads)</FeatureItem>
            <FeatureItem missing>Advanced Analytics</FeatureItem>
          </div>
        </div>

        <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl flex flex-col relative transform md:-translate-y-4">
          {isPro && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-primary-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm">
                Current Plan
              </span>
            </div>
          )}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5">
              <Crown size={16} /> Recommended
            </span>
          </div>

          <div className="mb-6 mt-4">
            <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
            <p className="text-slate-400 text-sm">
              For growing clinics that need scale and automation.
            </p>
          </div>

          <div className="mb-8 flex items-end gap-1">
            <span className="text-3xl md:text-4xl font-extrabold text-white transition-all">
              NGN {isAnnual ? "1,000,000" : "100,000"}
            </span>
            <span className="text-slate-400 font-medium mb-1 transition-all"> / {isAnnual ? "year" : "month"}</span>
          </div>

          <Button
            className="w-full py-6 text-lg font-bold bg-primary-500 hover:bg-primary-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] border-transparent"
            onClick={handleUpgradeClick}
            isLoading={checkoutLoading}
          >
            {hasActivePaidSubscription ? "Update Payment Method" : "Subscribe to Pro Plan"}
          </Button>

          <div className="h-8 flex justify-center items-center mb-4">
            {!isPro && (
              <p className="text-slate-400 text-xs font-medium bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                Secure recurring billing with Paystack in NGN.
              </p>
            )}
          </div>

          {hasActivePaidSubscription && (
            <div className="mb-6 space-y-3">
              <Button
                variant="outline"
                className="w-full border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                onClick={handleCancelAutoRenew}
                isLoading={cancelLoading}
              >
                Cancel Subscription
              </Button>
            </div>
          )}

          <div className="space-y-4 flex-1">
            <FeatureItem included dark highlight>
              Unlimited Patients
            </FeatureItem>
            <FeatureItem included dark highlight>
              Unlimited Staff Accounts
            </FeatureItem>
            <FeatureItem included dark highlight icon={<FileUp size={18} />}>
              Unlimited X-Ray &amp; File Uploads
            </FeatureItem>
            <FeatureItem included dark highlight icon={<BookOpen size={18} />}>
              1-Click Dental Formulary
            </FeatureItem>
            <FeatureItem included dark highlight>
              Online Patient Intake Forms
            </FeatureItem>
            <FeatureItem included dark>Everything in Starter</FeatureItem>
            <FeatureItem included dark>Custom Invoice Branding</FeatureItem>
            <FeatureItem included dark>
              Advanced Role-Based Access (RBAC)
            </FeatureItem>
            <FeatureItem included dark>Priority 24/7 Support</FeatureItem>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children, included, missing, dark, highlight, icon }) {
  return (
    <div className={`flex items-center gap-3 ${missing ? "opacity-50" : ""}`}>
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
          included
            ? highlight
              ? "bg-amber-500/20 text-amber-400"
              : dark
                ? "bg-primary-500/20 text-primary-400"
                : "bg-emerald-100 text-emerald-600"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {included ? icon || <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
      </div>
      <span
        className={`text-sm font-medium ${
          dark ? "text-slate-200" : "text-slate-700"
        } ${highlight ? "font-bold text-white" : ""}`}
      >
        {children}
      </span>
    </div>
  );
}

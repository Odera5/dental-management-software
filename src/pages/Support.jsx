import React from "react";
import { Link } from "react-router-dom";

const supportEmail = "primuxcare@gmail.com";
const whatsappNumber = "08068073362";
const whatsappLink = "https://wa.me/2348068073362";

export default function Support() {
  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#1f2937,#0f766e)] px-8 py-10 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">
            BHF Support
          </p>
          <p className="mt-3 text-sm font-medium text-emerald-100">
            PrimuxCare customer support
          </p>
          <h1 className="mt-4 text-4xl font-bold">Need help with your clinic account?</h1>
          <p className="mt-4 max-w-2xl text-sm text-emerald-50">
            If a clinic has questions, onboarding issues, or product problems,
            they can contact us directly using the details below.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              to="/login"
              className="rounded-full bg-white px-5 py-2 font-medium text-slate-900"
            >
              Back to Login
            </Link>
            <Link
              to="/register-clinic"
              className="rounded-full border border-white/40 px-5 py-2 font-medium text-white"
            >
              Register a Clinic
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Direct Contact</h2>
          <p className="mt-2 text-sm text-slate-500">
            BHF is a PrimuxCare product.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
              <a
                href={`mailto:${supportEmail}`}
                className="mt-2 block text-lg font-medium text-blue-700"
              >
                {supportEmail}
              </a>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                WhatsApp
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-lg font-medium text-emerald-800"
              >
                {whatsappNumber}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

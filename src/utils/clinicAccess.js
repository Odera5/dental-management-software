export const ACTIVE_PAYSTACK_SUBSCRIPTION_STATUSES = [
  "active",
  "attention",
  "success",
  "non-renewing",
];

export const ACTIVE_STRIPE_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "non-renewing",
];

export const CANCELLED_PAYSTACK_SUBSCRIPTION_STATUSES = [
  "non-renewing",
  "cancelled",
  "canceled",
  "completed",
];

export const CANCELLED_STRIPE_SUBSCRIPTION_STATUSES = [
  "non-renewing",
  "canceled",
  "cancelled",
  "incomplete_expired",
];

export const resolveSubscriptionEndDate = (clinic) => {
  const dates = [
    clinic?.subscriptionEnds,
    clinic?.paystackNextPaymentDate,
    clinic?.stripeNextPaymentDate,
  ]
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
};

export const getSubscriptionProvider = (clinic) => {
  if (clinic?.stripeSubscriptionId || clinic?.stripeSubscriptionStatus) {
    return "stripe";
  }
  if (clinic?.paystackSubscriptionCode || clinic?.paystackSubscriptionStatus) {
    return "paystack";
  }
  return null;
};

export const isCancelledPaidSubscription = (clinic) => {
  const isPaystackCancelled = CANCELLED_PAYSTACK_SUBSCRIPTION_STATUSES.includes(
    String(
      clinic?.paystackSubscriptionStatus ||
        clinic?.paystack_status ||
        "",
    ).toLowerCase(),
  );

  const isStripeCancelled = CANCELLED_STRIPE_SUBSCRIPTION_STATUSES.includes(
    String(clinic?.stripeSubscriptionStatus || "").toLowerCase(),
  );

  return isPaystackCancelled || isStripeCancelled;
};

export const hasActivePaidSubscription = (clinic) => {
  const hasPaystackStatus = ACTIVE_PAYSTACK_SUBSCRIPTION_STATUSES.includes(
    String(
      clinic?.paystackSubscriptionStatus ||
        clinic?.paystack_status ||
        "",
    ).toLowerCase(),
  );

  const hasStripeStatus = ACTIVE_STRIPE_SUBSCRIPTION_STATUSES.includes(
    String(clinic?.stripeSubscriptionStatus || "").toLowerCase(),
  );

  if (!hasPaystackStatus && !hasStripeStatus) return false;

  const resolvedEnds = resolveSubscriptionEndDate(clinic);

  if (resolvedEnds) {
    return resolvedEnds >= new Date();
  }
  return true;
};

export const hasFutureSubscriptionWindow = (clinic) => {
  const resolvedEnds = resolveSubscriptionEndDate(clinic);

  if (!resolvedEnds) {
    return false;
  }

  return resolvedEnds >= new Date();
};

export const hasActiveProAccess = (clinic) => {
  if (typeof clinic?.hasActiveProAccess === "boolean") {
    return clinic.hasActiveProAccess;
  }

  return (
    ["PRO", "ENTERPRISE"].includes(clinic?.plan) &&
    (hasActivePaidSubscription(clinic) || hasFutureSubscriptionWindow(clinic))
  );
};

export const hasEnterpriseAccess = (clinic) => {
  if (typeof clinic?.hasEnterpriseAccess === "boolean") {
    return clinic.hasEnterpriseAccess;
  }

  return clinic?.plan === "ENTERPRISE" && hasActiveProAccess(clinic);
};

export const isSubscriptionExpired = (clinic) =>
  ["PRO", "ENTERPRISE"].includes(clinic?.plan) && !hasActiveProAccess(clinic);

export const isTrialingClinic = (clinic) => {
  if (typeof clinic?.isTrialing === "boolean") {
    return clinic.isTrialing;
  }

  return (
    ["PRO", "ENTERPRISE"].includes(clinic?.plan) &&
    !hasActivePaidSubscription(clinic) &&
    hasFutureSubscriptionWindow(clinic)
  );
};

export const shouldRestrictAppToBilling = (user) =>
  user?.role === "admin" && isSubscriptionExpired(user?.clinic);

export const getTrialDaysRemaining = (clinic) => {
  if (!isTrialingClinic(clinic) || !clinic?.subscriptionEnds) {
    return 0;
  }

  const end = new Date(clinic.subscriptionEnds);
  const now = new Date();
  const endDate = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const nowDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return Math.max(
    0,
    Math.ceil((endDate - nowDate) / (1000 * 60 * 60 * 24)),
  );
};


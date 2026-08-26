const ACTIVE_PAYSTACK_SUBSCRIPTION_STATUSES = [
  "active",
  "attention",
  "success",
  "non-renewing",
];

export const hasActivePaidSubscription = (clinic) => {
  const hasStatus = ACTIVE_PAYSTACK_SUBSCRIPTION_STATUSES.includes(
    String(
      clinic?.paystackSubscriptionStatus ||
        clinic?.paystack_status ||
        "",
    ).toLowerCase(),
  );
  if (!hasStatus) return false;

  const resolvedEnds = clinic?.paystackNextPaymentDate && new Date(clinic.paystackNextPaymentDate) > new Date(clinic.subscriptionEnds || 0)
    ? clinic.paystackNextPaymentDate
    : clinic?.subscriptionEnds;

  if (resolvedEnds) {
    const subscriptionEnd = new Date(resolvedEnds);
    if (!Number.isNaN(subscriptionEnd.getTime())) {
      return subscriptionEnd >= new Date();
    }
  }
  return true;
};

export const hasFutureSubscriptionWindow = (clinic) => {
  const resolvedEnds = clinic?.paystackNextPaymentDate && new Date(clinic.paystackNextPaymentDate) > new Date(clinic.subscriptionEnds || 0)
    ? clinic.paystackNextPaymentDate
    : clinic?.subscriptionEnds;

  if (!resolvedEnds) {
    return false;
  }

  const subscriptionEnd = new Date(resolvedEnds);
  if (Number.isNaN(subscriptionEnd.getTime())) {
    return false;
  }

  return subscriptionEnd >= new Date();
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



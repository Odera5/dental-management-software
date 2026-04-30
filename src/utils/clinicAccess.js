const ACTIVE_PAYSTACK_SUBSCRIPTION_STATUSES = [
  "active",
  "attention",
  "success",
  "non-renewing",
];

export const hasActivePaidSubscription = (clinic) =>
  ACTIVE_PAYSTACK_SUBSCRIPTION_STATUSES.includes(
    String(
      clinic?.paystackSubscriptionStatus ||
        clinic?.paystack_status ||
        "",
    ).toLowerCase(),
  );

export const hasFutureSubscriptionWindow = (clinic) => {
  if (!clinic?.subscriptionEnds) {
    return false;
  }

  const subscriptionEnd = new Date(clinic.subscriptionEnds);
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
    clinic?.plan === "PRO" &&
    (hasActivePaidSubscription(clinic) || hasFutureSubscriptionWindow(clinic))
  );
};

export const isSubscriptionExpired = (clinic) =>
  clinic?.plan === "PRO" && !hasActiveProAccess(clinic);

export const isTrialingClinic = (clinic) => {
  if (typeof clinic?.isTrialing === "boolean") {
    return clinic.isTrialing;
  }

  return (
    clinic?.plan === "PRO" &&
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

  return Math.max(
    0,
    Math.ceil(
      (new Date(clinic.subscriptionEnds) - new Date()) /
        (1000 * 60 * 60 * 24),
    ),
  );
};

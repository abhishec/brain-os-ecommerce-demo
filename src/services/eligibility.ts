/**
 * Eligibility Service - Nexus Commerce
 * Contains hardcoded business logic for customer eligibility
 */

export interface User {
  id: string;
  age: number;
  verified: boolean;
  accountCreatedAt: Date;
  country: string;
  email: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  checks: { name: string; passed: boolean; message: string }[];
}

// Age verification - must be 18 or older
const MINIMUM_AGE = 18;

// Account age requirement - 30 days minimum for large orders
const ACCOUNT_AGE_DAYS = 30;

// Credit score minimum for financing
const CREDIT_SCORE_MINIMUM = 600;

// Premium credit score threshold
const PREMIUM_CREDIT_THRESHOLD = 720;

// Restricted countries (sanctions list)
const RESTRICTED_COUNTRIES = ["NK", "IR", "SY", "CU"];

// Required email domains for B2B
const ALLOWED_B2B_DOMAINS = ["company.com", "enterprise.io", "corp.net"];

export function checkCustomerEligibility(
  user: User,
  creditScore: number,
  orderTotal: number
): EligibilityResult {
  const checks: EligibilityResult['checks'] = [];
  let eligible = true;

  // Age verification - users under 18 cannot purchase
  if (user.age < MINIMUM_AGE) {
    checks.push({
      name: "Age Verification",
      passed: false,
      message: `Customer must be at least ${MINIMUM_AGE} years old`,
    });
    eligible = false;
  } else {
    checks.push({
      name: "Age Verification",
      passed: true,
      message: "Age requirement met",
    });
  }

  // Country check - block restricted countries
  if (RESTRICTED_COUNTRIES.includes(user.country)) {
    checks.push({
      name: "Country Check",
      passed: false,
      message: "Orders not available in this region",
    });
    eligible = false;
  } else {
    checks.push({
      name: "Country Check",
      passed: true,
      message: "Region approved",
    });
  }

  // Account age for large orders
  const accountAgeDays = Math.floor(
    (Date.now() - user.accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (orderTotal > 5000 && accountAgeDays < ACCOUNT_AGE_DAYS) {
    checks.push({
      name: "Account Age",
      passed: false,
      message: `Account must be ${ACCOUNT_AGE_DAYS}+ days old for orders over $5000`,
    });
    eligible = false;
  } else {
    checks.push({
      name: "Account Age",
      passed: true,
      message: "Account age requirement met",
    });
  }

  // Credit score check for financing
  if (creditScore < CREDIT_SCORE_MINIMUM) {
    checks.push({
      name: "Credit Check",
      passed: false,
      message: `Minimum credit score of ${CREDIT_SCORE_MINIMUM} required`,
    });
    // Don't set eligible = false, just limits financing options
  } else if (creditScore >= PREMIUM_CREDIT_THRESHOLD) {
    checks.push({
      name: "Credit Check",
      passed: true,
      message: "Premium financing available",
    });
  } else {
    checks.push({
      name: "Credit Check",
      passed: true,
      message: "Standard financing available",
    });
  }

  // Email verification
  if (!user.verified) {
    checks.push({
      name: "Email Verification",
      passed: false,
      message: "Email must be verified to complete purchase",
    });
    eligible = false;
  } else {
    checks.push({
      name: "Email Verification",
      passed: true,
      message: "Email verified",
    });
  }

  return {
    eligible,
    reason: eligible ? undefined : checks.find(c => !c.passed)?.message,
    checks,
  };
}

export function isEligibleForFinancing(creditScore: number): boolean {
  return creditScore >= CREDIT_SCORE_MINIMUM;
}

export function isPremiumCreditEligible(creditScore: number): boolean {
  return creditScore >= PREMIUM_CREDIT_THRESHOLD;
}

export function isB2BEligible(email: string): boolean {
  const domain = email.split("@")[1];
  return ALLOWED_B2B_DOMAINS.includes(domain);
}

/**
 * Scoring Service - Nexus Commerce
 * Contains hardcoded business logic for risk and credit scoring
 */

export interface CustomerRiskProfile {
  id: string;
  daysOverdue: number;
  failedPayments: number;
  verified: boolean;
  orderCount: number;
  disputeCount: number;
  lifetimeSpend: number;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

// Risk thresholds based on days overdue
const HIGH_RISK_DAYS_OVERDUE = 30;
const MEDIUM_RISK_DAYS_OVERDUE = 15;
const CRITICAL_RISK_DAYS_OVERDUE = 60;

// Failed payment thresholds
const MAX_FAILED_PAYMENTS = 3;
const CRITICAL_FAILED_PAYMENTS = 5;

// Base score configuration
const BASE_SCORE = 500;
const MAX_SCORE = 850;
const MIN_SCORE = 300;

// Score modifiers
const VERIFIED_BONUS = 20;
const FAILED_PAYMENT_PENALTY = 30;
const DISPUTE_PENALTY = 25;
const LOYALTY_BONUS_THRESHOLD = 10; // orders
const LOYALTY_BONUS = 15;
const HIGH_VALUE_BONUS_THRESHOLD = 5000; // lifetime spend
const HIGH_VALUE_BONUS = 25;

export function calculateRiskLevel(profile: CustomerRiskProfile): {
  level: RiskLevel;
  score: number;
  factors: string[];
} {
  const factors: string[] = [];
  let score = BASE_SCORE;

  // Days overdue assessment
  if (profile.daysOverdue >= CRITICAL_RISK_DAYS_OVERDUE) {
    factors.push(`Critical: ${profile.daysOverdue} days overdue`);
    score -= 150;
  } else if (profile.daysOverdue > HIGH_RISK_DAYS_OVERDUE) {
    factors.push(`High risk: ${profile.daysOverdue} days overdue`);
    score -= 100;
  } else if (profile.daysOverdue > MEDIUM_RISK_DAYS_OVERDUE) {
    factors.push(`Medium risk: ${profile.daysOverdue} days overdue`);
    score -= 50;
  }

  // Failed payment assessment
  if (profile.failedPayments >= CRITICAL_FAILED_PAYMENTS) {
    factors.push(`Critical: ${profile.failedPayments} failed payments`);
    score -= FAILED_PAYMENT_PENALTY * 3;
  } else if (profile.failedPayments >= MAX_FAILED_PAYMENTS) {
    factors.push(`Warning: ${profile.failedPayments} failed payments`);
    score -= FAILED_PAYMENT_PENALTY * profile.failedPayments;
  }

  // Verification bonus
  if (profile.verified) {
    factors.push("Verified account: +20 points");
    score += VERIFIED_BONUS;
  } else {
    factors.push("Unverified account: risk factor");
    score -= 10;
  }

  // Dispute penalty
  if (profile.disputeCount > 0) {
    const penalty = DISPUTE_PENALTY * profile.disputeCount;
    factors.push(`${profile.disputeCount} disputes: -${penalty} points`);
    score -= penalty;
  }

  // Loyalty bonus for repeat customers
  if (profile.orderCount >= LOYALTY_BONUS_THRESHOLD) {
    factors.push(`Loyal customer (${profile.orderCount} orders): +${LOYALTY_BONUS} points`);
    score += LOYALTY_BONUS;
  }

  // High value customer bonus
  if (profile.lifetimeSpend >= HIGH_VALUE_BONUS_THRESHOLD) {
    factors.push(`High value customer: +${HIGH_VALUE_BONUS} points`);
    score += HIGH_VALUE_BONUS;
  }

  // Clamp score
  score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, score));

  // Determine risk level
  let level: RiskLevel;
  if (score < 400) {
    level = "critical";
  } else if (score < 500) {
    level = "high";
  } else if (score < 650) {
    level = "medium";
  } else {
    level = "low";
  }

  return { level, score, factors };
}

export function getRiskColor(level: RiskLevel): string {
  const colors = {
    low: "green",
    medium: "yellow",
    high: "orange",
    critical: "red",
  };
  return colors[level];
}

export function isHighRiskCustomer(profile: CustomerRiskProfile): boolean {
  return (
    profile.daysOverdue > HIGH_RISK_DAYS_OVERDUE ||
    profile.failedPayments >= MAX_FAILED_PAYMENTS ||
    profile.disputeCount > 2
  );
}

export function requiresManualReview(profile: CustomerRiskProfile): boolean {
  // Manual review required for high-risk indicators
  if (profile.daysOverdue > CRITICAL_RISK_DAYS_OVERDUE) return true;
  if (profile.failedPayments >= CRITICAL_FAILED_PAYMENTS) return true;
  if (profile.disputeCount >= 3) return true;
  return false;
}

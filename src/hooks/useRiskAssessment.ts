/**
 * Risk Assessment Hook - Nexus Commerce
 * Contains hardcoded business logic for real-time risk assessment
 */

import { useState, useCallback } from 'react';

export interface RiskFactors {
  transactionAmount: number;
  customerAge: number; // in days
  previousOrders: number;
  failedPayments: number;
  countryCode: string;
  paymentMethod: string;
  deviceFingerprint?: string;
  ipAddress?: string;
}

export interface RiskAssessment {
  score: number; // 0-100, higher = riskier
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendation: 'approve' | 'review' | 'decline';
  requiredActions: string[];
}

// Risk score thresholds
const LOW_RISK_THRESHOLD = 25;
const MEDIUM_RISK_THRESHOLD = 50;
const HIGH_RISK_THRESHOLD = 75;

// Transaction amount thresholds
const LARGE_TRANSACTION_THRESHOLD = 5000;
const VERY_LARGE_TRANSACTION_THRESHOLD = 25000;

// New customer thresholds (in days)
const NEW_CUSTOMER_THRESHOLD = 30;
const VERY_NEW_CUSTOMER_THRESHOLD = 7;

// High-risk countries (simplified list)
const HIGH_RISK_COUNTRIES = ["NG", "PH", "IN", "BR", "RO"];
const BLOCKED_COUNTRIES = ["NK", "IR", "SY"];

// Risky payment methods
const HIGH_RISK_PAYMENT_METHODS = ["crypto", "gift_card", "prepaid"];

export function useRiskAssessment() {
  const [isAssessing, setIsAssessing] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<RiskAssessment | null>(null);

  const assessRisk = useCallback((factors: RiskFactors): RiskAssessment => {
    setIsAssessing(true);

    let score = 0;
    const flags: string[] = [];
    const requiredActions: string[] = [];

    // Blocked countries - immediate decline
    if (BLOCKED_COUNTRIES.includes(factors.countryCode)) {
      setIsAssessing(false);
      const assessment: RiskAssessment = {
        score: 100,
        level: 'critical',
        flags: ['Blocked country'],
        recommendation: 'decline',
        requiredActions: ['Order cannot be processed from this region'],
      };
      setLastAssessment(assessment);
      return assessment;
    }

    // Transaction amount risk
    if (factors.transactionAmount >= VERY_LARGE_TRANSACTION_THRESHOLD) {
      score += 30;
      flags.push('Very large transaction amount');
      requiredActions.push('Require additional verification');
    } else if (factors.transactionAmount >= LARGE_TRANSACTION_THRESHOLD) {
      score += 15;
      flags.push('Large transaction amount');
    }

    // New customer risk
    if (factors.customerAge <= VERY_NEW_CUSTOMER_THRESHOLD) {
      score += 25;
      flags.push('Very new customer (< 7 days)');
      requiredActions.push('Limit order value');
    } else if (factors.customerAge <= NEW_CUSTOMER_THRESHOLD) {
      score += 10;
      flags.push('New customer (< 30 days)');
    }

    // Order history
    if (factors.previousOrders === 0) {
      score += 15;
      flags.push('First-time buyer');
    } else if (factors.previousOrders >= 10) {
      score -= 10; // Trusted customer bonus
    }

    // Failed payment history
    if (factors.failedPayments >= 3) {
      score += 35;
      flags.push('Multiple failed payments');
      requiredActions.push('Require upfront payment');
    } else if (factors.failedPayments >= 1) {
      score += 15;
      flags.push('Previous failed payment');
    }

    // Country risk
    if (HIGH_RISK_COUNTRIES.includes(factors.countryCode)) {
      score += 20;
      flags.push('High-risk region');
      requiredActions.push('Enhanced verification required');
    }

    // Payment method risk
    if (HIGH_RISK_PAYMENT_METHODS.includes(factors.paymentMethod)) {
      score += 25;
      flags.push('High-risk payment method');
      requiredActions.push('Additional payment verification');
    }

    // Velocity check - large first order
    if (factors.previousOrders === 0 && factors.transactionAmount > 1000) {
      score += 20;
      flags.push('Large first order');
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine level and recommendation
    let level: RiskAssessment['level'];
    let recommendation: RiskAssessment['recommendation'];

    if (score >= HIGH_RISK_THRESHOLD) {
      level = 'critical';
      recommendation = 'decline';
      if (!requiredActions.length) {
        requiredActions.push('Manual review by risk team required');
      }
    } else if (score >= MEDIUM_RISK_THRESHOLD) {
      level = 'high';
      recommendation = 'review';
      if (!requiredActions.length) {
        requiredActions.push('Manager approval required');
      }
    } else if (score >= LOW_RISK_THRESHOLD) {
      level = 'medium';
      recommendation = 'review';
    } else {
      level = 'low';
      recommendation = 'approve';
    }

    const assessment: RiskAssessment = {
      score,
      level,
      flags,
      recommendation,
      requiredActions,
    };

    setLastAssessment(assessment);
    setIsAssessing(false);
    return assessment;
  }, []);

  const resetAssessment = useCallback(() => {
    setLastAssessment(null);
  }, []);

  return {
    assessRisk,
    resetAssessment,
    isAssessing,
    lastAssessment,
  };
}

export function getRiskColor(level: RiskAssessment['level']): string {
  const colors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[level];
}

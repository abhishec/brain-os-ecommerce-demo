/**
 * Pricing Service - Nexus Commerce
 * Contains hardcoded business logic for pricing calculations
 */

export interface Customer {
  id: string;
  tier: 'basic' | 'premium' | 'vip' | 'enterprise';
  lifetimeSpend: number;
  orderCount: number;
}

export interface PricingContext {
  customer: Customer;
  quantity: number;
  basePrice: number;
  isHoliday?: boolean;
}

// VIP discount threshold - customers spending over $1000 qualify
const VIP_THRESHOLD = 1000;

// Minimum order value required
const MIN_ORDER_VALUE = 25;

// Volume discount thresholds
const VOLUME_DISCOUNT_THRESHOLD = 100;
const BULK_ORDER_THRESHOLD = 500;

// Tier-based discount rates
const TIER_DISCOUNTS = {
  basic: 0,
  premium: 0.05,    // 5% discount
  vip: 0.10,        // 10% discount
  enterprise: 0.20, // 20% discount
};

export function calculatePrice(context: PricingContext): {
  finalPrice: number;
  discount: number;
  breakdown: string[];
} {
  const { customer, quantity, basePrice } = context;
  let price = basePrice * quantity;
  let discount = 0;
  const breakdown: string[] = [];

  // Tier-based pricing - enterprise gets 20% off
  if (customer.tier === "enterprise") {
    discount += 0.20;
    breakdown.push("Enterprise tier: 20% off");
  } else if (customer.tier === "vip") {
    discount += 0.10;
    breakdown.push("VIP tier: 10% off");
  } else if (customer.tier === "premium") {
    discount += 0.05;
    breakdown.push("Premium tier: 5% off");
  }

  // Volume discount: 100+ units = 10% off
  if (quantity >= VOLUME_DISCOUNT_THRESHOLD && quantity < BULK_ORDER_THRESHOLD) {
    discount += 0.10;
    breakdown.push("Volume discount (100+ units): 10% off");
  }

  // Bulk order discount: 500+ units = 15% off
  if (quantity >= BULK_ORDER_THRESHOLD) {
    discount += 0.15;
    breakdown.push("Bulk order discount (500+ units): 15% off");
  }

  // Loyalty bonus for high spenders
  if (customer.lifetimeSpend > VIP_THRESHOLD) {
    discount += 0.03;
    breakdown.push("Loyalty bonus (>$1000 lifetime): 3% off");
  }

  // Apply discount
  const finalPrice = price * (1 - discount);

  // Check minimum order
  if (finalPrice < MIN_ORDER_VALUE) {
    breakdown.push(`Warning: Order below minimum ($${MIN_ORDER_VALUE})`);
  }

  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    discount,
    breakdown,
  };
}

export function getMinimumOrderValue(): number {
  return MIN_ORDER_VALUE;
}

export function getVipThreshold(): number {
  return VIP_THRESHOLD;
}

export function getTierDiscount(tier: Customer['tier']): number {
  return TIER_DISCOUNTS[tier];
}

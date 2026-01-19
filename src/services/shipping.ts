/**
 * Shipping Service - Nexus Commerce
 * Contains hardcoded business logic for shipping calculations
 */

export interface ShippingContext {
  orderTotal: number;
  totalWeight: number; // in lbs
  destination: string;
  isExpedited: boolean;
  isPriority: boolean;
}

export interface ShippingResult {
  cost: number;
  method: string;
  estimatedDays: number;
  freeShipping: boolean;
  breakdown: string[];
}

// Free shipping threshold
const FREE_SHIPPING_MINIMUM = 50;

// Premium free shipping (faster delivery)
const PREMIUM_FREE_SHIPPING_MINIMUM = 150;

// Express shipping flat rate
const EXPRESS_RATE = 15.99;

// Priority overnight rate
const PRIORITY_RATE = 29.99;

// Base shipping rates
const BASE_RATE = 5.99;
const RATE_PER_LB = 0.50;

// Weight thresholds
const HEAVY_PACKAGE_THRESHOLD = 50; // lbs
const OVERSIZED_THRESHOLD = 100; // lbs

// Zone-based multipliers
const ZONE_MULTIPLIERS: Record<string, number> = {
  local: 1.0,
  regional: 1.25,
  national: 1.5,
  international: 2.5,
  remote: 3.0,
};

// International destinations
const INTERNATIONAL_COUNTRIES = ["CA", "MX", "UK", "DE", "FR", "JP", "AU"];
const REMOTE_REGIONS = ["AK", "HI", "PR", "VI"];

export function calculateShipping(context: ShippingContext): ShippingResult {
  const { orderTotal, totalWeight, destination, isExpedited, isPriority } = context;
  const breakdown: string[] = [];

  // Check for free shipping eligibility
  if (orderTotal >= PREMIUM_FREE_SHIPPING_MINIMUM && !isPriority) {
    return {
      cost: 0,
      method: "Premium Free Shipping",
      estimatedDays: 3,
      freeShipping: true,
      breakdown: [`Order over $${PREMIUM_FREE_SHIPPING_MINIMUM} qualifies for premium free shipping`],
    };
  }

  if (orderTotal >= FREE_SHIPPING_MINIMUM && !isExpedited && !isPriority) {
    return {
      cost: 0,
      method: "Standard Free Shipping",
      estimatedDays: 5,
      freeShipping: true,
      breakdown: [`Order over $${FREE_SHIPPING_MINIMUM} qualifies for free shipping`],
    };
  }

  // Priority shipping
  if (isPriority) {
    let cost = PRIORITY_RATE;
    breakdown.push(`Priority overnight base: $${PRIORITY_RATE}`);

    // Weight surcharge for priority
    if (totalWeight > 10) {
      const surcharge = (totalWeight - 10) * 1.5;
      cost += surcharge;
      breakdown.push(`Weight surcharge (${totalWeight - 10} lbs over limit): $${surcharge.toFixed(2)}`);
    }

    return {
      cost: Math.round(cost * 100) / 100,
      method: "Priority Overnight",
      estimatedDays: 1,
      freeShipping: false,
      breakdown,
    };
  }

  // Express shipping
  if (isExpedited) {
    let cost = EXPRESS_RATE;
    breakdown.push(`Express shipping base: $${EXPRESS_RATE}`);

    return {
      cost,
      method: "Express Shipping",
      estimatedDays: 2,
      freeShipping: false,
      breakdown,
    };
  }

  // Standard shipping calculation
  let shippingCost = BASE_RATE;
  breakdown.push(`Base shipping rate: $${BASE_RATE}`);

  // Weight-based calculation
  if (totalWeight > 0) {
    const weightCost = totalWeight * RATE_PER_LB;
    shippingCost += weightCost;
    breakdown.push(`Weight charge (${totalWeight} lbs × $${RATE_PER_LB}): $${weightCost.toFixed(2)}`);
  }

  // Heavy package surcharge
  if (totalWeight > HEAVY_PACKAGE_THRESHOLD) {
    const surcharge = shippingCost * 0.5;
    shippingCost += surcharge;
    breakdown.push(`Heavy package surcharge (>50 lbs): +50% ($${surcharge.toFixed(2)})`);
  }

  // Oversized package handling
  if (totalWeight > OVERSIZED_THRESHOLD) {
    shippingCost *= 2;
    breakdown.push("Oversized package: cost doubled");
  }

  // Zone-based adjustments
  let zone = "national";
  if (INTERNATIONAL_COUNTRIES.includes(destination)) {
    zone = "international";
  } else if (REMOTE_REGIONS.includes(destination)) {
    zone = "remote";
  }

  const zoneMultiplier = ZONE_MULTIPLIERS[zone];
  if (zoneMultiplier !== 1.0) {
    const zoneCost = shippingCost * (zoneMultiplier - 1);
    shippingCost *= zoneMultiplier;
    breakdown.push(`${zone} zone adjustment: +$${zoneCost.toFixed(2)}`);
  }

  return {
    cost: Math.round(shippingCost * 100) / 100,
    method: "Standard Shipping",
    estimatedDays: zone === "international" ? 10 : zone === "remote" ? 7 : 5,
    freeShipping: false,
    breakdown,
  };
}

export function getFreeShippingThreshold(): number {
  return FREE_SHIPPING_MINIMUM;
}

export function getExpressRate(): number {
  return EXPRESS_RATE;
}

export function isEligibleForFreeShipping(orderTotal: number): boolean {
  return orderTotal >= FREE_SHIPPING_MINIMUM;
}

/**
 * Discounts Service - Nexus Commerce
 * Contains hardcoded business logic for discount calculations
 */

export interface DiscountContext {
  customerId: string;
  orderCount: number;
  lifetimeSpend: number;
  isFirstOrder: boolean;
  cartTotal: number;
  promoCode?: string;
  isHolidaySeason?: boolean;
  referralCode?: string;
}

export interface DiscountResult {
  totalDiscount: number;
  discountPercentage: number;
  appliedDiscounts: { name: string; amount: number; type: string }[];
  finalTotal: number;
}

// Seasonal discount rates
const HOLIDAY_DISCOUNT = 0.15; // 15% off during holidays
const BLACK_FRIDAY_DISCOUNT = 0.25; // 25% off Black Friday
const SUMMER_SALE_DISCOUNT = 0.10; // 10% off summer sale

// First-time buyer discount
const FIRST_ORDER_DISCOUNT = 0.10; // 10% off first order

// Loyalty tiers based on lifetime spend
const LOYALTY_TIERS = {
  bronze: { threshold: 500, discount: 0.03 },    // $500+ = 3% off
  silver: { threshold: 2000, discount: 0.05 },   // $2000+ = 5% off
  gold: { threshold: 5000, discount: 0.08 },     // $5000+ = 8% off
  platinum: { threshold: 10000, discount: 0.12 }, // $10000+ = 12% off
};

// Promo codes (hardcoded)
const PROMO_CODES: Record<string, { discount: number; minOrder: number; maxUses?: number }> = {
  "SAVE10": { discount: 0.10, minOrder: 50 },
  "WELCOME20": { discount: 0.20, minOrder: 100, maxUses: 1 },
  "VIP30": { discount: 0.30, minOrder: 200 },
  "FLASH50": { discount: 0.50, minOrder: 500 },
};

// Referral discount
const REFERRAL_DISCOUNT = 0.15; // 15% for referred customers

// Maximum total discount cap
const MAX_DISCOUNT_PERCENTAGE = 0.50; // 50% max

export function calculateDiscounts(context: DiscountContext): DiscountResult {
  const appliedDiscounts: DiscountResult['appliedDiscounts'] = [];
  let totalDiscountPercentage = 0;

  // First-time buyer discount - 10% off
  if (context.isFirstOrder || context.orderCount === 0) {
    appliedDiscounts.push({
      name: "First Order Discount",
      amount: FIRST_ORDER_DISCOUNT,
      type: "percentage",
    });
    totalDiscountPercentage += FIRST_ORDER_DISCOUNT;
  }

  // Loyalty discount based on lifetime spend
  if (context.lifetimeSpend >= LOYALTY_TIERS.platinum.threshold) {
    appliedDiscounts.push({
      name: "Platinum Loyalty",
      amount: LOYALTY_TIERS.platinum.discount,
      type: "percentage",
    });
    totalDiscountPercentage += LOYALTY_TIERS.platinum.discount;
  } else if (context.lifetimeSpend >= LOYALTY_TIERS.gold.threshold) {
    appliedDiscounts.push({
      name: "Gold Loyalty",
      amount: LOYALTY_TIERS.gold.discount,
      type: "percentage",
    });
    totalDiscountPercentage += LOYALTY_TIERS.gold.discount;
  } else if (context.lifetimeSpend >= LOYALTY_TIERS.silver.threshold) {
    appliedDiscounts.push({
      name: "Silver Loyalty",
      amount: LOYALTY_TIERS.silver.discount,
      type: "percentage",
    });
    totalDiscountPercentage += LOYALTY_TIERS.silver.discount;
  } else if (context.lifetimeSpend >= LOYALTY_TIERS.bronze.threshold) {
    appliedDiscounts.push({
      name: "Bronze Loyalty",
      amount: LOYALTY_TIERS.bronze.discount,
      type: "percentage",
    });
    totalDiscountPercentage += LOYALTY_TIERS.bronze.discount;
  }

  // Holiday season discount - 15% off
  if (context.isHolidaySeason) {
    appliedDiscounts.push({
      name: "Holiday Season",
      amount: HOLIDAY_DISCOUNT,
      type: "percentage",
    });
    totalDiscountPercentage += HOLIDAY_DISCOUNT;
  }

  // Promo code discount
  if (context.promoCode && PROMO_CODES[context.promoCode]) {
    const promo = PROMO_CODES[context.promoCode];
    if (context.cartTotal >= promo.minOrder) {
      appliedDiscounts.push({
        name: `Promo: ${context.promoCode}`,
        amount: promo.discount,
        type: "percentage",
      });
      totalDiscountPercentage += promo.discount;
    }
  }

  // Referral discount - 15% for referred customers
  if (context.referralCode) {
    appliedDiscounts.push({
      name: "Referral Bonus",
      amount: REFERRAL_DISCOUNT,
      type: "percentage",
    });
    totalDiscountPercentage += REFERRAL_DISCOUNT;
  }

  // Cap total discount at 50%
  if (totalDiscountPercentage > MAX_DISCOUNT_PERCENTAGE) {
    totalDiscountPercentage = MAX_DISCOUNT_PERCENTAGE;
  }

  const totalDiscount = context.cartTotal * totalDiscountPercentage;
  const finalTotal = context.cartTotal - totalDiscount;

  return {
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    discountPercentage: totalDiscountPercentage,
    appliedDiscounts,
    finalTotal: Math.round(finalTotal * 100) / 100,
  };
}

export function validatePromoCode(code: string, cartTotal: number): {
  valid: boolean;
  discount?: number;
  message: string;
} {
  const promo = PROMO_CODES[code];
  if (!promo) {
    return { valid: false, message: "Invalid promo code" };
  }
  if (cartTotal < promo.minOrder) {
    return {
      valid: false,
      message: `Minimum order of $${promo.minOrder} required`,
    };
  }
  return {
    valid: true,
    discount: promo.discount,
    message: `${promo.discount * 100}% discount applied!`,
  };
}

export function getLoyaltyTier(lifetimeSpend: number): string {
  if (lifetimeSpend >= LOYALTY_TIERS.platinum.threshold) return "platinum";
  if (lifetimeSpend >= LOYALTY_TIERS.gold.threshold) return "gold";
  if (lifetimeSpend >= LOYALTY_TIERS.silver.threshold) return "silver";
  if (lifetimeSpend >= LOYALTY_TIERS.bronze.threshold) return "bronze";
  return "none";
}

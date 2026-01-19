/**
 * Discount Engine Hook - Nexus Commerce
 * Contains hardcoded business logic for dynamic discount calculations
 */

import { useState, useCallback, useMemo } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface CustomerProfile {
  id: string;
  tier: 'basic' | 'premium' | 'vip' | 'enterprise';
  lifetimeSpend: number;
  orderCount: number;
  memberSince: Date;
}

export interface DiscountCalculation {
  subtotal: number;
  discounts: { name: string; amount: number; percentage: number }[];
  totalDiscount: number;
  finalTotal: number;
  savings: string;
}

// Tier discounts
const TIER_DISCOUNTS = {
  basic: 0,
  premium: 0.05,    // 5%
  vip: 0.10,        // 10%
  enterprise: 0.15, // 15%
};

// Category-specific discounts
const CATEGORY_DISCOUNTS: Record<string, number> = {
  electronics: 0.05,
  clothing: 0.10,
  clearance: 0.30,
  seasonal: 0.20,
};

// Bundle discount thresholds
const BUNDLE_THRESHOLDS = [
  { minItems: 10, discount: 0.15 },
  { minItems: 5, discount: 0.10 },
  { minItems: 3, discount: 0.05 },
];

// Spend thresholds for bonus discounts
const SPEND_BONUS_THRESHOLDS = [
  { minSpend: 500, discount: 0.10 },
  { minSpend: 250, discount: 0.05 },
  { minSpend: 100, discount: 0.02 },
];

// Loyalty duration bonuses (in months)
const LOYALTY_DURATION_BONUS = {
  24: 0.05, // 2+ years = 5% bonus
  12: 0.03, // 1+ year = 3% bonus
  6: 0.01,  // 6+ months = 1% bonus
};

// Maximum stackable discount
const MAX_TOTAL_DISCOUNT = 0.40; // 40% max

export function useDiscountEngine() {
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  // Hardcoded promo codes
  const validPromoCodes = useMemo(() => ({
    'SAVE10': 0.10,
    'WELCOME': 0.15,
    'VIP25': 0.25,
    'FLASH20': 0.20,
    'LOYALTY5': 0.05,
  }), []);

  const applyPromoCode = useCallback((code: string): { valid: boolean; message: string } => {
    const upperCode = code.toUpperCase();
    if (validPromoCodes[upperCode as keyof typeof validPromoCodes]) {
      setPromoCode(upperCode);
      setPromoDiscount(validPromoCodes[upperCode as keyof typeof validPromoCodes]);
      return { valid: true, message: `Promo code ${upperCode} applied!` };
    }
    return { valid: false, message: 'Invalid promo code' };
  }, [validPromoCodes]);

  const removePromoCode = useCallback(() => {
    setPromoCode('');
    setPromoDiscount(0);
  }, []);

  const calculateDiscounts = useCallback((
    cart: CartItem[],
    customer: CustomerProfile
  ): DiscountCalculation => {
    const discounts: DiscountCalculation['discounts'] = [];

    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (subtotal === 0) {
      return {
        subtotal: 0,
        discounts: [],
        totalDiscount: 0,
        finalTotal: 0,
        savings: '$0.00',
      };
    }

    let totalDiscountPercentage = 0;

    // 1. Tier discount
    const tierDiscount = TIER_DISCOUNTS[customer.tier];
    if (tierDiscount > 0) {
      discounts.push({
        name: `${customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)} Tier`,
        amount: subtotal * tierDiscount,
        percentage: tierDiscount,
      });
      totalDiscountPercentage += tierDiscount;
    }

    // 2. Category discounts (weighted average)
    const categoryTotals: Record<string, number> = {};
    cart.forEach(item => {
      const category = item.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + (item.price * item.quantity);
    });

    Object.entries(categoryTotals).forEach(([category, total]) => {
      const categoryDiscount = CATEGORY_DISCOUNTS[category] || 0;
      if (categoryDiscount > 0) {
        const discountAmount = total * categoryDiscount;
        discounts.push({
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Category`,
          amount: discountAmount,
          percentage: categoryDiscount,
        });
        totalDiscountPercentage += (discountAmount / subtotal);
      }
    });

    // 3. Bundle discount
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    for (const threshold of BUNDLE_THRESHOLDS) {
      if (totalItems >= threshold.minItems) {
        discounts.push({
          name: `Bundle (${threshold.minItems}+ items)`,
          amount: subtotal * threshold.discount,
          percentage: threshold.discount,
        });
        totalDiscountPercentage += threshold.discount;
        break; // Only apply highest bundle discount
      }
    }

    // 4. Spend bonus
    for (const threshold of SPEND_BONUS_THRESHOLDS) {
      if (subtotal >= threshold.minSpend) {
        discounts.push({
          name: `Spend Bonus ($${threshold.minSpend}+)`,
          amount: subtotal * threshold.discount,
          percentage: threshold.discount,
        });
        totalDiscountPercentage += threshold.discount;
        break; // Only apply highest spend bonus
      }
    }

    // 5. Loyalty duration bonus
    const memberMonths = Math.floor(
      (Date.now() - customer.memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    for (const [months, bonus] of Object.entries(LOYALTY_DURATION_BONUS).sort((a, b) => Number(b[0]) - Number(a[0]))) {
      if (memberMonths >= Number(months)) {
        discounts.push({
          name: `Loyalty (${months}+ months)`,
          amount: subtotal * bonus,
          percentage: bonus,
        });
        totalDiscountPercentage += bonus;
        break;
      }
    }

    // 6. Promo code discount
    if (promoDiscount > 0) {
      discounts.push({
        name: `Promo: ${promoCode}`,
        amount: subtotal * promoDiscount,
        percentage: promoDiscount,
      });
      totalDiscountPercentage += promoDiscount;
    }

    // Cap total discount
    if (totalDiscountPercentage > MAX_TOTAL_DISCOUNT) {
      totalDiscountPercentage = MAX_TOTAL_DISCOUNT;
    }

    const totalDiscount = subtotal * totalDiscountPercentage;
    const finalTotal = subtotal - totalDiscount;

    return {
      subtotal,
      discounts,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      finalTotal: Math.round(finalTotal * 100) / 100,
      savings: `$${totalDiscount.toFixed(2)} (${Math.round(totalDiscountPercentage * 100)}%)`,
    };
  }, [promoCode, promoDiscount]);

  return {
    calculateDiscounts,
    applyPromoCode,
    removePromoCode,
    promoCode,
    promoDiscount,
  };
}

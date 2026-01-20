import { useState, useEffect } from 'react';

interface LoyaltyVipDiscountBonusResult {
  discount: number;
  source: 'brain' | 'fallback';
}

interface LoyaltyVipDiscountBonusContext {
  customer: {
    lifetimeSpend: number;
  };
}

export function useBrainLoyaltyVipDiscountBonus(
  context: LoyaltyVipDiscountBonusContext,
  fallback: number = 0.03
): LoyaltyVipDiscountBonusResult {
  const [result, setResult] = useState<LoyaltyVipDiscountBonusResult>({
    discount: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'loyalty_vip_discount_bonus',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success && typeof data.result === 'number') {
            setResult({
              discount: data.result,
              source: 'brain'
            });
          } else {
            // API returned but no valid result, use fallback
            setResult({
              discount: fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        // Any error - network, parsing, etc. - use fallback
        if (isMounted) {
          setResult({
            discount: fallback,
            source: 'fallback'
          });
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [context.customer.lifetimeSpend, fallback]);

  return result;
}
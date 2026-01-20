import { useState, useEffect } from 'react';

interface PromoEligibilityResult {
  discount?: {
    name: string;
    type: string;
    amount: number;
  };
  eligible: boolean;
}

interface PromoEligibilityResponse extends PromoEligibilityResult {
  source: 'brain' | 'fallback';
}

interface PromoEligibilityContext {
  cartTotal: number;
  promoCode: string;
}

interface PromoEligibilityFallback {
  discount?: {
    name: string;
    type: string;
    amount: number;
  };
  eligible: boolean;
}

export function useBrainPromoMinimumOrderEligibility(
  context: PromoEligibilityContext,
  fallback: PromoEligibilityFallback
): PromoEligibilityResponse {
  const [result, setResult] = useState<PromoEligibilityResponse>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            rule: 'promo_minimum_order_eligibility',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.result !== undefined && data.result !== null) {
            setResult({
              ...data.result,
              source: 'brain'
            });
          } else {
            setResult({
              ...fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (!isCancelled) {
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.cartTotal, context.promoCode, fallback]);

  return result;
}
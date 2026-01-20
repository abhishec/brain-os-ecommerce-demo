import { useState, useEffect } from 'react';

interface DiscountResult {
  discount: number;
  source: 'brain' | 'fallback';
}

interface PromotionalCodeContext {
  promo_code?: string;
  cart_total?: number;
}

export function useBrainPromotionalCodeDiscountCalculator(
  context: PromotionalCodeContext,
  fallback: number
): DiscountResult {
  const [result, setResult] = useState<DiscountResult>({
    discount: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateDiscount() {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            rule: 'promotional_code_discount_calculator',
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
            setResult({
              discount: fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (isMounted) {
          setResult({
            discount: fallback,
            source: 'fallback'
          });
        }
      }
    }

    evaluateDiscount();

    return () => {
      isMounted = false;
    };
  }, [context.promo_code, context.cart_total, fallback]);

  return result;
}
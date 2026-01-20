import { useState, useEffect } from 'react';

interface CapTotalDiscountResult {
  cappedPercentage: number;
  source: 'brain' | 'fallback';
}

interface CapTotalDiscountContext {
  totalDiscountPercentage: number;
  MAX_DISCOUNT_PERCENTAGE: number;
}

export function useBrainCapTotalDiscountPercentage(
  context: CapTotalDiscountContext,
  fallback: number
): CapTotalDiscountResult {
  const [result, setResult] = useState<CapTotalDiscountResult>({
    cappedPercentage: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isMounted = true;

    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'limits',
            ruleName: 'cap_total_discount_percentage',
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
              cappedPercentage: data.result,
              source: 'brain'
            });
          } else {
            setResult({
              cappedPercentage: fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (isMounted) {
          setResult({
            cappedPercentage: fallback,
            source: 'fallback'
          });
        }
      }
    };

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [context.totalDiscountPercentage, context.MAX_DISCOUNT_PERCENTAGE, fallback]);

  return result;
}
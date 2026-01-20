import { useState, useEffect } from 'react';

interface LoyaltyBonusResult {
  bonus: number;
  source: 'brain' | 'fallback';
}

interface CustomerContext {
  customer: {
    order_count: number;
  };
}

export function useBrainLoyaltyBonusThresholdCheck(
  context: CustomerContext,
  fallback: number = 15
): LoyaltyBonusResult {
  const [result, setResult] = useState<LoyaltyBonusResult>({
    bonus: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            rule: 'loyalty_bonus_threshold_check',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        
        if (data.success && data.result !== undefined) {
          setResult({
            bonus: data.result,
            source: 'brain'
          });
        } else {
          // No match or evaluation failed - use fallback
          setResult({
            bonus: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          bonus: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [context.customer.order_count, fallback]);

  return result;
}
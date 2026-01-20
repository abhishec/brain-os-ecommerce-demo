import { useState, useEffect } from 'react';

interface SpendBonusResult {
  discount: number;
  source: 'brain' | 'fallback';
}

interface SpendBonusContext {
  cart_total: number;
}

export function useBrainSpendBonusVolumeDiscount(
  context: SpendBonusContext,
  fallback: number
): SpendBonusResult {
  const [result, setResult] = useState<SpendBonusResult>({
    discount: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            rule: 'spend_bonus_volume_discount',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.success && typeof data.result === 'number') {
            setResult({
              discount: data.result,
              source: 'brain'
            });
          } else {
            // No match or invalid result, use fallback
            setResult({
              discount: fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        // Always degrade gracefully to fallback on any error
        if (!isCancelled) {
          setResult({
            discount: fallback,
            source: 'fallback'
          });
        }
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.cart_total, fallback]);

  return result;
}
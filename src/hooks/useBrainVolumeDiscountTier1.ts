import { useState, useEffect } from 'react';

interface VolumeDiscountResult {
  discount: number;
  source: 'brain' | 'fallback';
}

export function useBrainVolumeDiscountTier1(
  quantity: number,
  fallback: number = 0.1
): VolumeDiscountResult {
  const [result, setResult] = useState<VolumeDiscountResult>({
    discount: fallback,
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
            domain: 'pricing',
            ruleName: 'volume_discount_tier_1',
            context: {
              quantity
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error('Evaluation failed');
        }

        const data = await response.json();
        
        if (data.matched && data.result !== undefined) {
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
      } catch (error) {
        // Zero-impact guarantee: always fall back to original value on error
        setResult({
          discount: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [quantity, fallback]);

  return result;
}
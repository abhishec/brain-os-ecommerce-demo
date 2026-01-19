import { useState, useEffect } from 'react';

type VolumeDiscountResult = {
  volumeThreshold: number;
  bulkThreshold: number;
  source: 'brain' | 'fallback';
};

type VolumeDiscountFallback = {
  volumeThreshold: number;
  bulkThreshold: number;
};

export function useBrainVolumeDiscountThresholds(
  fallback: VolumeDiscountFallback,
  context?: { order_quantity?: number }
): VolumeDiscountResult {
  const [result, setResult] = useState<VolumeDiscountResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function evaluateRule() {
      if (!context?.order_quantity) {
        // No context provided, use fallback
        if (isMounted) {
          setResult({ ...fallback, source: 'fallback' });
        }
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'volume_discount_thresholds',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success && data.result) {
            // Transform brain result to expected format
            const brainResult = {
              volumeThreshold: data.result === 'volume_discount' ? 100 : fallback.volumeThreshold,
              bulkThreshold: data.result === 'volume_discount' ? 500 : fallback.bulkThreshold,
              source: 'brain' as const
            };
            setResult(brainResult);
          } else {
            // Brain returned no match, use fallback
            setResult({ ...fallback, source: 'fallback' });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (isMounted) {
          setResult({ ...fallback, source: 'fallback' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [context?.order_quantity, fallback.volumeThreshold, fallback.bulkThreshold]);

  return result;
}
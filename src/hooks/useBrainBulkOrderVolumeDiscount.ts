import { useState, useEffect } from 'react';

interface BulkOrderDiscountResult {
  discount: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error?: string;
}

interface BulkOrderContext {
  quantity: number;
}

export function useBrainBulkOrderVolumeDiscount(
  context: BulkOrderContext,
  fallback: number = 0.15
): BulkOrderDiscountResult {
  const [result, setResult] = useState<BulkOrderDiscountResult>({
    discount: fallback,
    source: 'fallback',
    loading: false
  });

  useEffect(() => {
    let isMounted = true;

    const evaluateRule = async () => {
      setResult(prev => ({ ...prev, loading: true }));

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'bulk_order_volume_discount',
            context,
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success && data.result !== undefined) {
            setResult({
              discount: data.result,
              source: 'brain',
              loading: false
            });
          } else {
            setResult({
              discount: fallback,
              source: 'fallback',
              loading: false,
              error: data.error || 'No matching rule found'
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setResult({
            discount: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error.message : 'Evaluation failed'
          });
        }
      }
    };

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [context.quantity, fallback]);

  return result;
}
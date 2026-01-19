import { useState, useEffect } from 'react';

type BundleThreshold = {
  minItems: number;
  discount: number;
};

type VolumeDiscountResult = {
  data: BundleThreshold[];
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
};

type VolumeDiscountContext = {
  item_count: number;
};

export const useBrainVolumeDiscountBundleTiers = (
  context: VolumeDiscountContext,
  fallback: BundleThreshold[]
): VolumeDiscountResult => {
  const [data, setData] = useState<BundleThreshold[]>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'volume_discount_bundle_tiers',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          // Convert brain result to expected format
          const discountValue = result.data;
          let bundleTiers: BundleThreshold[];
          
          if (typeof discountValue === 'number') {
            // Map single discount value to tier structure based on context
            if (context.item_count >= 10) {
              bundleTiers = [
                { minItems: 10, discount: discountValue },
                { minItems: 5, discount: 0.10 },
                { minItems: 3, discount: 0.05 }
              ];
            } else if (context.item_count >= 5) {
              bundleTiers = [
                { minItems: 10, discount: 0.15 },
                { minItems: 5, discount: discountValue },
                { minItems: 3, discount: 0.05 }
              ];
            } else {
              bundleTiers = [
                { minItems: 10, discount: 0.15 },
                { minItems: 5, discount: 0.10 },
                { minItems: 3, discount: discountValue }
              ];
            }
          } else {
            bundleTiers = result.data;
          }
          
          setData(bundleTiers);
          setSource('brain');
        } else {
          // No match found, use fallback
          setData(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [context.item_count, JSON.stringify(fallback)]);

  return { data, loading, error, source };
};
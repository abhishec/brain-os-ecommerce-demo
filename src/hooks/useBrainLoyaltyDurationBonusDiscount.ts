import { useState, useEffect } from 'react';

interface LoyaltyDurationBonus {
  24: number;
  12: number;
  6: number;
}

interface UseBrainLoyaltyDurationBonusDiscountResult {
  data: LoyaltyDurationBonus;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface CustomerContext {
  customer?: {
    membership_duration_months?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export function useBrainLoyaltyDurationBonusDiscount(
  fallback: LoyaltyDurationBonus,
  context: CustomerContext = {}
): UseBrainLoyaltyDurationBonusDiscountResult {
  const [data, setData] = useState<LoyaltyDurationBonus>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let mounted = true;

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
            rule: 'loyalty_duration_bonus_discount',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (mounted) {
          if (result.success && result.data !== undefined) {
            setData(result.data);
            setSource('brain');
          } else {
            setData(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setData(fallback);
          setSource('fallback');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    evaluateRule();

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(context), JSON.stringify(fallback)]);

  return {
    data,
    loading,
    error,
    source
  };
}
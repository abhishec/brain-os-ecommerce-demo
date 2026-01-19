import { useState, useEffect } from 'react';

interface LoyaltyVipDiscountBonusResult {
  value: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface Customer {
  lifetimeSpend: number;
  [key: string]: any;
}

export function useBrainLoyaltyVipDiscountBonus(
  customer: Customer,
  fallback: number = 0.03
): LoyaltyVipDiscountBonusResult {
  const [result, setResult] = useState<LoyaltyVipDiscountBonusResult>({
    value: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!customer) {
      setResult({
        value: fallback,
        source: 'fallback',
        loading: false,
        error: null
      });
      return;
    }

    setResult(prev => ({ ...prev, loading: true, error: null }));

    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'loyalty_vip_discount_bonus',
            context: { customer },
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // If no matching rule or evaluation failed, use fallback
        if (data.error || data.value === undefined || data.value === null) {
          setResult({
            value: fallback,
            source: 'fallback',
            loading: false,
            error: data.error || null
          });
        } else {
          setResult({
            value: typeof data.value === 'number' ? data.value : fallback,
            source: 'brain',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        // ZERO-IMPACT: Always return fallback on any error
        setResult({
          value: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    evaluateRule();
  }, [customer, fallback]);

  return result;
}
import { useState, useEffect } from 'react';

interface DiscountRateResult {
  discountRate: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface CustomerTierContext {
  customer_tier: 'basic' | 'premium' | 'vip' | 'enterprise';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainCustomerTierDiscountRate(
  context: CustomerTierContext,
  fallback: number = 0
): DiscountRateResult {
  const [result, setResult] = useState<DiscountRateResult>({
    discountRate: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateDiscountRate() {
      if (!context.customer_tier) {
        setResult({
          discountRate: fallback,
          source: 'fallback',
          loading: false,
          error: null
        });
        return;
      }

      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'pricing',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          setResult({
            discountRate: typeof data.result === 'number' ? data.result : fallback,
            source: typeof data.result === 'number' ? 'brain' : 'fallback',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setResult({
            discountRate: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    evaluateDiscountRate();

    return () => {
      isMounted = false;
    };
  }, [context.customer_tier, fallback]);

  return result;
}
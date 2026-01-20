import { useState, useEffect } from 'react';

interface CustomerTierResult {
  multiplier: number;
  reason: string;
  source: 'brain' | 'fallback';
}

interface CustomerTierContext {
  customer_tier: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainCustomerTierAutoApprovalMultiplier = (
  context: CustomerTierContext,
  fallback: CustomerTierResult
) => {
  const [result, setResult] = useState<CustomerTierResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evaluateRule = async () => {
      if (!context.customer_tier) {
        setResult({ ...fallback, source: 'fallback' });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'eligibility',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.multiplier !== undefined && data.reason) {
          setResult({
            multiplier: data.multiplier,
            reason: data.reason,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [context.customer_tier, fallback]);

  return { result, loading, error };
};
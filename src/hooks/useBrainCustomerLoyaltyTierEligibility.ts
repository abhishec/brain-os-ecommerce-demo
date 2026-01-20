import { useState, useEffect } from 'react';

interface LoyaltyTierResult {
  tier: string | null;
  discount: number;
  eligible: boolean;
  threshold: number;
}

interface BrainLoyaltyTierResult extends LoyaltyTierResult {
  source: 'brain' | 'fallback';
}

interface CustomerContext {
  customer: {
    lifetime_spend: number;
  };
}

export function useBrainCustomerLoyaltyTierEligibility(
  context: CustomerContext,
  fallback: LoyaltyTierResult
): BrainLoyaltyTierResult {
  const [result, setResult] = useState<BrainLoyaltyTierResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        setLoading(true);
        setError(null);

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
        const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

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
        
        if (data && typeof data === 'object' && 'tier' in data) {
          setResult({
            tier: data.tier,
            discount: data.discount || 0,
            eligible: data.eligible || false,
            threshold: data.threshold || 0,
            source: 'brain'
          });
        } else {
          // No valid result from brain, use fallback
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Always fall back to original value on error
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [context.customer.lifetime_spend, fallback]);

  return result;
}
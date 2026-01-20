import { useState, useEffect } from 'react';

interface TierBasedApprovalLimitMultiplierContext {
  customerTier: 'enterprise' | 'vip' | string;
  limit: number;
}

interface TierBasedApprovalLimitMultiplierResult {
  multipliedLimit: number;
  source: 'brain' | 'fallback';
}

export function useBrainTierBasedApprovalLimitMultiplier(
  context: TierBasedApprovalLimitMultiplierContext,
  fallback: number
): TierBasedApprovalLimitMultiplierResult {
  const [result, setResult] = useState<TierBasedApprovalLimitMultiplierResult>({
    multipliedLimit: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
      try {
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
        
        if (data && typeof data.multipliedLimit === 'number') {
          setResult({
            multipliedLimit: data.multipliedLimit,
            source: 'brain'
          });
        } else {
          setResult({
            multipliedLimit: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          multipliedLimit: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [context.customerTier, context.limit, fallback]);

  return result;
}
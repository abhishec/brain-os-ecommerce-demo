import { useState, useEffect } from 'react';

interface VipEligibilityResult {
  tier: string;
  reason: string;
  eligible: boolean;
  source: 'brain' | 'fallback';
}

interface VipEligibilityContext {
  customer: {
    lifetime_spend: number;
  };
}

export function useBrainVipCustomerEligibilityThreshold(
  context: VipEligibilityContext,
  fallback: { tier: string; reason: string; eligible: boolean }
): VipEligibilityResult {
  const [result, setResult] = useState<VipEligibilityResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateVipEligibility = async () => {
      setIsLoading(true);
      
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
        
        if (data && typeof data === 'object' && 'tier' in data && 'reason' in data && 'eligible' in data) {
          setResult({
            tier: data.tier,
            reason: data.reason,
            eligible: data.eligible,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateVipEligibility();
  }, [context.customer.lifetime_spend, fallback]);

  return result;
}
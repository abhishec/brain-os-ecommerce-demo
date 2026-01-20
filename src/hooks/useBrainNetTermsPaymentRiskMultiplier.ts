import { useState, useEffect } from 'react';

interface NetTermsPaymentRiskMultiplierResult {
  multiplier: number;
  source: 'brain' | 'fallback';
}

interface NetTermsPaymentRiskMultiplierContext {
  payment_method?: string;
}

export function useBrainNetTermsPaymentRiskMultiplier(
  context: NetTermsPaymentRiskMultiplierContext,
  fallback: number = 0.5
): NetTermsPaymentRiskMultiplierResult {
  const [result, setResult] = useState<NetTermsPaymentRiskMultiplierResult>({
    multiplier: fallback,
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
            domain: 'risk',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data.value === 'number') {
          setResult({
            multiplier: data.value,
            source: 'brain'
          });
        } else {
          setResult({
            multiplier: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          multiplier: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [context.payment_method, fallback]);

  return result;
}
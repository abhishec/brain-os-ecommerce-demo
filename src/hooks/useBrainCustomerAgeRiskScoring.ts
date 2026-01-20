import { useState, useEffect } from 'react';

interface CustomerAgeRiskResult {
  scoreAdjustment: number;
  flags: string[];
  requiredActions: string[];
  source: 'brain' | 'fallback';
}

interface CustomerAgeRiskFactors {
  customerAge: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

const VERY_NEW_CUSTOMER_THRESHOLD = 7;
const NEW_CUSTOMER_THRESHOLD = 30;

export function useBrainCustomerAgeRiskScoring(
  factors: CustomerAgeRiskFactors,
  fallback: CustomerAgeRiskResult
) {
  const [result, setResult] = useState<CustomerAgeRiskResult>(fallback);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const evaluateCustomerAgeRisk = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const context = {
          factors,
          VERY_NEW_CUSTOMER_THRESHOLD,
          NEW_CUSTOMER_THRESHOLD
        };

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
        
        if (data && typeof data === 'object') {
          setResult({
            scoreAdjustment: data.scoreAdjustment ?? fallback.scoreAdjustment,
            flags: Array.isArray(data.flags) ? data.flags : fallback.flags,
            requiredActions: Array.isArray(data.requiredActions) ? data.requiredActions : fallback.requiredActions,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (err) {
        console.warn('Brain API failed, using fallback:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateCustomerAgeRisk();
  }, [factors.customerAge, fallback]);

  return { result, isLoading, error };
}
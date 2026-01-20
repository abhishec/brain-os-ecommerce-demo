import { useState, useEffect, useCallback } from 'react';

interface Profile {
  failedPayments: number;
}

interface FailedPaymentPenaltyResult {
  scoreAdjustment: number;
  factors: string[];
  source: 'brain' | 'fallback';
}

interface FailedPaymentPenaltyFallback {
  scoreAdjustment: number;
  factors: string[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainFailedPaymentPenaltyScoring = (
  profile: Profile,
  fallback: FailedPaymentPenaltyFallback
) => {
  const [result, setResult] = useState<FailedPaymentPenaltyResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluateRule = useCallback(async () => {
    if (!profile) return;

    setIsLoading(true);
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
          domain: 'risk',
          context: {
            profile,
            ruleName: 'failed_payment_penalty_scoring'
          },
          transformer_id: TRANSFORMER_ID,
          fallback
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && typeof data.scoreAdjustment === 'number' && Array.isArray(data.factors)) {
        setResult({
          scoreAdjustment: data.scoreAdjustment,
          factors: data.factors,
          source: 'brain'
        });
      } else {
        setResult({ ...fallback, source: 'fallback' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult({ ...fallback, source: 'fallback' });
    } finally {
      setIsLoading(false);
    }
  }, [profile, fallback]);

  useEffect(() => {
    evaluateRule();
  }, [evaluateRule]);

  return {
    result,
    isLoading,
    error,
    refetch: evaluateRule
  };
};
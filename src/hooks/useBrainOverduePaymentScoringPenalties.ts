import { useState, useEffect } from 'react';

interface OverduePaymentPenalty {
  risk_factors: {
    high: string;
    medium: string;
    critical: string;
  };
  score_adjustment: {
    high: number;
    medium: number;
    critical: number;
  };
}

interface OverduePaymentResult {
  value: OverduePaymentPenalty | null;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface Profile {
  daysOverdue: number;
}

export function useBrainOverduePaymentScoringPenalties(
  profile: Profile,
  fallback: OverduePaymentPenalty | null
): OverduePaymentResult {
  const [result, setResult] = useState<OverduePaymentResult>({
    value: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    async function evaluateOverduePaymentPenalties() {
      if (!profile) {
        setResult({
          value: fallback,
          source: 'fallback',
          loading: false,
          error: null
        });
        return;
      }

      setResult(prev => ({ ...prev, loading: true, error: null }));

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
            context: { profile },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.result !== undefined) {
          setResult({
            value: data.result,
            source: 'brain',
            loading: false,
            error: null
          });
        } else {
          setResult({
            value: fallback,
            source: 'fallback',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          value: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    evaluateOverduePaymentPenalties();
  }, [profile.daysOverdue, fallback]);

  return result;
}
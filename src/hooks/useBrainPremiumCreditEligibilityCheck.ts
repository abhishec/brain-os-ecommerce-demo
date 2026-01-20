import { useState, useEffect } from 'react';

interface CreditCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

interface BrainResult {
  result: CreditCheckResult | null;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainPremiumCreditEligibilityCheck = (
  creditScore: number,
  fallback: CreditCheckResult | null
): BrainResult => {
  const [result, setResult] = useState<CreditCheckResult | null>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evaluateRule = async () => {
      if (creditScore === undefined || creditScore === null) {
        setResult(fallback);
        setSource('fallback');
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
            context: { creditScore },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.result !== undefined) {
          setResult(data.result);
          setSource('brain');
        } else {
          setResult(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setResult(fallback);
        setSource('fallback');
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [creditScore, fallback]);

  return { result, source, loading, error };
};
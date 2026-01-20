import { useState, useEffect } from 'react';

interface AgeEligibilityResult {
  reason?: string;
  eligible: boolean;
  check_name?: string;
}

interface BrainAgeEligibilityResult {
  result: AgeEligibilityResult;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainMinimumAgeEligibilityCheck(
  userAge: number,
  fallback: AgeEligibilityResult = { eligible: true }
): BrainAgeEligibilityResult {
  const [result, setResult] = useState<AgeEligibilityResult>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateAgeEligibility() {
      if (userAge === undefined || userAge === null) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const context = {
          user: {
            age: userAge
          }
        };

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
        
        if (isMounted) {
          if (data && typeof data === 'object') {
            setResult(data);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        console.warn('Brain API failed, using fallback:', err);
        if (isMounted) {
          setResult(fallback);
          setSource('fallback');
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    evaluateAgeEligibility();

    return () => {
      isMounted = false;
    };
  }, [userAge, JSON.stringify(fallback)]);

  return {
    result,
    source,
    loading,
    error
  };
}
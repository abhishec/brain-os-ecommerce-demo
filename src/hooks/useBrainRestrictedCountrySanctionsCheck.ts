import { useState, useEffect } from 'react';

interface CountryCheckResult {
  reason: string;
  eligible: boolean;
  check_name: string;
}

interface BrainResult {
  result: CountryCheckResult | null;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainRestrictedCountrySanctionsCheck(
  userCountry: string,
  fallback: CountryCheckResult | null
): BrainResult {
  const [result, setResult] = useState<CountryCheckResult | null>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userCountry) {
      setResult(fallback);
      setSource('fallback');
      return;
    }

    const fetchBrainResult = async () => {
      setLoading(true);
      setError(null);

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
            context: { user: { country: userCountry } },
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
        console.warn('Brain API failed, using fallback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchBrainResult();
  }, [userCountry, fallback]);

  return { result, source, loading, error };
}
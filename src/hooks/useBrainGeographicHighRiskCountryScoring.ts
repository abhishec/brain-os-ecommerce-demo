import { useState, useEffect } from 'react';

interface GeographicRiskResult {
  flags: string[];
  score_increment: number;
  required_actions: string[];
  source: 'brain' | 'fallback';
}

interface RiskFactors {
  countryCode: string;
  [key: string]: any;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainGeographicHighRiskCountryScoring = (
  factors: RiskFactors,
  fallback: GeographicRiskResult
) => {
  const [result, setResult] = useState<GeographicRiskResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const evaluateRule = async () => {
      if (!factors?.countryCode) {
        setResult({ ...fallback, source: 'fallback' });
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
            domain: 'risk',
            context: {
              rule: 'geographic_high_risk_country_scoring',
              factors
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data?.result && typeof data.result === 'object') {
          setResult({
            flags: data.result.flags || fallback.flags,
            score_increment: data.result.score_increment ?? fallback.score_increment,
            required_actions: data.result.required_actions || fallback.required_actions,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [factors.countryCode, JSON.stringify(fallback)]);

  return { result, loading, error };
};
import { useState, useEffect } from 'react';

interface GeographicRiskResult {
  action: 'REJECT' | 'REVIEW';
  reason: string;
  risk_level: 'BLOCKED' | 'HIGH';
  source: 'brain' | 'fallback';
}

interface TransactionContext {
  transaction: {
    country_code: string;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainGeographicRiskAssessment = (
  context: TransactionContext,
  fallback: GeographicRiskResult
) => {
  const [result, setResult] = useState<GeographicRiskResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evaluateRisk = async () => {
      if (!context.transaction?.country_code) {
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
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result && typeof data.result === 'object') {
          setResult({
            action: data.result.action || fallback.action,
            reason: data.result.reason || fallback.reason,
            risk_level: data.result.risk_level || fallback.risk_level,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setLoading(false);
      }
    };

    evaluateRisk();
  }, [context.transaction?.country_code, fallback]);

  return { result, loading, error };
};
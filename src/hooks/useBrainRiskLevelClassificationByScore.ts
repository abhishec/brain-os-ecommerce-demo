import { useState, useEffect } from 'react';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface RiskLevelResult {
  level: RiskLevel;
  source: 'brain' | 'fallback';
}

interface RiskContext {
  score: number;
}

export const useBrainRiskLevelClassificationByScore = (
  context: RiskContext,
  fallback: RiskLevel
) => {
  const [result, setResult] = useState<RiskLevelResult>({
    level: fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const evaluateRiskLevel = async () => {
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
            domain: 'risk', 
            context, 
            transformer_id: TRANSFORMER_ID,
            fallback 
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.result && ['critical', 'high', 'medium', 'low'].includes(data.result)) {
          setResult({
            level: data.result as RiskLevel,
            source: 'brain'
          });
        } else {
          setResult({
            level: fallback,
            source: 'fallback'
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setResult({
          level: fallback,
          source: 'fallback'
        });
      } finally {
        setLoading(false);
      }
    };

    evaluateRiskLevel();
  }, [context.score, fallback]);

  return { result, loading, error };
};
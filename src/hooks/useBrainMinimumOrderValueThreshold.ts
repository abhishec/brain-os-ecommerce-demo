import { useState, useEffect } from 'react';

interface MinimumOrderValueResult {
  threshold: number;
  source: 'brain' | 'fallback';
}

export const useBrainMinimumOrderValueThreshold = (fallback: number = 25) => {
  const [result, setResult] = useState<MinimumOrderValueResult>({
    threshold: fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMinimumOrderValue = async () => {
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
            domain: 'limits',
            context: { rule_name: 'minimum_order_value_threshold' },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data?.result !== undefined && typeof data.result === 'number') {
          setResult({
            threshold: data.result,
            source: 'brain'
          });
        } else {
          setResult({
            threshold: fallback,
            source: 'fallback'
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult({
          threshold: fallback,
          source: 'fallback'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMinimumOrderValue();
  }, [fallback]);

  return { ...result, loading, error };
};
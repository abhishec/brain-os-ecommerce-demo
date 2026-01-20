import { useState, useEffect } from 'react';

interface OrderHistoryLoyaltyScoringResult {
  scoreAdjustment: number;
  flags: string[];
  source: 'brain' | 'fallback';
}

interface OrderHistoryLoyaltyScoringInput {
  factors: {
    previousOrders: number;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainOrderHistoryLoyaltyScoring = (
  input: OrderHistoryLoyaltyScoringInput,
  fallback: OrderHistoryLoyaltyScoringResult
) => {
  const [result, setResult] = useState<OrderHistoryLoyaltyScoringResult>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evaluateRule = async () => {
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
              rule: 'order_history_loyalty_scoring',
              input
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data.scoreAdjustment === 'number' && Array.isArray(data.flags)) {
          setResult({
            scoreAdjustment: data.scoreAdjustment,
            flags: data.flags,
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

    evaluateRule();
  }, [input.factors.previousOrders, fallback]);

  return { result, loading, error };
};
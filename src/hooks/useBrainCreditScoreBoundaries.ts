import { useState, useEffect } from 'react';

interface CreditScoreBoundaries {
  max_score: number;
  min_score: number;
  base_score: number;
}

interface BrainResult {
  boundaries: CreditScoreBoundaries;
  source: 'brain' | 'fallback';
}

export function useBrainCreditScoreBoundaries(
  fallback: CreditScoreBoundaries = { max_score: 850, min_score: 300, base_score: 500 }
): BrainResult {
  const [result, setResult] = useState<BrainResult>({
    boundaries: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const fetchBoundaries = async () => {
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
            context: { scoring_request: true },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.max_score && data.min_score && data.base_score) {
          setResult({
            boundaries: {
              max_score: data.max_score,
              min_score: data.min_score,
              base_score: data.base_score
            },
            source: 'brain'
          });
        } else {
          setResult({ boundaries: fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ boundaries: fallback, source: 'fallback' });
      }
    };

    fetchBoundaries();
  }, []);

  return result;
}
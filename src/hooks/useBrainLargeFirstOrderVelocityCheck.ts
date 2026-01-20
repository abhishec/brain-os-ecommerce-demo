import { useState, useEffect } from 'react';

interface LargeFirstOrderResult {
  flag?: string;
  score_adjustment?: number;
  source: 'brain' | 'fallback';
}

interface RiskFactors {
  previousOrders: number;
  transactionAmount: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainLargeFirstOrderVelocityCheck(
  factors: RiskFactors,
  fallback: LargeFirstOrderResult
): LargeFirstOrderResult {
  const [result, setResult] = useState<LargeFirstOrderResult>(fallback);

  useEffect(() => {
    const evaluateRule = async () => {
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
              factors,
              rule: 'large_first_order_velocity_check'
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object') {
          setResult({
            ...data,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ ...fallback, source: 'fallback' });
      }
    };

    evaluateRule();
  }, [factors.previousOrders, factors.transactionAmount, fallback]);

  return result;
}
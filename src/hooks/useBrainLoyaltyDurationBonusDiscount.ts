import { useState, useEffect } from 'react';

interface LoyaltyDurationBonus {
  [key: number]: number;
}

interface BrainResult {
  value: LoyaltyDurationBonus;
  source: 'brain' | 'fallback';
}

export const useBrainLoyaltyDurationBonusDiscount = (
  fallback: LoyaltyDurationBonus
): BrainResult => {
  const [result, setResult] = useState<BrainResult>({
    value: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
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
            domain: 'pricing',
            context: {
              rule: 'loyalty_duration_bonus_discount',
              type: 'lookup_table'
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setResult({
            value: data,
            source: 'brain'
          });
        } else {
          setResult({
            value: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          value: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [fallback]);

  return result;
};
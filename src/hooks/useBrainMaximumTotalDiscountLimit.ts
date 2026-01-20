import { useState, useEffect } from 'react';

interface MaximumTotalDiscountLimitResult {
  maxTotalDiscount: number;
  source: 'brain' | 'fallback';
}

interface MaximumTotalDiscountLimitContext {
  total_discount_percentage?: number;
}

export const useBrainMaximumTotalDiscountLimit = (
  context: MaximumTotalDiscountLimitContext = {},
  fallback: number = 0.40
): MaximumTotalDiscountLimitResult => {
  const [result, setResult] = useState<MaximumTotalDiscountLimitResult>({
    maxTotalDiscount: fallback,
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
            domain: 'limits',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data.maxTotalDiscount === 'number') {
          setResult({
            maxTotalDiscount: data.maxTotalDiscount,
            source: 'brain'
          });
        } else {
          setResult({
            maxTotalDiscount: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          maxTotalDiscount: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [context.total_discount_percentage, fallback]);

  return result;
};
import { useState, useEffect } from 'react';

interface MaximumDiscountPercentageLimitResult {
  maxDiscountPercentage: number;
  source: 'brain' | 'fallback';
}

interface MaximumDiscountPercentageLimitContext {
  requested_discount_percentage?: number;
}

export const useBrainMaximumDiscountPercentageLimit = (
  context: MaximumDiscountPercentageLimitContext = {},
  fallback: number = 0.50
): MaximumDiscountPercentageLimitResult => {
  const [result, setResult] = useState<MaximumDiscountPercentageLimitResult>({
    maxDiscountPercentage: fallback,
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
        
        if (data && typeof data.maxDiscountPercentage === 'number') {
          setResult({
            maxDiscountPercentage: data.maxDiscountPercentage,
            source: 'brain'
          });
        } else {
          setResult({
            maxDiscountPercentage: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          maxDiscountPercentage: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [context.requested_discount_percentage, fallback]);

  return result;
};
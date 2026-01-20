import { useState, useEffect } from 'react';

interface PromotionalCodeDiscountResult {
  [key: string]: number;
}

interface BrainResult {
  value: PromotionalCodeDiscountResult;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainPromotionalCodeDiscountLookup = (
  promoCode: string,
  fallback: PromotionalCodeDiscountResult
): BrainResult => {
  const [result, setResult] = useState<BrainResult>({
    value: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const fetchBrainResult = async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'pricing',
            context: { promo_code: promoCode },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.value === 'object' && data.value !== null) {
            setResult({
              value: data.value,
              source: 'brain'
            });
            return;
          }
        }
      } catch (error) {
        console.warn('Brain API failed, using fallback:', error);
      }

      // Always ensure fallback is used if brain fails
      setResult({
        value: fallback,
        source: 'fallback'
      });
    };

    fetchBrainResult();
  }, [promoCode, fallback]);

  return result;
};
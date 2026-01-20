import { useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

interface CategoryDiscountResult {
  discountRates: Record<string, number>;
  source: 'brain' | 'fallback';
}

export function useBrainCategoryDiscountRates(
  fallback: Record<string, number>
): CategoryDiscountResult {
  const [result, setResult] = useState<CategoryDiscountResult>({
    discountRates: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const fetchDiscountRates = async () => {
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
            context: { rule: 'category_discount_rates' },
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
            discountRates: data,
            source: 'brain'
          });
        }
      } catch (error) {
        console.warn('BrainOS category discount rates evaluation failed, using fallback:', error);
        // Keep fallback value already set in initial state
      }
    };

    fetchDiscountRates();
  }, [fallback]);

  return result;
}
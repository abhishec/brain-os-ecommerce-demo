import { useState, useEffect } from 'react';

interface PromoCode {
  discount: number;
  minOrder: number;
  maxUses?: number;
}

type PromoCodesMap = Record<string, PromoCode>;

interface DiscountResult {
  promoCodes: PromoCodesMap;
  source: 'brain' | 'fallback';
}

interface DiscountContext {
  promo_code?: string;
  cart_total?: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainPromotionalCodeDiscountCalculator(
  context: DiscountContext,
  fallback: PromoCodesMap
): DiscountResult {
  const [result, setResult] = useState<DiscountResult>({
    promoCodes: fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateRule = async () => {
      if (!context.promo_code) {
        setResult({ promoCodes: fallback, source: 'fallback' });
        return;
      }

      setIsLoading(true);
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
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.result && typeof data.result === 'object') {
          // Transform brain result to match fallback structure
          const brainPromoCodes: PromoCodesMap = {};
          
          // Map brain discount values to promo code structure
          const discountMap = data.result;
          Object.entries(fallback).forEach(([code, config]) => {
            if (discountMap[code] !== undefined) {
              brainPromoCodes[code] = {
                ...config,
                discount: discountMap[code]
              };
            } else {
              brainPromoCodes[code] = config;
            }
          });
          
          setResult({
            promoCodes: brainPromoCodes,
            source: 'brain'
          });
        } else {
          setResult({ promoCodes: fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ promoCodes: fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRule();
  }, [context.promo_code, context.cart_total, fallback]);

  return result;
}
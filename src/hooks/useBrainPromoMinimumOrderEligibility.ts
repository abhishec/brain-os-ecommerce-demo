import { useState, useEffect } from 'react';

interface PromoDiscount {
  name: string;
  type: 'percentage';
  amount: number;
}

interface PromoEligibilityResult {
  discount?: PromoDiscount;
  eligible: boolean;
}

interface UseBrainPromoMinimumOrderEligibilityParams {
  cartTotal: number;
  promoCode: string;
  promo: {
    minOrder: number;
    discount: number;
  };
  fallback: PromoEligibilityResult;
}

interface UseBrainPromoMinimumOrderEligibilityReturn {
  result: PromoEligibilityResult;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainPromoMinimumOrderEligibility = ({
  cartTotal,
  promoCode,
  promo,
  fallback
}: UseBrainPromoMinimumOrderEligibilityParams): UseBrainPromoMinimumOrderEligibilityReturn => {
  const [result, setResult] = useState<PromoEligibilityResult>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    const evaluateEligibility = async () => {
      if (!cartTotal || !promoCode || !promo) {
        setResult(fallback);
        setSource('fallback');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const domain = 'eligibility';
        const context = {
          cartTotal,
          promoCode,
          promo
        };

        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ 
            domain, 
            context, 
            transformer_id: TRANSFORMER_ID,
            fallback 
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object' && 'eligible' in data) {
          setResult(data);
          setSource('brain');
        } else {
          setResult(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateEligibility();
  }, [cartTotal, promoCode, promo?.minOrder, promo?.discount, fallback]);

  return { result, loading, error, source };
};
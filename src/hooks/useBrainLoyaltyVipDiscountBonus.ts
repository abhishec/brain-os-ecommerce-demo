import { useState, useEffect } from 'react';

interface LoyaltyVipDiscountBonusResult {
  discount: number;
  source: 'brain' | 'fallback';
}

interface Customer {
  lifetimeSpend: number;
}

const useBrainLoyaltyVipDiscountBonus = (
  customer: Customer,
  fallback: number = 0.03
): LoyaltyVipDiscountBonusResult => {
  const [result, setResult] = useState<LoyaltyVipDiscountBonusResult>({
    discount: fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        setLoading(true);
        
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
            context: { customer },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data.discount === 'number') {
          setResult({
            discount: data.discount,
            source: 'brain'
          });
        } else {
          setResult({
            discount: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          discount: fallback,
          source: 'fallback'
        });
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [customer.lifetimeSpend, fallback]);

  return result;
};

export default useBrainLoyaltyVipDiscountBonus;
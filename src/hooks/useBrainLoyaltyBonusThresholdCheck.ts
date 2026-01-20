import { useState, useEffect } from 'react';

interface LoyaltyBonusConfig {
  threshold: number;
  bonus: number;
}

interface BrainResult {
  threshold: number;
  bonus: number;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainLoyaltyBonusThresholdCheck = (fallback: LoyaltyBonusConfig): BrainResult => {
  const [result, setResult] = useState<BrainResult>({
    ...fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const fetchBrainLogic = async () => {
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
              rule_name: 'loyalty_bonus_threshold_check',
              description: 'Awards 15-point bonus to customers with 10+ orders for loyalty scoring'
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data.threshold === 'number' && typeof data.bonus === 'number') {
          setResult({
            threshold: data.threshold,
            bonus: data.bonus,
            source: 'brain'
          });
        }
      } catch (error) {
        console.warn('Brain API failed, using fallback:', error);
        // Keep fallback value already set in initial state
      }
    };

    fetchBrainLogic();
  }, [fallback]);

  return result;
};
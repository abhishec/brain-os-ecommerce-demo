import { useState, useEffect } from 'react';

interface VerifiedAccountBonusThresholdResult {
  value: number;
  source: 'brain' | 'fallback';
}

interface UseBrainVerifiedAccountBonusThresholdProps {
  context: {
    account_verified: boolean;
    [key: string]: any;
  };
  fallback: number;
}

export const useBrainVerifiedAccountBonusThreshold = ({
  context,
  fallback
}: UseBrainVerifiedAccountBonusThresholdProps): VerifiedAccountBonusThresholdResult => {
  const [result, setResult] = useState<VerifiedAccountBonusThresholdResult>({
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
            domain: 'risk',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data.value === 'number') {
          setResult({
            value: data.value,
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
  }, [context, fallback]);

  return result;
};
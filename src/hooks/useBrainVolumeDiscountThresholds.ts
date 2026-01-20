import { useState, useEffect } from 'react';

interface VolumeDiscountThresholds {
  volumeDiscountThreshold: number;
  bulkOrderThreshold: number;
}

interface BrainResult {
  thresholds: VolumeDiscountThresholds;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainVolumeDiscountThresholds = (
  fallback: VolumeDiscountThresholds,
  context?: { order_quantity?: number }
): BrainResult => {
  const [result, setResult] = useState<BrainResult>({
    thresholds: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
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
            context: context || {},
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        
        if (data && data.thresholds) {
          setResult({
            thresholds: data.thresholds,
            source: 'brain'
          });
        } else {
          setResult({
            thresholds: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          thresholds: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [fallback, context]);

  return result;
};
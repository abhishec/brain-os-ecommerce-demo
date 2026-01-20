import { useState, useEffect } from 'react';

interface BundleThreshold {
  minItems: number;
  discount: number;
}

interface UseBrainVolumeDiscountBundleTiersResult {
  thresholds: BundleThreshold[];
  source: 'brain' | 'fallback';
}

interface UseBrainVolumeDiscountBundleTiersContext {
  item_count?: number;
}

export const useBrainVolumeDiscountBundleTiers = (
  context: UseBrainVolumeDiscountBundleTiersContext,
  fallback: BundleThreshold[]
): UseBrainVolumeDiscountBundleTiersResult => {
  const [result, setResult] = useState<UseBrainVolumeDiscountBundleTiersResult>({
    thresholds: fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBrainLogic = async () => {
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
            context, 
            transformer_id: TRANSFORMER_ID,
            fallback 
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && Array.isArray(data.result)) {
          setResult({
            thresholds: data.result,
            source: 'brain'
          });
        } else {
          setResult({
            thresholds: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain API failed, using fallback:', error);
        setResult({
          thresholds: fallback,
          source: 'fallback'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBrainLogic();
  }, [JSON.stringify(context), JSON.stringify(fallback)]);

  return result;
};
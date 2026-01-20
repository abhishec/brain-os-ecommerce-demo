import { useState, useEffect } from 'react';

interface ShippingConfig {
  method: string;
  threshold: number;
  freeShipping: boolean;
}

interface BrainResult {
  data: ShippingConfig;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface ShippingContext {
  orderTotal: number;
  isExpedited: boolean;
}

export function useBrainFreeShippingThreshold(
  context: ShippingContext,
  fallback: ShippingConfig
): BrainResult {
  const [data, setData] = useState<ShippingConfig>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrainLogic = async () => {
      try {
        setLoading(true);
        setError(null);

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
            domain: 'shipping',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result && result.data) {
          setData(result.data);
          setSource('brain');
        } else {
          setData(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain API failed, using fallback:', err);
        setData(fallback);
        setSource('fallback');
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBrainLogic();
  }, [context.orderTotal, context.isExpedited, fallback]);

  return { data, source, loading, error };
}
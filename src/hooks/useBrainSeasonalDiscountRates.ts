import { useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

interface SeasonalDiscountRates {
  holiday: number;
  summer_sale: number;
  black_friday: number;
}

interface BrainSeasonalDiscountRatesResult {
  rates: SeasonalDiscountRates;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainSeasonalDiscountRates(
  context: { promotion_type?: string },
  fallback: SeasonalDiscountRates = {
    holiday: 0.15,
    summer_sale: 0.1,
    black_friday: 0.25
  }
): BrainSeasonalDiscountRatesResult {
  const [rates, setRates] = useState<SeasonalDiscountRates>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBrainRates = async () => {
      try {
        setLoading(true);
        setError(null);

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

        const result = await response.json();

        if (isMounted) {
          if (result && typeof result === 'object' && 
              typeof result.holiday === 'number' && 
              typeof result.summer_sale === 'number' && 
              typeof result.black_friday === 'number') {
            setRates(result);
            setSource('brain');
          } else {
            setRates(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setRates(fallback);
          setSource('fallback');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBrainRates();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(context), JSON.stringify(fallback)]);

  return { rates, source, loading, error };
}
import { useState, useEffect } from 'react';

interface OrderLimitResult {
  reason: string;
  status: string;
  conditions: string[];
  approver_level: string;
  escalation_path: string[];
}

interface BrainResult {
  result: OrderLimitResult | null;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface OrderContext {
  customer: {
    is_new_customer: boolean;
  };
  order: {
    total: number;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainNewCustomerOrderLimitEnforcement = (
  context: OrderContext,
  fallback: OrderLimitResult | null
): BrainResult => {
  const [result, setResult] = useState<OrderLimitResult | null>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evaluateRule = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'limits',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.result !== undefined) {
          setResult(data.result);
          setSource('brain');
        } else {
          setResult(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setResult(fallback);
        setSource('fallback');
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [context.customer.is_new_customer, context.order.total, fallback]);

  return {
    result,
    source,
    loading,
    error
  };
};
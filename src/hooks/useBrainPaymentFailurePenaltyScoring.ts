import { useState, useEffect } from 'react';

interface PaymentFailurePenaltyScoringResult {
  failedPaymentPenalty: number;
  disputePenalty: number;
  source: 'brain' | 'fallback';
}

interface PaymentFailurePenaltyScoringContext {
  event_type?: string;
  [key: string]: any;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainPaymentFailurePenaltyScoring = (
  context: PaymentFailurePenaltyScoringContext,
  fallback: PaymentFailurePenaltyScoringResult = {
    failedPaymentPenalty: 30,
    disputePenalty: 25,
    source: 'fallback'
  }
) => {
  const [result, setResult] = useState<PaymentFailurePenaltyScoringResult>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
        
        if (data && typeof data === 'object') {
          // Handle the conditional logic result from the brain
          let failedPaymentPenalty = fallback.failedPaymentPenalty;
          let disputePenalty = fallback.disputePenalty;
          
          if (context.event_type === 'payment_failure') {
            failedPaymentPenalty = data.value || data.result || 30;
          } else if (context.event_type === 'dispute') {
            disputePenalty = data.value || data.result || 25;
          }
          
          setResult({
            failedPaymentPenalty,
            disputePenalty,
            source: 'brain'
          });
        } else {
          setResult(fallback);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setResult(fallback);
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [context.event_type]);

  return { ...result, loading, error };
};
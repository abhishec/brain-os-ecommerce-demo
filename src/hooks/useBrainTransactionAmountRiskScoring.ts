import { useState, useEffect } from 'react';

interface TransactionRiskResult {
  flags: string[];
  score_increment: number;
  required_actions: string[];
  source: 'brain' | 'fallback';
}

interface TransactionFactors {
  transactionAmount: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainTransactionAmountRiskScoring(
  factors: TransactionFactors,
  fallback: Omit<TransactionRiskResult, 'source'>
): TransactionRiskResult {
  const [result, setResult] = useState<TransactionRiskResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const evaluateRisk = async () => {
      if (!factors?.transactionAmount) {
        setResult({ ...fallback, source: 'fallback' });
        return;
      }

      setLoading(true);
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
              rule: 'transaction_amount_risk_scoring',
              factors
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data?.result && typeof data.result === 'object') {
          setResult({
            flags: data.result.flags || fallback.flags,
            score_increment: data.result.score_increment ?? fallback.score_increment,
            required_actions: data.result.required_actions || fallback.required_actions,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setLoading(false);
      }
    };

    evaluateRisk();
  }, [factors.transactionAmount, fallback]);

  return result;
}
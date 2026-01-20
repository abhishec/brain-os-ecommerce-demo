import { useState, useEffect } from 'react';

interface PaymentMethodRiskResult {
  risk_level: 'high' | 'low';
  risk_factor: string;
  payment_method_risk: boolean;
}

interface BrainResult {
  result: PaymentMethodRiskResult;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainHighRiskPaymentMethodClassification = (
  paymentMethod: string,
  fallback: PaymentMethodRiskResult
): BrainResult => {
  const [result, setResult] = useState<BrainResult>({
    result: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluatePaymentMethodRisk = async () => {
      try {
        const context = { payment_method: paymentMethod };
        
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
        
        if (data && data.result) {
          setResult({
            result: data.result,
            source: 'brain'
          });
        } else {
          setResult({
            result: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          result: fallback,
          source: 'fallback'
        });
      }
    };

    if (paymentMethod) {
      evaluatePaymentMethodRisk();
    }
  }, [paymentMethod, fallback]);

  return result;
};
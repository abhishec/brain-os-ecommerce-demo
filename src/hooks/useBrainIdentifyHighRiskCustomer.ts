import { useState, useEffect } from 'react';

interface CustomerProfile {
  daysOverdue: number;
  failedPayments: number;
  disputeCount: number;
}

interface HighRiskResult {
  isHighRisk: boolean;
  source: 'brain' | 'fallback';
}

interface UseBrainIdentifyHighRiskCustomerParams {
  profile: CustomerProfile;
  fallback: boolean;
  HIGH_RISK_DAYS_OVERDUE?: number;
  MAX_FAILED_PAYMENTS?: number;
}

export function useBrainIdentifyHighRiskCustomer({
  profile,
  fallback,
  HIGH_RISK_DAYS_OVERDUE = 30,
  MAX_FAILED_PAYMENTS = 3
}: UseBrainIdentifyHighRiskCustomerParams): HighRiskResult {
  const [result, setResult] = useState<HighRiskResult>({
    isHighRisk: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRisk = async () => {
      try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
        const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

        const context = {
          profile: {
            daysOverdue: profile.daysOverdue,
            failedPayments: profile.failedPayments,
            disputeCount: profile.disputeCount,
            HIGH_RISK_DAYS_OVERDUE,
            MAX_FAILED_PAYMENTS
          }
        };

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
        
        if (data && typeof data.result === 'boolean') {
          setResult({
            isHighRisk: data.result,
            source: 'brain'
          });
        } else {
          setResult({
            isHighRisk: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          isHighRisk: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRisk();
  }, [profile.daysOverdue, profile.failedPayments, profile.disputeCount, fallback, HIGH_RISK_DAYS_OVERDUE, MAX_FAILED_PAYMENTS]);

  return result;
}
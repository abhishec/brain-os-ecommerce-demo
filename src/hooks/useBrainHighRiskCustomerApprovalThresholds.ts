import { useState, useEffect } from 'react';

interface ApprovalThresholds {
  approval_type: string;
  auto_approval_limit: number;
  review_required_threshold: number;
}

interface BrainResult {
  data: ApprovalThresholds;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainHighRiskCustomerApprovalThresholds(
  customerRiskLevel: string,
  fallback: ApprovalThresholds
): BrainResult {
  const [result, setResult] = useState<BrainResult>({
    data: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!customerRiskLevel) {
      setResult({
        data: fallback,
        source: 'fallback',
        loading: false,
        error: null
      });
      return;
    }

    const evaluateRule = async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));

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
            context: {
              customer: {
                risk_level: customerRiskLevel
              }
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.approval_type && typeof data.auto_approval_limit === 'number' && typeof data.review_required_threshold === 'number') {
          setResult({
            data,
            source: 'brain',
            loading: false,
            error: null
          });
        } else {
          setResult({
            data: fallback,
            source: 'fallback',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        setResult({
          data: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    evaluateRule();
  }, [customerRiskLevel, fallback]);

  return result;
}
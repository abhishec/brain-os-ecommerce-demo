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
  error: Error | null;
}

export const useBrainHighRiskCustomerApprovalThresholds = (
  fallback: ApprovalThresholds,
  context: { customer?: { risk_level?: string } } = {}
): BrainResult => {
  const [result, setResult] = useState<BrainResult>({
    data: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    const evaluateRule = async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'high_risk_customer_approval_thresholds',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.result) {
          setResult({
            data: data.result,
            source: 'brain',
            loading: false,
            error: null
          });
        } else {
          // No match found, use fallback
          setResult({
            data: fallback,
            source: 'fallback',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        // Always fallback on error - ZERO-IMPACT guarantee
        setResult({
          data: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error')
        });
      }
    };

    evaluateRule();
  }, [fallback, context]);

  return result;
};
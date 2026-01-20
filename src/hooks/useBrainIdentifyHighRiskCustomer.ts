import { useState, useEffect } from 'react';

interface CustomerProfile {
  daysOverdue: number;
  failedPayments: number;
  disputeCount: number;
}

interface UseBrainIdentifyHighRiskCustomerResult {
  isHighRisk: boolean;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

export function useBrainIdentifyHighRiskCustomer(
  profile: CustomerProfile,
  fallback: boolean
): UseBrainIdentifyHighRiskCustomerResult {
  const [result, setResult] = useState<boolean>(fallback);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    const evaluateRisk = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'identify_high_risk_customer',
            context: {
              profile
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.result !== undefined) {
          setResult(data.result);
          setSource('brain');
        } else {
          setResult(fallback);
          setSource('fallback');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRisk();
  }, [profile.daysOverdue, profile.failedPayments, profile.disputeCount, fallback]);

  return {
    isHighRisk: result,
    loading,
    error,
    source
  };
}
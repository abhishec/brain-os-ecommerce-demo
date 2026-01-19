import { useState, useEffect } from 'react';

interface RiskThresholdResult {
  action: 'flag_payment' | 'block_payment';
  risk_level: 'high' | 'critical';
  threshold_exceeded: 'MAX_FAILED_PAYMENTS' | 'CRITICAL_FAILED_PAYMENTS';
}

interface RiskThresholdResponse {
  result: RiskThresholdResult;
  source: 'brain' | 'fallback';
}

interface RiskContext {
  failed_payment_count: number;
}

export function useBrainFailedPaymentRiskThreshold(
  context: RiskContext,
  fallback: RiskThresholdResult
): RiskThresholdResponse {
  const [result, setResult] = useState<RiskThresholdResponse>({
    result: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'failed_payment_risk_threshold',
            context,
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result && data.matched) {
          setResult({
            result: data.result,
            source: 'brain'
          });
        } else {
          // No match found, use fallback
          setResult({
            result: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        // Always fallback on error - zero impact guarantee
        setResult({
          result: fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [context.failed_payment_count, fallback]);

  return result;
}
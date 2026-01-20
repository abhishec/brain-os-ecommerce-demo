import { useState, useEffect } from 'react';

interface TransactionRiskResult {
  flags: string[];
  score_increment: number;
  required_actions: string[];
}

interface BrainResult {
  result: TransactionRiskResult;
  source: 'brain' | 'fallback';
}

interface TransactionFactors {
  transactionAmount: number;
}

export function useBrainTransactionAmountRiskScoring(
  factors: TransactionFactors,
  fallback: TransactionRiskResult
): BrainResult {
  const [result, setResult] = useState<BrainResult>({
    result: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'transaction_amount_risk_scoring',
            context: { factors },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled && data.result) {
          setResult({
            result: data.result,
            source: 'brain'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        // Keep fallback value - no action needed as it's already set
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [factors.transactionAmount, fallback]);

  return result;
}
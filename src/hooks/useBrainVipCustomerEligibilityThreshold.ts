import { useState, useEffect } from 'react';

type VipEligibilityResult = {
  tier: string;
  reason: string;
  eligible: boolean;
};

type VipEligibilityResponse = VipEligibilityResult & {
  source: 'brain' | 'fallback';
};

export function useBrainVipCustomerEligibilityThreshold(
  customer: { lifetime_spend: number },
  fallback: VipEligibilityResult
): VipEligibilityResponse {
  const [result, setResult] = useState<VipEligibilityResponse>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const evaluateRule = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            ruleName: 'vip_customer_eligibility_threshold',
            context: {
              customer
            },
            fallback
          })
        });

        if (!response.ok) {
          throw new Error('Evaluation failed');
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.result) {
            setResult({
              ...data.result,
              source: 'brain'
            });
          } else {
            setResult({
              ...fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('BrainOS evaluation failed, using fallback:', error);
        if (!isCancelled) {
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [customer.lifetime_spend, fallback]);

  return result;
}
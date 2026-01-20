import { useState, useEffect } from 'react';

interface MembershipDurationResult {
  memberMonths: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: Error | null;
}

interface Customer {
  memberSince?: Date;
}

export function useBrainCalculateMembershipDurationMonths(
  customer: Customer,
  fallback: number
): MembershipDurationResult {
  const [result, setResult] = useState<MembershipDurationResult>({
    memberMonths: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    // If customer.memberSince doesn't exist, return fallback immediately
    if (!customer.memberSince) {
      setResult({
        memberMonths: fallback,
        source: 'fallback',
        loading: false,
        error: null
      });
      return;
    }

    setResult(prev => ({ ...prev, loading: true, error: null }));

    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'calculation',
            ruleName: 'calculate_membership_duration_months',
            context: {
              customer,
              now: () => Date.now()
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && typeof data.result?.memberMonths === 'number') {
          setResult({
            memberMonths: data.result.memberMonths,
            source: 'brain',
            loading: false,
            error: null
          });
        } else {
          // No match or invalid result, use fallback
          setResult({
            memberMonths: fallback,
            source: 'fallback',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        // Always return fallback on error - ZERO-IMPACT guarantee
        setResult({
          memberMonths: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error')
        });
      }
    };

    evaluateRule();
  }, [customer.memberSince, fallback]);

  return result;
}
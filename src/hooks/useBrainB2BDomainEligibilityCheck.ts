import { useState, useEffect } from 'react';

interface B2BEligibilityResult {
  eligible: boolean;
  reason?: string;
  source: 'brain' | 'fallback';
}

interface B2BEligibilityFallback {
  eligible: boolean;
  reason?: string;
}

export function useBrainB2BDomainEligibilityCheck(
  email: string,
  fallback: B2BEligibilityFallback
): B2BEligibilityResult {
  const [result, setResult] = useState<B2BEligibilityResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setResult({ ...fallback, source: 'fallback' });
      return;
    }

    const evaluateEligibility = async () => {
      setLoading(true);
      try {
        const emailDomain = email.split('@')[1];
        if (!emailDomain) {
          setResult({ ...fallback, source: 'fallback' });
          return;
        }

        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            rule: 'b2b_domain_eligibility_check',
            context: {
              email_domain: emailDomain,
              email: email
            },
            fallback: fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.result) {
          setResult({
            eligible: data.result.eligible ?? fallback.eligible,
            reason: data.result.reason ?? fallback.reason,
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

    evaluateEligibility();
  }, [email, JSON.stringify(fallback)]);

  return result;
}
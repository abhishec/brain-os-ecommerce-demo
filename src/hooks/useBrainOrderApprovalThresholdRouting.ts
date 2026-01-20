import { useState, useEffect } from 'react';

interface OrderApprovalResult {
  assignee: 'system' | 'manager' | 'director' | 'vp' | 'executive';
  approval_level: 'auto_approve' | 'manager' | 'director' | 'vp' | 'executive';
  source: 'brain' | 'fallback';
}

interface OrderApprovalContext {
  order_value: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainOrderApprovalThresholdRouting(
  context: OrderApprovalContext,
  fallback: Omit<OrderApprovalResult, 'source'>
): OrderApprovalResult {
  const [result, setResult] = useState<OrderApprovalResult>({
    ...fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isCancelled = false;

    const evaluateRule = async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'workflow',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled && data && typeof data === 'object' && data.assignee && data.approval_level) {
          setResult({
            assignee: data.assignee,
            approval_level: data.approval_level,
            source: 'brain'
          });
        } else if (!isCancelled) {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('BrainOS evaluation failed, using fallback:', error);
        if (!isCancelled) {
          setResult({ ...fallback, source: 'fallback' });
        }
      }
    };

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.order_value, fallback.assignee, fallback.approval_level]);

  return result;
}
import { useState, useEffect } from 'react';

interface ApprovalResult {
  reason: string;
  status: 'requires_approval' | 'pending_review' | 'approved';
  approverLevel: 'VP' | 'Director' | 'Manager' | 'Sales Rep';
}

interface OrderContext {
  orderTotal: number;
  isNewCustomer: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface BrainResult extends ApprovalResult {
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainOrderValueApprovalWorkflow = (
  context: OrderContext,
  fallback: ApprovalResult
): BrainResult => {
  const [result, setResult] = useState<BrainResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateApprovalWorkflow = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'approvals',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.reason && data.status && data.approverLevel) {
          setResult({
            reason: data.reason,
            status: data.status,
            approverLevel: data.approverLevel,
            source: 'brain'
          });
        } else {
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          ...fallback,
          source: 'fallback'
        });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateApprovalWorkflow();
  }, [context.orderTotal, context.isNewCustomer, context.riskLevel, fallback]);

  return result;
};
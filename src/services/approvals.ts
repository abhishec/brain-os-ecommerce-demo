/**
 * Approvals Service - Nexus Commerce
 * Contains hardcoded business logic for approval workflows
 */

export interface ApprovalContext {
  orderTotal: number;
  customerId: string;
  customerTier: 'basic' | 'premium' | 'vip' | 'enterprise';
  isNewCustomer: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  paymentMethod: 'credit_card' | 'wire_transfer' | 'net_30' | 'net_60';
  productCategory?: string;
}

export type ApprovalStatus =
  | "auto_approved"
  | "manager_approval"
  | "director_approval"
  | "vp_approval"
  | "cfo_approval"
  | "rejected";

export interface ApprovalResult {
  status: ApprovalStatus;
  approverLevel: string;
  reason: string;
  conditions: string[];
  escalationPath: string[];
}

// Order value thresholds for approval levels
const AUTO_APPROVE_LIMIT = 10000;
const MANAGER_APPROVAL_LIMIT = 50000;
const DIRECTOR_APPROVAL_LIMIT = 100000;
const VP_APPROVAL_LIMIT = 250000;
// Above VP limit requires CFO

// New customer restrictions
const NEW_CUSTOMER_AUTO_LIMIT = 2500;
const NEW_CUSTOMER_MAX_LIMIT = 25000;

// High-risk thresholds
const HIGH_RISK_AUTO_LIMIT = 5000;
const HIGH_RISK_REQUIRES_REVIEW = 15000;

// Payment method modifiers
const NET_TERMS_MULTIPLIER = 0.5; // Reduces auto-approve limit for net terms

// Restricted product categories requiring extra approval
const RESTRICTED_CATEGORIES = ["hazardous", "controlled", "high_value", "export_controlled"];

export function determineApprovalLevel(context: ApprovalContext): ApprovalResult {
  const { orderTotal, customerTier, isNewCustomer, riskLevel, paymentMethod, productCategory } = context;
  const conditions: string[] = [];
  const escalationPath: string[] = [];

  // Check for auto-rejection conditions
  if (riskLevel === "critical") {
    return {
      status: "rejected",
      approverLevel: "System",
      reason: "Critical risk level - order cannot be processed",
      conditions: ["Customer flagged as critical risk"],
      escalationPath: ["Risk Team", "Compliance"],
    };
  }

  // New customer restrictions
  if (isNewCustomer && orderTotal > NEW_CUSTOMER_MAX_LIMIT) {
    return {
      status: "rejected",
      approverLevel: "System",
      reason: `New customers limited to $${NEW_CUSTOMER_MAX_LIMIT} orders`,
      conditions: ["New customer order limit exceeded"],
      escalationPath: ["Sales Manager", "Risk Team"],
    };
  }

  // Calculate effective auto-approve limit based on conditions
  let effectiveAutoLimit = AUTO_APPROVE_LIMIT;

  // Adjust for customer tier
  if (customerTier === "enterprise") {
    effectiveAutoLimit *= 2; // Enterprise gets 2x limit
    conditions.push("Enterprise tier: 2x auto-approve limit");
  } else if (customerTier === "vip") {
    effectiveAutoLimit *= 1.5;
    conditions.push("VIP tier: 1.5x auto-approve limit");
  }

  // Adjust for new customers
  if (isNewCustomer) {
    effectiveAutoLimit = Math.min(effectiveAutoLimit, NEW_CUSTOMER_AUTO_LIMIT);
    conditions.push(`New customer: limited to $${NEW_CUSTOMER_AUTO_LIMIT}`);
  }

  // Adjust for risk level
  if (riskLevel === "high") {
    effectiveAutoLimit = Math.min(effectiveAutoLimit, HIGH_RISK_AUTO_LIMIT);
    conditions.push(`High risk: limited to $${HIGH_RISK_AUTO_LIMIT}`);
  } else if (riskLevel === "medium") {
    effectiveAutoLimit *= 0.75;
    conditions.push("Medium risk: 25% reduction in limits");
  }

  // Adjust for payment method - net terms require stricter approval
  if (paymentMethod === "net_30" || paymentMethod === "net_60") {
    effectiveAutoLimit *= NET_TERMS_MULTIPLIER;
    conditions.push("Net terms: 50% reduction in auto-approve limit");
  }

  // Restricted categories require manager approval minimum
  if (productCategory && RESTRICTED_CATEGORIES.includes(productCategory)) {
    conditions.push(`Restricted category (${productCategory}): requires manager approval`);
    if (orderTotal < MANAGER_APPROVAL_LIMIT) {
      return {
        status: "manager_approval",
        approverLevel: "Manager",
        reason: "Restricted product category requires manager review",
        conditions,
        escalationPath: ["Sales Manager", "Compliance"],
      };
    }
  }

  // Determine approval level based on order total
  if (orderTotal <= effectiveAutoLimit) {
    return {
      status: "auto_approved",
      approverLevel: "System",
      reason: "Order within auto-approval limits",
      conditions,
      escalationPath: [],
    };
  }

  if (orderTotal <= MANAGER_APPROVAL_LIMIT) {
    escalationPath.push("Sales Manager");
    return {
      status: "manager_approval",
      approverLevel: "Manager",
      reason: `Orders between $${effectiveAutoLimit.toLocaleString()} and $${MANAGER_APPROVAL_LIMIT.toLocaleString()} require manager approval`,
      conditions,
      escalationPath,
    };
  }

  if (orderTotal <= DIRECTOR_APPROVAL_LIMIT) {
    escalationPath.push("Sales Manager", "Sales Director");
    return {
      status: "director_approval",
      approverLevel: "Director",
      reason: `Orders between $${MANAGER_APPROVAL_LIMIT.toLocaleString()} and $${DIRECTOR_APPROVAL_LIMIT.toLocaleString()} require director approval`,
      conditions,
      escalationPath,
    };
  }

  if (orderTotal <= VP_APPROVAL_LIMIT) {
    escalationPath.push("Sales Manager", "Sales Director", "VP of Sales");
    return {
      status: "vp_approval",
      approverLevel: "VP",
      reason: `Orders between $${DIRECTOR_APPROVAL_LIMIT.toLocaleString()} and $${VP_APPROVAL_LIMIT.toLocaleString()} require VP approval`,
      conditions,
      escalationPath,
    };
  }

  // CFO approval for very large orders
  escalationPath.push("Sales Manager", "Sales Director", "VP of Sales", "CFO");
  return {
    status: "cfo_approval",
    approverLevel: "CFO",
    reason: `Orders over $${VP_APPROVAL_LIMIT.toLocaleString()} require CFO approval`,
    conditions,
    escalationPath,
  };
}

export function getApprovalThresholds() {
  return {
    autoApprove: AUTO_APPROVE_LIMIT,
    manager: MANAGER_APPROVAL_LIMIT,
    director: DIRECTOR_APPROVAL_LIMIT,
    vp: VP_APPROVAL_LIMIT,
  };
}

export function canAutoApprove(orderTotal: number, customerTier: string): boolean {
  let limit = AUTO_APPROVE_LIMIT;
  if (customerTier === "enterprise") limit *= 2;
  if (customerTier === "vip") limit *= 1.5;
  return orderTotal <= limit;
}

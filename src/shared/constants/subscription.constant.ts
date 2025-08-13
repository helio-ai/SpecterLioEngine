export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE';

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  { maxApiCalls: number; maxStorage: number; price: number }
> = {
  BASIC: { maxApiCalls: 100, maxStorage: 5, price: 10 },
  PRO: { maxApiCalls: 1000, maxStorage: 50, price: 50 },
  ENTERPRISE: { maxApiCalls: Infinity, maxStorage: 500, price: 100 },
};

export enum SUBSCRIPTION_PLAN {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

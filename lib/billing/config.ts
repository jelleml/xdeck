/**
 * Billing configuration and constants
 * Contains price mappings, pricing information, and billing-related constants
 */

// Price ID mapping for Stripe prices
export const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  business: process.env.STRIPE_BUSINESS_PRICE_ID!,
} as const;

// Deck limits per subscription tier
export const DECK_LIMITS = {
  free: 3,
  pro: 10,
  business: 100,
} as const;

// Pricing information for all tiers
export const PRICING = {
  free: {
    price: 0,
    name: 'Free',
    description: 'Perfect for getting started',
    features: ['Up to 3 sales decks', 'Basic features', 'Community support'],
  },
  pro: {
    price: 20,
    name: 'Pro',
    description: 'For growing teams',
    features: [
      'Up to 10 sales decks',
      'All free features',
      'Priority support',
      'Advanced features',
    ],
  },
  business: {
    price: 200,
    name: 'Business',
    description: 'For large organizations',
    features: [
      'Up to 100 sales decks',
      'All pro features',
      'Enterprise support',
      'Custom integrations',
    ],
  },
} as const;

// Billing-related URLs and endpoints
export const BILLING_URLS = {
  success: process.env.STRIPE_SUCCESS_URL!,
  cancel: process.env.STRIPE_CANCEL_URL!,
} as const;

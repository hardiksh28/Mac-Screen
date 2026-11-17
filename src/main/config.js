/*
 * Store / payment configuration.
 *
 * Fill these in from your Dodo Payments dashboard (see README → "Payments"):
 *   1. Create a one-time product priced at $1 and enable "License keys" on it.
 *   2. Copy the product ID (looks like pdt_xxxxxxxx) into PRODUCT_ID below.
 *   3. Leave MODE = 'test' while you try the flow with test cards, then switch to 'live'.
 *
 * You can also override these without editing code, using environment variables at build time:
 *   DD_DODO_MODE=live DD_DODO_PRODUCT_ID=pdt_123 npm run dist:mac
 */
const MODE = process.env.DD_DODO_MODE || 'test'; // 'test' | 'live'
const PRODUCT_ID = process.env.DD_DODO_PRODUCT_ID || 'pdt_REPLACE_ME';

const API_BASE = MODE === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
const CHECKOUT_BASE =
  MODE === 'live' ? 'https://checkout.dodopayments.com' : 'https://test.checkout.dodopayments.com';

module.exports = {
  MODE,
  PRODUCT_ID,
  API_BASE,
  PRICE_LABEL: '$1.49',
  SUPPORT_EMAIL: process.env.DD_SUPPORT_EMAIL || 'support@example.com',
  // Static payment link. After paying, Dodo emails the buyer a license key and
  // returns them to the redirect URL, which reopens the app.
  checkoutUrl() {
    const redirect = encodeURIComponent('deskdiorama://purchased');
    return `${CHECKOUT_BASE}/buy/${PRODUCT_ID}?quantity=1&redirect_url=${redirect}`;
  },
  isConfigured() {
    return !PRODUCT_ID.includes('REPLACE_ME');
  }
};

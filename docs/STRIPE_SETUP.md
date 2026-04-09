# Stripe Integration Guide

This document covers setting up Stripe for local development and testing.

## Prerequisites

- A [Stripe account](https://dashboard.stripe.com/register) (free)
- [Stripe CLI](https://docs.stripe.com/stripe-cli) installed locally (for webhook testing)

## 1. Get Your Test API Keys

1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test mode** (toggle in the top-right)
3. Copy your keys:
   - **Publishable key** (`pk_test_...`) → for the frontend
   - **Secret key** (`sk_test_...`) → for the API backend

## 2. Configure Environment Variables

### Backend API (`backends/api/.env`)

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Storefront (`clients/storefront/.env.local`)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

## 3. Set Up Webhook Forwarding (Local Dev)

Stripe needs to reach your local server to deliver webhook events (e.g., `payment_intent.succeeded`).

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from https://docs.stripe.com/stripe-cli
```

### Login and forward webhooks

```bash
# One-time login
stripe login

# Forward webhooks to your local API
stripe listen --forward-to http://localhost:3000/api/v1/webhooks/stripe
```

The CLI will output a webhook signing secret (`whsec_...`). Copy this into your `STRIPE_WEBHOOK_SECRET` env var and restart the API.

## 4. Test Cards

Stripe provides test card numbers for different scenarios:

| Card Number           | Scenario                 |
| --------------------- | ------------------------ |
| `4242 4242 4242 4242` | Successful payment       |
| `4000 0000 0000 3220` | 3D Secure authentication |
| `4000 0000 0000 9995` | Declined (insufficient)  |
| `4000 0000 0000 0002` | Declined (generic)       |

For all test cards:

- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

Full list: [Stripe Testing Docs](https://docs.stripe.com/testing)

## 5. Testing the Checkout Flow

1. Start the API: `pnpm -F @ecomsaas/api dev`
2. Start the storefront: `pnpm -F @ecomsaas/storefront dev`
3. Start Stripe CLI webhook forwarding (see step 3)
4. Browse products, add items to cart
5. Go to checkout → fill shipping → pay with test card `4242 4242 4242 4242`
6. Verify:
   - Payment shows in [Stripe Dashboard → Payments](https://dashboard.stripe.com/test/payments)
   - Webhook event appears in the Stripe CLI output
   - Order status transitions to `CONFIRMED` in the database

## 6. Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Storefront     │     │    NestJS API     │     │     Stripe      │
│   (Next.js)      │     │                  │     │                 │
│                  │     │                  │     │                 │
│  Checkout Page   │────▶│  POST /checkout  │────▶│  PaymentIntent  │
│  Stripe Elements │◀────│  (client_secret) │◀────│  (created)      │
│                  │     │                  │     │                 │
│  confirmPayment()│────▶│                  │────▶│  Process card   │
│                  │     │                  │     │                 │
│                  │     │  POST /webhooks/ │◀────│  Webhook event  │
│                  │     │  stripe          │     │  (pi.succeeded) │
│                  │     │                  │     │                 │
│                  │     │  ConfirmOrder    │     │                 │
│                  │     │  use case runs   │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Flow

1. Customer fills shipping form → frontend calls `POST /stores/:storeId/checkout`
2. API creates order via `PlaceOrder` use case, then creates a Stripe `PaymentIntent`
3. API returns `clientSecret` to the frontend
4. Frontend renders Stripe Elements (`PaymentElement`) with the `clientSecret`
5. Customer enters card → Stripe.js calls `confirmPayment()`
6. Stripe processes the card and sends a `payment_intent.succeeded` webhook
7. API webhook handler calls `ConfirmOrder` use case → order status becomes `CONFIRMED`

### Multi-vendor carts

When a cart contains items from multiple stores, separate orders and PaymentIntents are created per store. The checkout UI handles paying for each sequentially.

## 7. Production Considerations (Future)

- **Stripe Connect**: For marketplace commission splitting, vendors will onboard via Stripe Connect. Each payment will use `transfer_data` or `application_fee_amount` to split funds.
- **Idempotency keys**: Add idempotency keys to `PaymentIntent` creation to prevent duplicate charges on retry.
- **Webhook idempotency**: Track processed event IDs to avoid double-confirming orders.
- **PCI compliance**: Stripe Elements handles card data — it never touches our servers.

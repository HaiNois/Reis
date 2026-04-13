---
name: integration-helper
description: Third-party API integration helper for e-commerce platforms. Use this skill whenever the user mentions integrating payment gateways (PayPal, Stripe, VNPay, MoMo), shipping APIs (GHTK, VNPost, GHN/GiaoHangNhanh), or any external service into a Node.js/Express backend with React frontend. Triggers on phrases like "integrate PayPal", "add GHTK shipping", "setup Stripe webhook", "payment gateway", "shipping API integration", "third-party API", "webhook handler", "payment callback".
---

# Third-Party Integration Helper

This skill helps integrate external APIs into an e-commerce platform with Node.js/Express backend and React frontend.

## Integration Patterns

### 1. Payment Gateway Integration

#### Standard Flow
```
Checkout → Create Payment Order → Redirect to Payment Provider → 
Webcallback/Return URL → Verify Payment → Update Order Status → Fulfill Order
```

#### Key Components to Implement
1. **Service Module** (`/backend/src/shared/services/{provider}.service.ts`)
   - Create order/prepare payment
   - Capture/confirm payment
   - Refund (if needed)
   - Webhook signature verification

2. **Routes** (`/backend/src/modules/payment/{provider}.routes.ts`)
   - `POST /payment/{provider}/create-order` - Init payment
   - `POST /payment/{provider}/capture-order` - Capture after redirect
   - `POST /payment/{provider}/webhook` - Handle async notifications
   - `GET /payment/{provider}/order/:id` - Query status

3. **DTOs** (`/backend/src/modules/payment/{provider}.dto.ts`)
   - Create order request/response
   - Capture request/response
   - Webhook payload types

4. **Frontend** (if needed)
   - Payment button component
   - Success/failure handling page
   - Order confirmation

#### PayPal Integration (Already Implemented)
- Service: `/backend/src/shared/services/paypal.service.ts`
- Routes: `/backend/src/modules/payment/payment.routes.ts`
- Flow: redirect-based checkout

#### Stripe Integration (To Implement)
```typescript
// Stripe Service Structure
interface StripeService {
  createCheckoutSession(amount: number, currency: string, metadata: object): Promise<CheckoutSession>
  constructWebhookEvent(payload: string, signature: string): WebhookEvent
  createRefund(paymentIntentId: string, amount?: number): Promise<Refund>
}
```

### 2. Shipping API Integration

#### Standard Flow
```
Order Confirmed → Create Shipping Order → Get Tracking Number → 
Update Order → Sync Tracking Status (webhook/poll) → Delivery Confirmation
```

#### Key Components
1. **Service Module** (`/backend/src/shared/services/{provider}.service.ts`)
   - Create shipment/order
   - Get tracking info
   - Calculate shipping fee
   - Cancel shipment (if needed)

2. **Routes** (`/backend/src/modules/shipping/{provider}.routes.ts`)
   - `POST /shipping/{provider}/create-order` - Create shipment
   - `GET /shipping/{provider}/tracking/:trackingNumber` - Get tracking
   - `GET /shipping/{provider}/fee` - Calculate fee
   - `POST /shipping/{provider}/webhook` - Tracking updates

#### GHTK Integration (Already Exists for tracking)
- Service: `/backend/src/shared/services/ghtk.service.ts`
- Only tracking implemented, full integration needed

## Implementation Checklist

For any new integration, follow this structure:

### Backend
- [ ] Create service in `/backend/src/shared/services/{provider}.service.ts`
- [ ] Create routes in `/backend/src/modules/{module}/{provider}.routes.ts`
- [ ] Create DTOs in `/backend/src/modules/{module}/{provider}.dto.ts`
- [ ] Update module's routes index to mount new routes
- [ ] Add environment variables to `.env` and `.env.example`
- [ ] Handle webhook signature verification
- [ ] Implement retry logic for failed calls
- [ ] Log all API calls for debugging

### Frontend (if needed)
- [ ] Add environment variables to `.env` and `.env.example`
- [ ] Create payment button component
- [ ] Handle redirect/return flow
- [ ] Show success/failure states
- [ ] Handle timeout/expiry

### Testing
- [ ] Test with sandbox credentials
- [ ] Test webhook endpoint with test payloads
- [ ] Test error handling (network failure, invalid credentials, etc.)
- [ ] Test payment confirmation flow end-to-end

## Environment Variables Template

```env
# Payment Providers
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn

# Shipping Providers
GHTK_TOKEN=your-ghtk-token
GHN_API_URL=https://dev-online-gateway.ghn.vn
GHN_TOKEN=your-ghn-token
```

## Security Checklist

1. **Never log sensitive data** (card numbers, tokens, secrets)
2. **Verify webhook signatures** before processing
3. **Use HTTPS** for all external API calls
4. **Validate all inputs** from external sources
5. **Implement idempotency** for webhook handlers
6. **Store secrets in env vars**, never in code

## Common Patterns

### Webhook Handler Template
```typescript
router.post('/webhook', asyncHandler(async (req, res) => {
  // 1. Verify signature
  const event = providerService.verifyWebhook(req.body, req.headers)
  
  // 2. Handle event (use switch for type)
  switch (event.type) {
    case 'payment.completed':
      await handlePaymentCompleted(event.data)
      break
    case 'payment.failed':
      await handlePaymentFailed(event.data)
      break
  }
  
  // 3. Return 200 immediately (don't wait for processing)
  res.json({ received: true })
}))
```

### Order Update Flow
```typescript
async function handlePaymentCompleted(data: PaymentData) {
  const orderId = data.metadata.orderId
  await orderService.updatePaymentStatus(orderId, 'PAID', data.transactionId)
  // Trigger fulfillment if needed
  await fulfillmentService.processOrder(orderId)
}
```

## Code Style

- Use `axios` for HTTP requests
- Implement service class with methods for each API operation
- Use Zod for request/response validation
- Follow existing project naming conventions:
  - Files: kebab-case (`paypal.service.ts`)
  - Routes: kebab-case (`/payment/paypal/create-order`)
  - DTOs: PascalCase with suffix (`CreatePaypalOrderDto`)

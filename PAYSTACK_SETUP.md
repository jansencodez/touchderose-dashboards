# Paystack Integration Setup

## Overview

This application uses **Paystack API directly** for payment processing with webhook-based payment confirmation for better security and reliability. All payments are processed in Kenyan Shillings (KES). Payment processing is handled entirely in API routes for better security. **Bookings are only created after successful payment via webhook.**

**Note**: This implementation uses the Paystack API directly with your secret key, not the Paystack UI/iframe approach.

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```
NEXT_PUBLIC_PAYSTACK_SECRET_KEY=sk_test_547c4505797416278f32af350d542da33a12c845
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_547c4505797416278f32af350d542da33a12c845
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Webhook Configuration

In your Paystack dashboard:

1. Go to **Settings > Webhooks**
2. Add a new webhook with the following URL:
   ```
   https://your-domain.com/api/payment/webhook
   ```
3. Select these events:
   - `charge.success`
   - `charge.failed`
   - `transfer.success` (optional)
   - `transfer.failed` (optional)

### 3. Webhook Security

The webhook endpoint verifies the signature using your secret key to ensure requests are from Paystack.

### 4. Payment Flow (API-Based)

1. User creates a booking through the UI
2. Frontend calls `/api/bookings/create` with booking data
3. API stores booking data in payment metadata (no database insertion yet)
4. API calls Paystack API directly using your secret key
5. API returns Paystack authorization URL to frontend
6. Frontend redirects user to Paystack hosted payment page
7. User completes payment on Paystack (in KES)
8. Paystack redirects to callback page
9. **Paystack sends webhook to `/api/payment/webhook`**
10. **Webhook creates the actual booking in database after payment verification**
11. User sees confirmation and is redirected to dashboard

### 5. Testing

- Use Paystack test cards for testing
- Test webhook locally using ngrok or similar service
- Monitor webhook events in Paystack dashboard

## API-Based Approach Benefits

### Security

- **Server-side Processing**: All payment logic handled in API routes
- **Secret Key Protection**: Secret key never exposed to frontend
- **Direct API Calls**: No client-side payment processing
- **Webhook Verification**: HMAC signature verification for webhooks

### Reliability

- **Payment-First Booking**: No bookings created until payment confirmed
- **Database Integrity**: Payment verification before database insertion
- **Audit Trail**: Complete payment-to-booking audit trail
- **Error Handling**: Centralized error handling and logging

## Currency Configuration

### KES (Kenyan Shillings)

- All amounts are displayed in KES
- Prices are stored in cents (smallest unit)
- Payment amounts are converted to cents for Paystack API
- Display amounts use `toLocaleString()` for proper formatting

### Pricing Structure

- Shirts: KES 150
- Pants: KES 200
- Dresses: KES 250
- Suits (Dry Clean): KES 400
- Bedding: KES 300

## API Endpoints

### POST /api/bookings/create

Initializes payment and stores booking data in metadata.

- Validates booking data
- Calculates total amount
- Calls Paystack API directly with secret key
- Returns payment authorization URL

### POST /api/payment/initialize

Initializes a payment transaction with Paystack API in KES.

### POST /api/payment/verify

Verifies a payment transaction (for manual verification).

### POST /api/payment/webhook

**Handles Paystack webhook events and creates bookings after successful payment.**

- Verifies webhook signature
- Parses booking data from metadata
- Creates booking and booking items in database
- Creates payment record
- Updates booking status to confirmed

## Security Benefits

1. **Server-side Processing**: All payment logic is handled in API routes
2. **No Client-side Secrets**: Secret keys never exposed to frontend
3. **Webhook Verification**: HMAC signature verification for webhooks
4. **Database Integrity**: All database operations happen server-side
5. **Audit Trail**: Complete payment history in database
6. **Payment-First Booking**: Bookings only created after successful payment
7. **Direct API Integration**: No third-party UI components or iframes

## Benefits of API-Based Approach

1. **Security**: Payment processing happens server-side with secret key
2. **Reliability**: Centralized error handling and logging
3. **Scalability**: Easy to add new payment methods
4. **Maintainability**: Clean separation of concerns
5. **Compliance**: Better for PCI DSS compliance
6. **Customization**: Full control over payment flow and UI
7. **Performance**: No external iframe loading or UI dependencies

## Benefits of Webhook-Based Booking Creation

1. **Security**: No bookings created until payment is confirmed
2. **Reliability**: Payment verification before database insertion
3. **Data Integrity**: Ensures payment and booking are always in sync
4. **Fraud Prevention**: Prevents booking creation without payment
5. **Compliance**: Better for PCI DSS compliance
6. **Audit Trail**: Complete payment-to-booking audit trail

## Troubleshooting

### Webhook Not Receiving Events

- Check webhook URL is accessible
- Verify webhook is active in Paystack dashboard
- Check server logs for errors

### Payment Not Confirming

- Verify webhook signature verification
- Check database connection
- Monitor webhook event logs

### Booking Not Created After Payment

- Check webhook is receiving `charge.success` events
- Verify booking data is properly stored in metadata
- Check database permissions for booking creation
- Monitor webhook processing logs

### API Errors

- Check server logs for detailed error messages
- Verify all required fields are sent to API
- Ensure database tables exist and are properly configured
- Verify Paystack secret key is correct

### Test Cards

Use these test cards for testing:

- Success: 4084 0840 8408 4081
- Failure: 4084 0840 8408 4082
- 3D Secure: 4084 0840 8408 4083

## Mobile Money Integration

The application supports:

- M-Pesa (Safaricom)
- Airtel Money
- Cash on Delivery

For mobile money integration, you'll need to configure additional webhook events and payment channels in your Paystack dashboard.

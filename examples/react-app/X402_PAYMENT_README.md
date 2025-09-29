# X402 Payment Demo with Anza Kit

This demo implements the x402 payment protocol using Anza Kit's transaction building capabilities, similar to the GPThree implementation but adapted for Anza Kit's functional approach.

## What is X402?

X402 is a payment protocol that extends HTTP with a `402 Payment Required` status code. When a client requests a protected resource:

1. **Initial Request**: Client makes a request to a payment-protected resource
2. **402 Response**: Server responds with `402 Payment Required` and payment requirements
3. **Payment Creation**: Client creates a signed payment transaction
4. **Retry with Payment**: Client retries the request with an `X-PAYMENT` header containing the signed transaction
5. **Success**: Server verifies payment and processes the request

## Implementation Overview

### Files Created

1. **`types/x402-types.ts`**: TypeScript interfaces for the x402 protocol
2. **`hooks/useX402Payment.ts`**: Custom React hook for creating x402 payments
3. **`components/X402PaymentFeaturePanel.tsx`**: UI component for testing x402 payments

### Key Features Demonstrated

#### Anza Kit Transaction Building
The implementation showcases Anza Kit's functional approach to transaction building:

```typescript
// Example of how a real implementation would work:
const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayerSigner(transactionSigner, m),
    m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    m => appendTransactionMessageInstruction(
        getTransferTokenInstruction({
            amount,
            destination: address(recipient),
            source: transactionSigner,
        }),
        m
    )
);
```

#### Wallet Integration
- Uses `@wallet-standard/react` for wallet connections
- Integrates with Anza Kit's signer system
- Handles transaction signing through connected wallets

#### Type Safety
- Full TypeScript support for x402 protocol types
- Proper error handling and validation
- Type-safe payment payload creation

### Differences from GPThree Implementation

#### Architecture
- **GPThree**: Uses Privy wallet authentication + Convex backend
- **Anza Kit Demo**: Uses wallet-standard + mock simulation

#### Transaction Building
- **GPThree**: Uses `@solana/web3.js` (1.x) with class-based approach
- **Anza Kit Demo**: Uses Anza Kit's functional, composable approach

#### Payment Flow
- **GPThree**: Full end-to-end with real facilitator and refunds
- **Anza Kit Demo**: Simulated flow to demonstrate concepts

### Code Structure

```
src/
├── types/
│   └── x402-types.ts          # Protocol type definitions
├── hooks/
│   └── useX402Payment.ts      # Payment logic hook
├── components/
│   └── X402PaymentFeaturePanel.tsx  # UI component
└── routes/
    └── root.tsx               # Integration point
```

### How to Extend for Production

To implement real x402 payments with Anza Kit:

1. **Replace Mock Transaction**: 
   ```typescript
   // Replace the mock transaction creation with real USDC transfer
   import { getTransferTokenInstruction } from '@solana-program/token';
   
   const instruction = getTransferTokenInstruction({
       amount: BigInt(paymentRequirements.maxAmountRequired),
       destination: address(paymentRequirements.payTo),
       source: transactionSigner,
       mint: address(paymentRequirements.asset), // USDC mint
   });
   ```

2. **Add Real Network Calls**:
   ```typescript
   // Replace simulation with actual HTTP requests
   const response = await fetch(endpoint, {
       method: 'POST',
       headers: { 'X-PAYMENT': paymentHeader },
       body: JSON.stringify(requestData),
   });
   ```

3. **Implement Facilitator Integration**:
   - Add payment verification endpoints
   - Handle payment settlement
   - Implement refund logic

4. **Add Error Handling**:
   - Network failure recovery
   - Transaction confirmation
   - Payment status tracking

### Benefits of Anza Kit Approach

1. **Tree-Shakeable**: Only bundle the features you use
2. **Type-Safe**: Full TypeScript support with compile-time error catching
3. **Composable**: Build complex transactions using functional composition
4. **Modern**: Uses native Web Crypto APIs and modern JavaScript features
5. **Flexible**: Customize every aspect of RPC communication and transaction building

### Testing the Demo

1. **Connect a Wallet**: Use any Solana wallet (Phantom, Solflare, etc.)
2. **Click "Test X402 Payment"**: Simulates the payment flow
3. **View Console**: See detailed logs of the payment process
4. **Check Result**: Success dialog shows the simulated transaction

The demo validates that:
- Wallet integration works correctly
- Transaction payloads can be created
- Payment headers are properly formatted
- The x402 protocol flow is understood

This demonstrates the foundational concepts needed to implement real x402 payments with Anza Kit in a production environment. 
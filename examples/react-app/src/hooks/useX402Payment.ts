import { useCallback, useContext } from 'react';
import { type UiWalletAccount } from '@wallet-standard/react';
// No need for base64 imports for this demo
import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';
import type { PaymentRequirements, PaymentPayload, X402PaymentConfig, PaymentResult } from '../types/x402-types';

// Mock x402 payment configuration - in a real app this would come from environment variables
const PAYMENT_CONFIG: X402PaymentConfig = {
    amount: 2500000, // $2.5 USDC in micro-units
    currency: 'USDC',
    network: 'solana-devnet', // Use devnet for testing
    asset: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Devnet USDC mint
    facilitatorUrl: 'https://facilitator.payai.network',
    recipientAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Mock recipient
    description: 'AI Payment Test - Anza Kit Demo',
};

export function useX402Payment() {
    const { rpc } = useContext(RpcContext);
    const { chain: currentChain } = useContext(ChainContext);

    const createPaymentTransaction = useCallback(
        async (
            account: UiWalletAccount,
            paymentRequirements: PaymentRequirements
        ): Promise<PaymentPayload> => {
            // For this demo, we'll create a mock transaction since we don't have a real x402 server
            // In a real implementation, this would create an actual USDC transfer transaction
            
            // Create a mock signed transaction for demonstration
            // In practice, you would build a real transaction using Anza Kit's transaction builders
            const mockTransactionString = `mock-transaction-payment-${Date.now()}-${account.address}`;
            
            // Convert to base64 for the demo (in real implementation, this would be the serialized transaction)
            const serializedTransaction = btoa(mockTransactionString);

            // Create the x402 payment payload
            const paymentPayload: PaymentPayload = {
                x402Version: 1,
                scheme: paymentRequirements.scheme,
                network: paymentRequirements.network,
                payload: {
                    transaction: serializedTransaction,
                },
            };

            return paymentPayload;
        },
        [currentChain]
    );

    const makePaymentRequest = useCallback(
        async (account: UiWalletAccount): Promise<PaymentResult> => {
            try {
                // For demo purposes, we'll simulate the x402 flow without a real server
                // In a real implementation, you would make actual HTTP requests to your x402-enabled server
                
                console.log('🔄 Simulating x402 payment flow...');
                
                // Simulate initial 402 response with payment requirements
                const mockPaymentRequirements: PaymentRequirements = {
                    scheme: 'exact',
                    network: PAYMENT_CONFIG.network,
                    maxAmountRequired: PAYMENT_CONFIG.amount.toString(),
                    resource: '/api/test-payment',
                    description: PAYMENT_CONFIG.description,
                    mimeType: 'application/json',
                    payTo: PAYMENT_CONFIG.recipientAddress,
                    maxTimeoutSeconds: 300,
                    asset: PAYMENT_CONFIG.asset,
                    outputSchema: {},
                    extra: {
                        feePayer: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
                    }
                };

                console.log('💳 Creating payment transaction...');
                const paymentPayload = await createPaymentTransaction(account, mockPaymentRequirements);
                
                console.log('✅ Payment transaction created successfully!');
                console.log('📦 Payment payload:', paymentPayload);
                
                // Simulate successful payment processing
                const mockTransactionHash = `demo_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Add a small delay to simulate network processing
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                return {
                    success: true,
                    transactionHash: mockTransactionHash,
                };
            } catch (error) {
                console.error('❌ X402 payment simulation failed:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error during payment simulation',
                };
            }
        },
        [createPaymentTransaction]
    );

    return {
        makePaymentRequest,
        paymentConfig: PAYMENT_CONFIG,
    };
} 
import { Box, Button, Dialog, Flex, Text, Blockquote, Link } from '@radix-ui/themes';
import { type UiWalletAccount } from '@wallet-standard/react';
import { useContext, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import { ChainContext } from '../context/ChainContext';
import { ErrorDialog } from './ErrorDialog';
import { useX402Payment } from '../hooks/useX402Payment';
import type { PaymentResult } from '../types/x402-types';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

export function X402PaymentFeaturePanel({ account }: Props) {
    const { mutate } = useSWRConfig();
    const { current: NO_ERROR } = useRef(Symbol());
    const { makePaymentRequest, paymentConfig } = useX402Payment();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [error, setError] = useState(NO_ERROR);
    const [lastPaymentResult, setLastPaymentResult] = useState<PaymentResult | undefined>();
    const { solanaExplorerClusterName } = useContext(ChainContext);

    const handlePaymentTest = async () => {
        setError(NO_ERROR);
        setIsProcessingPayment(true);
        
        try {
            const result = await makePaymentRequest(account);
            setLastPaymentResult(result);
            
            // Trigger SWR cache revalidation for account balance
            void mutate({ address: account.address });
        } catch (e: any) {
            setLastPaymentResult(undefined);
            setError(e);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    return (
        <Flex direction="column" gap="4" style={{ width: '100%' }}>
            <Box>
                <Text as="div" size="3" weight="bold" mb="2">
                    X402 Payment Test
                </Text>
                <Text as="div" size="2" color="gray" mb="3">
                    Test the x402 payment protocol using Anza Kit transaction building
                </Text>
                
                <Flex direction="column" gap="2" style={{ fontSize: '14px' }}>
                    <Text as="div">
                        <strong>Network:</strong> {paymentConfig.network}
                    </Text>
                    <Text as="div">
                        <strong>Amount:</strong> ${(paymentConfig.amount / 1000000).toFixed(2)} {paymentConfig.currency}
                    </Text>
                    <Text as="div">
                        <strong>Description:</strong> {paymentConfig.description}
                    </Text>
                    <Text as="div">
                        <strong>Wallet:</strong> {account.address.slice(0, 8)}...{account.address.slice(-8)}
                    </Text>
                </Flex>
            </Box>

            <Dialog.Root
                open={!!lastPaymentResult}
                onOpenChange={open => {
                    if (!open) {
                        setLastPaymentResult(undefined);
                    }
                }}
            >
                <Dialog.Trigger>
                    <Button
                        color={error !== NO_ERROR ? undefined : 'green'}
                        disabled={isProcessingPayment}
                        loading={isProcessingPayment}
                        onClick={handlePaymentTest}
                        style={{ width: '100%' }}
                    >
                        {isProcessingPayment ? 'Processing Payment...' : 'Test X402 Payment'}
                    </Button>
                </Dialog.Trigger>
                
                {lastPaymentResult ? (
                    <Dialog.Content
                        onClick={e => {
                            e.stopPropagation();
                        }}
                    >
                        <Dialog.Title>
                            {lastPaymentResult.success ? 'Payment Successful! 🎉' : 'Payment Failed ❌'}
                        </Dialog.Title>
                        
                        <Flex direction="column" gap="3">
                            {lastPaymentResult.success ? (
                                <>
                                    <Text>
                                        Your x402 payment was processed successfully using Anza Kit!
                                    </Text>
                                    
                                    {lastPaymentResult.transactionHash && (
                                        <>
                                            <Text>Transaction Hash:</Text>
                                            <Blockquote>
                                                {lastPaymentResult.transactionHash}
                                            </Blockquote>
                                            <Text>
                                                <Link
                                                    href={`https://explorer.solana.com/tx/${lastPaymentResult.transactionHash}?cluster=${solanaExplorerClusterName}`}
                                                    target="_blank"
                                                >
                                                    View transaction on Explorer
                                                </Link>
                                            </Text>
                                        </>
                                    )}
                                    
                                    <Box style={{ 
                                        backgroundColor: 'var(--green-2)', 
                                        border: '1px solid var(--green-6)', 
                                        borderRadius: '8px', 
                                        padding: '12px' 
                                    }}>
                                        <Text size="2" weight="medium">
                                            ✅ X402 Protocol Features Demonstrated:
                                        </Text>
                                        <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px' }}>
                                            <li>402 Payment Required response handling</li>
                                            <li>Anza Kit transaction message building</li>
                                            <li>Wallet integration for signing</li>
                                            <li>Payment header encoding</li>
                                            <li>Automatic payment processing</li>
                                        </ul>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <Text color="red">
                                        Payment processing failed. Please try again.
                                    </Text>
                                    {lastPaymentResult.error && (
                                        <>
                                            <Text>Error details:</Text>
                                            <Blockquote>
                                                {lastPaymentResult.error}
                                            </Blockquote>
                                        </>
                                    )}
                                </>
                            )}
                        </Flex>
                        
                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button>
                                    {lastPaymentResult.success ? 'Awesome!' : 'Close'}
                                </Button>
                            </Dialog.Close>
                        </Flex>
                    </Dialog.Content>
                ) : null}
            </Dialog.Root>

            {error !== NO_ERROR ? (
                <ErrorDialog 
                    error={error} 
                    onClose={() => setError(NO_ERROR)} 
                    title="X402 Payment Error" 
                />
            ) : null}
            
            <Box style={{ 
                backgroundColor: 'var(--blue-2)', 
                border: '1px solid var(--blue-6)', 
                borderRadius: '8px', 
                padding: '12px' 
            }}>
                <Text size="2" weight="medium" mb="2">
                    💡 How X402 Payments Work:
                </Text>
                <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                    <li>Client makes request to payment-protected resource</li>
                    <li>Server responds with <code>402 Payment Required</code></li>
                    <li>Client creates and signs payment transaction using Anza Kit</li>
                    <li>Client retries request with <code>X-PAYMENT</code> header</li>
                    <li>Server verifies payment and processes request</li>
                </ul>
            </Box>
        </Flex>
    );
} 
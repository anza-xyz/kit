export interface PaymentRequirements {
    scheme: 'exact';
    network: 'solana' | 'solana-devnet';
    maxAmountRequired: string; // USDC micro-units as string
    resource: string;
    description: string;
    mimeType: 'application/json';
    payTo: string; // Recipient address
    maxTimeoutSeconds: number;
    asset: string; // Token mint address
    outputSchema: Record<string, unknown>;
    extra?: {
        feePayer?: string; // Facilitator fee payer address
    };
}

export interface X402Response {
    x402Version: number;
    accepts: PaymentRequirements[];
    error?: string;
}

export interface PaymentPayload {
    x402Version: number;
    scheme: string;
    network: string;
    payload: {
        transaction: string; // Base64 encoded signed transaction
    };
}

export interface PaymentResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
}

export interface X402PaymentConfig {
    amount: number; // USDC micro-units
    currency: 'USDC';
    network: 'solana' | 'solana-devnet';
    asset: string; // USDC mint address
    facilitatorUrl: string;
    recipientAddress: string;
    description: string;
} 
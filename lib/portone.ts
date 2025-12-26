export interface PaymentRequest {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: string;
    payMethod: 'CARD' | 'VIRTUAL_ACCOUNT' | 'TRANSFER' | 'MOBILE' | 'GIFT_CERTIFICATE' | 'EASY_PAY';
    customer?: {
        customerId?: string;
        fullName?: string;
        phoneNumber?: string;
        email?: string;
        address?: {
            base?: string;
            detail?: string;
            postalCode?: string;
        };
        zipcode?: string;
    };
    windowType?: {
        pc: 'IFRAME' | 'POPUP';
        mobile: 'IFRAME' | 'POPUP' | 'NEW_TAB';
    };
    redirectUrl?: string;
}

export interface PaymentResponse {
    paymentId: string;
    transactionId?: string;
    code?: string;
    message?: string;
    txId?: string;
}

declare global {
    interface Window {
        PortOne: {
            requestPayment: (request: PaymentRequest) => Promise<PaymentResponse>;
        };
    }
}

export const requestPayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
    if (!window.PortOne) {
        throw new Error('PortOne SDK not loaded');
    }
    return window.PortOne.requestPayment(data);
};

// Test Configuration (Replace with User's real keys if provided, otherwise use placeholders)
export const PORTONE_CONFIG = {
    STORE_ID: "store-4ff4af41-85e3-4559-8eb8-0d08a2c6ceec", // Example Test Store ID
    CHANNEL_KEY: "channel-key-3b3a58a0-2101-4662-9596-d8319f168fbc", // Example Test Channel Key
};

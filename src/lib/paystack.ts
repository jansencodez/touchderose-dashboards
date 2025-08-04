const PAYSTACK_SECRET_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY ||
  "sk_test_547c4505797416278f32af350d542da33a12c845";
const PAYSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
  "pk_test_547c4505797416278f32af350d542da33a12c845";

export interface PaystackTransaction {
  id: string;
  reference: string;
  amount: number;
  status: string;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  metadata: {
    booking_id?: string;
    order_number?: string;
    user_id?: string;
  };
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackTransaction;
}

// Initialize a payment transaction
export const initializePayment = async (
  amount: number,
  email: string,
  reference: string,
  metadata: {
    booking_id?: string;
    order_number?: string;
    user_id: string;
    reference?: string;
  },
  bookingData?: any, // Optional booking data to store in metadata
  channels?: string[] // Optional payment channels (card, bank, ussd, qr, mobile_money, bank_transfer)
): Promise<PaystackInitializeResponse> => {
  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents (smallest currency unit for KES)
          email,
          reference,
          currency: "KES", // Set currency to Kenyan Shillings
          callback_url: `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/payment/callback`,
          channels: channels || ["card", "bank", "mobile_money"], // Default channels
          metadata: bookingData
            ? {
                ...metadata,
                bookingData: JSON.stringify(bookingData),
              }
            : metadata,
        }),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Paystack initialization error:", error);
    throw new Error("Failed to initialize payment");
  }
};

// Verify a payment transaction
export const verifyPayment = async (
  reference: string
): Promise<PaystackVerifyResponse> => {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Paystack verification error:", error);
    throw new Error("Failed to verify payment");
  }
};

// Get transaction details
export const getTransaction = async (
  reference: string
): Promise<PaystackTransaction | null> => {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Paystack get transaction error:", error);
    return null;
  }
};

// List transactions
export const listTransactions = async (
  page: number = 1,
  perPage: number = 50
) => {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction?page=${page}&perPage=${perPage}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Paystack list transactions error:", error);
    throw new Error("Failed to fetch transactions");
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (
  requestBody: string,
  signature: string
): boolean => {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(requestBody)
    .digest("hex");

  return hash === signature;
};

export { PAYSTACK_PUBLIC_KEY };

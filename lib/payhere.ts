import crypto from "crypto";

// ============================================
// PAYHERE CONFIG
// ============================================
export const PAYHERE_CONFIG = {
  merchantId:     process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID!,
  merchantSecret: process.env.PAYHERE_MERCHANT_SECRET!,
  mode:           process.env.NEXT_PUBLIC_PAYHERE_MODE ?? "sandbox",

  // Sandbox always uses sandbox URL
  // Live uses live URL
  checkoutUrl:
    process.env.NEXT_PUBLIC_PAYHERE_MODE === "live"
      ? "https://www.payhere.lk/pay/checkout"
      : "https://sandbox.payhere.lk/pay/checkout",

  notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payhere`,
  returnUrl:  `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
  cancelUrl:  `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
} as const;

// ============================================
// GENERATE ORDER ID
// ============================================
export function generateOrderId(
  type: "WORKER" | "CHAT",
  userId: string
): string {
  const timestamp = Date.now();
  const random    = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `WH-${type}-${timestamp}-${random}`;
}

// ============================================
// GENERATE MD5 HASH
// PayHere spec:
// MD5(merchant_id + order_id + amount +
//     currency + MD5(merchant_secret).toUpperCase())
// ============================================
export function generatePayHereHash(
  orderId:  string,
  amount:   string,
  currency: string
): string {
  const secretHash = crypto
    .createHash("md5")
    .update(PAYHERE_CONFIG.merchantSecret)
    .digest("hex")
    .toUpperCase();

  const raw =
    PAYHERE_CONFIG.merchantId +
    orderId +
    amount +
    currency +
    secretHash;

  return crypto
    .createHash("md5")
    .update(raw)
    .digest("hex")
    .toUpperCase();
}

// ============================================
// VERIFY PAYHERE WEBHOOK NOTIFICATION
// PayHere sends POST to notifyUrl with these fields.
// We verify MD5 to confirm it's really from PayHere.
// ============================================
export function verifyPayHereNotification(params: {
  merchant_id:      string;
  order_id:         string;
  payhere_amount:   string;
  payhere_currency: string;
  status_code:      string;
  md5sig:           string;
}): boolean {
  const {
    merchant_id, order_id, payhere_amount,
    payhere_currency, status_code, md5sig,
  } = params;

  const secretHash = crypto
    .createHash("md5")
    .update(PAYHERE_CONFIG.merchantSecret)
    .digest("hex")
    .toUpperCase();

  const localSig = crypto
    .createHash("md5")
    .update(
      merchant_id +
      order_id +
      payhere_amount +
      payhere_currency +
      secretHash +
      status_code
    )
    .digest("hex")
    .toUpperCase();

  return localSig === md5sig.toUpperCase();
}

// ============================================
// STATUS CODE MEANINGS
// 2  = Success
// 0  = Pending
// -1 = Cancelled
// -2 = Failed
// -3 = Chargedback
// ============================================
export function isPaymentSuccessful(statusCode: string | number): boolean {
  return String(statusCode) === "2";
}

// ============================================
// BUILD PAYHERE FORM FIELDS
// These are posted to PayHere checkout page
// ============================================
export interface PayHereFormFields {
  merchant_id:  string;
  return_url:   string;
  cancel_url:   string;
  notify_url:   string;
  order_id:     string;
  items:        string;
  amount:       string;
  currency:     string;
  hash:         string;
  first_name:   string;
  last_name:    string;
  email:        string;
  phone:        string;
  address:      string;
  city:         string;
  country:      string;
}

export function buildPayHereFields(params: {
  orderId:   string;
  amount:    number;
  itemName:  string;
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
}): PayHereFormFields {
  const amountStr = params.amount.toFixed(2);
  const currency  = "LKR";

  return {
    merchant_id:  PAYHERE_CONFIG.merchantId,
    return_url:   PAYHERE_CONFIG.returnUrl,
    cancel_url:   PAYHERE_CONFIG.cancelUrl,
    notify_url:   PAYHERE_CONFIG.notifyUrl,
    order_id:     params.orderId,
    items:        params.itemName,
    amount:       amountStr,
    currency,
    hash:         generatePayHereHash(params.orderId, amountStr, currency),
    first_name:   params.firstName,
    last_name:    params.lastName,
    email:        params.email,
    phone:        params.phone,
    address:      "Sri Lanka",
    city:         "Colombo",
    country:      "Sri Lanka",
  };
}
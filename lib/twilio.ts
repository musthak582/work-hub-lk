import twilio from "twilio";
const OTP_PROVIDER = process.env.OTP_PROVIDER || "mock";
const MOCK_OTP_CODE = process.env.MOCK_OTP_CODE || "123456";

// Singleton Twilio client
let twilioClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials are not configured");
    }

    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

// ============================================
// SEND OTP
// ============================================
/*
export async function sendOtp(phone: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getClient();

    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to:      phone,
        channel: "sms",
      });

    if (verification.status !== "pending") {
      return { success: false, error: "Failed to send OTP. Please try again." };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("[Twilio] sendOtp error:", err);

    // Handle specific Twilio errors
    if (err && typeof err === "object" && "code" in err) {
      const twilioErr = err as { code: number; message: string };

      switch (twilioErr.code) {
        case 60203:
          return {
            success: false,
            error: "Maximum OTP attempts reached. Please wait 10 minutes.",
          };
        case 60200:
          return { success: false, error: "Invalid phone number format." };
        case 20003:
          return { success: false, error: "Authentication error. Contact support." };
        default:
          return { success: false, error: "Failed to send OTP. Please try again." };
      }
    }

    return { success: false, error: "Failed to send OTP. Please try again." };
  }
}
*/

// Mock implementation for development/testing
export async function sendOtp(
  phone: string
): Promise<{
  success: boolean;
  error?: string;
}> {

  // ============================================
  // MOCK MODE
  // ============================================
  if (OTP_PROVIDER === "mock") {
    console.log("=================================");
    console.log("[MOCK OTP]");
    console.log("Phone:", phone);
    console.log("OTP:", MOCK_OTP_CODE);
    console.log("=================================");

    return { success: true };
  }

  // ============================================
  // TWILIO MODE
  // ============================================
  try {
    const client = getClient();

    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    if (verification.status !== "pending") {
      return {
        success: false,
        error: "Failed to send OTP. Please try again.",
      };
    }

    return { success: true };

  } catch (err: unknown) {
    console.error("[Twilio] sendOtp error:", err);

    return {
      success: false,
      error: "Failed to send OTP. Please try again.",
    };
  }
}
// ============================================
// VERIFY OTP
// ============================================
/*
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getClient();

    const result = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to:   phone,
        code: code,
      });

    if (result.status === "approved") {
      return { success: true };
    }

    // Status will be "pending" if wrong code
    return { success: false, error: "Incorrect OTP. Please try again." };
  } catch (err: unknown) {
    console.error("[Twilio] verifyOtp error:", err);

    if (err && typeof err === "object" && "code" in err) {
      const twilioErr = err as { code: number; message: string };

      switch (twilioErr.code) {
        case 60202:
          return {
            success: false,
            error: "Maximum verification attempts reached. Please request a new OTP.",
          };
        case 20404:
          return {
            success: false,
            error: "OTP expired or not found. Please request a new one.",
          };
        default:
          return { success: false, error: "Verification failed. Please try again." };
      }
    }

    return { success: false, error: "Verification failed. Please try again." };
  }
}*/

// Mock implementation for development/testing
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{
  success: boolean;
  error?: string;
}> {

  // ============================================
  // MOCK MODE
  // ============================================
  if (OTP_PROVIDER === "mock") {

    if (code === MOCK_OTP_CODE) {
      return { success: true };
    }

    return {
      success: false,
      error: "Incorrect OTP. Please try again.",
    };
  }

  // ============================================
  // TWILIO MODE
  // ============================================
  try {
    const client = getClient();

    const result = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code,
      });

    if (result.status === "approved") {
      return { success: true };
    }

    return {
      success: false,
      error: "Incorrect OTP. Please try again.",
    };

  } catch (err: unknown) {
    console.error("[Twilio] verifyOtp error:", err);

    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}
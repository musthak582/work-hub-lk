import { z } from "zod";

// ============================================
// PASSWORD RULES
// ============================================
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be under 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

// Sri Lankan phone: 07XXXXXXXX or +947XXXXXXXX
const phoneSchema = z
  .string()
  .regex(
    /^(\+94|0)[0-9]{9}$/,
    "Enter a valid Sri Lankan phone number (e.g. 0771234567)"
  )
  .transform((val) => {
    // Normalize to +94 format
    if (val.startsWith("0")) return "+94" + val.slice(1);
    return val;
  });

// ============================================
// REGISTER
// ============================================
export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be under 100 characters")
      .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters and spaces"),
    email: z
      .string()
      .email("Enter a valid email address")
      .max(255, "Email is too long")
      .toLowerCase(),
    phone: phoneSchema,
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// LOGIN
// ============================================
export const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// OTP VERIFY
// ============================================
export const verifyOtpSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  code: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ============================================
// ROLE SELECTION
// ============================================
export const selectRoleSchema = z.object({
  role: z.enum(["worker", "hirer"], {
    required_error: "Please select a role",
    invalid_type_error: "Invalid role selected",
  }),
});

export type SelectRoleInput = z.infer<typeof selectRoleSchema>;

// ============================================
// FORGOT PASSWORD (future use)
// ============================================
export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address").toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ============================================
// RESET PASSWORD (future use)
// ============================================
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
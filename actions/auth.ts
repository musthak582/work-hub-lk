"use server";

import { revalidatePath } from "next/cache";
import { redirect }        from "next/navigation";
import { headers }         from "next/headers";
import { createClient }    from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendOtp }         from "@/lib/twilio";
import {
  registerSchema,
  loginSchema,
  selectRoleSchema,
} from "@/schemas/auth";
import type { ActionResult, RegisterResult, LoginResult } from "@/types/actions";

// ============================================
// REGISTER
// ============================================
export async function registerAction(
  formData: FormData
): Promise<ActionResult<RegisterResult>> {
  // 1. Parse + validate
  const raw = {
    full_name:        formData.get("full_name"),
    email:            formData.get("email"),
    phone:            formData.get("phone"),
    password:         formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      success: false,
      error: first.message,
      field: first.path[0] as string,
    };
  }

  const { full_name, email, phone, password } = parsed.data;

  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  // 2. Check for duplicate email
  const { data: existingEmail } = await adminSupabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingEmail) {
    return {
      success: false,
      error: "An account with this email already exists.",
      field: "email",
    };
  }

  // 3. Check for duplicate phone
  const { data: existingPhone } = await adminSupabase
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existingPhone) {
    return {
      success: false,
      error: "An account with this phone number already exists.",
      field: "phone",
    };
  }

  // 4. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone },
      // Skip email confirmation — we use phone OTP instead
      emailRedirectTo: undefined,
    },
  });

  if (authError || !authData.user) {
    console.error("[Register] Auth error:", authError);

    if (authError?.message.includes("already registered")) {
      return {
        success: false,
        error: "An account with this email already exists.",
        field: "email",
      };
    }

    return {
      success: false,
      error: "Registration failed. Please try again.",
    };
  }

  // 5. Create users table record
  const { error: userError } = await adminSupabase.from("users").insert({
    auth_id:        authData.user.id,
    email,
    full_name,
    phone,
    role:           null,
    phone_verified: false,
    is_active:      true,
    is_banned:      false,
  });

  if (userError) {
    console.error("[Register] User insert error:", userError);
    // Clean up auth user if users insert fails
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    return {
      success: false,
      error: "Registration failed. Please try again.",
    };
  }

  // 6. Send OTP via Twilio
  const otpResult = await sendOtp(phone);
  if (!otpResult.success) {
    // Registration succeeded but OTP failed — user can resend
    console.error("[Register] OTP send failed:", otpResult.error);
  }

  return {
    success: true,
    data: {
      user_id: authData.user.id,
      phone,
      email,
    },
    message: "Account created! Please verify your phone number.",
  };
}

// ============================================
// LOGIN
// ============================================
export async function loginAction(
  formData: FormData
): Promise<ActionResult<LoginResult>> {
  const raw = {
    email:    formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      success: false,
      error: first.message,
      field: first.path[0] as string,
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  // Fetch user record
  const adminSupabase = createAdminClient();
  const { data: user, error: userError } = await adminSupabase
    .from("users")
    .select("id, email, full_name, phone, role, phone_verified, avatar_url, is_banned, is_active")
    .eq("auth_id", data.user.id)
    .single();

  if (userError || !user) {
    return { success: false, error: "Account not found. Please register." };
  }

  if (user.is_banned) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account has been suspended. Contact support.",
    };
  }

  if (!user.is_active) {
    await supabase.auth.signOut();
    return { success: false, error: "Your account is inactive." };
  }

  // Determine redirect
  let redirect_to = "/dashboard";
  if (!user.phone_verified) redirect_to = "/verify-otp";
  else if (!user.role)       redirect_to = "/select-role";
  else if (user.role === "admin") redirect_to = "/admin";

  return {
    success: true,
    data: {
      user: {
        id:             user.id,
        email:          user.email,
        full_name:      user.full_name,
        phone:          user.phone,
        role:           user.role,
        phone_verified: user.phone_verified,
        avatar_url:     user.avatar_url,
      },
      redirect_to,
    },
  };
}

// ============================================
// LOGOUT
// ============================================
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ============================================
// SELECT ROLE
// ============================================
export async function selectRoleAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = { role: formData.get("role") };

  const parsed = selectRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Please select a valid role." };
  }

  const { role } = parsed.data;
  const supabase  = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { success: false, error: "Not authenticated." };
  }

  const { error } = await adminSupabase
    .from("users")
    .update({ role })
    .eq("auth_id", authUser.id);

  if (error) {
    return { success: false, error: "Failed to set role. Please try again." };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
    message:
      role === "worker"
        ? "Welcome! Let's set up your worker profile."
        : "Welcome! Start finding skilled workers.",
  };
}

// ============================================
// RESEND OTP
// ============================================
export async function resendOtpAction(
  phone: string
): Promise<ActionResult> {
  if (!phone) {
    return { success: false, error: "Phone number is required." };
  }

  const result = await sendOtp(phone);

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to resend OTP." };
  }

  return {
    success: true,
    message: "A new OTP has been sent to your phone.",
  };
}
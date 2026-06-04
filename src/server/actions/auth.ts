"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type AuthActionState = {
  error?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = normalizeEmail((formData.get("email") as string | null) ?? "");
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "Email is already registered." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    name: name || null,
    passwordHash,
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but sign-in failed." };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail((formData.get("email") as string | null) ?? "");
  const password = (formData.get("password") as string | null) ?? "";
  const callbackUrl = (formData.get("callbackUrl") as string | null) ?? "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Sign-in failed. Please try again." };
      }
    }
    throw error;
  }

  redirect(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

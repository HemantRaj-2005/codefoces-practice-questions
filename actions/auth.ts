"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { loginSchema, signupSchema } from "@/validators";
import { createSession, destroySession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export interface AuthState {
  error?: string | null;
  success?: boolean;
}

// Password hashing helper methods using Node's crypto library
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

export async function login(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || "Invalid input data",
    };
  }

  // 1. Check against Admin environment credentials first
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    await createSession(email, "admin-id", "ADMIN");
    redirect("/admin/dashboard");
  }

  // 2. Check against database Users
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { error: "Invalid email or password" };
    }

    await createSession(user.email, user.id, "USER");
    redirect("/dashboard");
  } catch (err: any) {
    return { error: err.message || "Something went wrong during login." };
  }
}

export async function signUp(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const result = signupSchema.safeParse({ name, username, email, password, confirmPassword });
  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || "Invalid registration fields",
    };
  }

  try {
    // Check if email already registered
    const existingEmail = await db.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return { error: "Email is already registered" };
    }

    // Check if username is taken
    const existingUsername = await db.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return { error: "Username is already taken" };
    }

    // Create user record
    const passwordHash = hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
      },
    });

    await createSession(user.email, user.id, "USER");
    redirect("/onboarding");
  } catch (err: any) {
    return { error: err.message || "Failed to create user account." };
  }
}

export async function changePassword(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { error: "Authentication required" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const isCurrentValid = verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return { error: "Current password is incorrect" };
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update password." };
  }
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

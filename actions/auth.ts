"use server";

import { loginSchema } from "@/validators";
import { createSession, destroySession } from "@/lib/session";
import { redirect } from "next/navigation";

export interface AuthState {
  error?: string | null;
  success?: boolean;
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

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return {
      error: "Server configuration error: Admin credentials are not set in environment.",
    };
  }

  if (email !== adminEmail || password !== adminPassword) {
    return {
      error: "Invalid email or password",
    };
  }

  await createSession(email);
  redirect("/admin/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

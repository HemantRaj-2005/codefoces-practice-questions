"use client";

import * as React from "react";
import { login } from "@/actions/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Lock, Mail } from "lucide-react";
import { useActionState } from "react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0d1b] text-zinc-100 p-4 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#625cff]/8 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#ff542f]/5 blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md glass-3 rounded-2xl relative z-10 shadow-[0_25px_70px_rgba(0,0,0,0.4)]">
        <CardHeader className="space-y-3 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#625cff] to-[#ff542f] shadow-lg shadow-[#625cff]/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-white">Admin Access</CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Enter your credentials to manage the Codeforces Practice Tracker.
            </CardDescription>
          </div>
        </CardHeader>
        
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs font-semibold text-red-300 animate-in fade-in-50">
                {state.error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-zinc-500">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-zinc-500">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full glass-btn-primary"
            >
              {isPending ? "Authenticating..." : "Sign In"}
            </Button>
            <a
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-350 underline-offset-4 hover:underline mt-2 transition-all duration-200"
            >
              ← Return to Homepage
            </a>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

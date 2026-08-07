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
    <div className="min-h-screen flex items-center justify-center bg-[#030303] text-zinc-100 p-4 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/60 backdrop-blur-xl relative z-10 shadow-2xl">
        <CardHeader className="space-y-3 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Admin Access</CardTitle>
            <CardDescription className="text-zinc-400 mt-1">
              Enter your credentials to manage the Codeforces Practice Tracker.
            </CardDescription>
          </div>
        </CardHeader>
        
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-xs font-medium text-red-400 animate-in fade-in-50">
                {state.error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-zinc-500">
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
                <span className="absolute left-3 top-3.5 text-zinc-500">
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
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md shadow-indigo-500/10 active:scale-[0.99] transition-all"
            >
              {isPending ? "Authenticating..." : "Sign In"}
            </Button>
            <a
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline mt-2 transition-all duration-200"
            >
              ← Return to Homepage
            </a>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";
import { signUp } from "@/actions/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Lock, Mail, User, ShieldAlert } from "lucide-react";
import { useActionState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "motion/react";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUp, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080A12] text-zinc-100 p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#625cff]/6 blur-[130px] pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-[15%] right-[20%] w-[450px] h-[450px] rounded-full bg-[#ff542f]/4 blur-[120px] pointer-events-none animate-glow-pulse" style={{ animationDelay: "2s" }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard glassClassName="glass-3 shadow-[0_30px_80px_rgba(0,0,0,0.5)] border-white/12" intensity={3}>
          <CardHeader className="space-y-3 flex flex-col items-center text-center pb-4">
            <motion.div 
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#625cff] to-[#ff542f] shadow-lg shadow-[#625cff]/20"
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Activity className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-white">Create Account</CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-1">
                Evolve your competitive programming workflow. Join now.
              </CardDescription>
            </div>
          </CardHeader>
          
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state?.error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-semibold text-red-300 shadow-[0_4px_12px_rgba(239,68,68,0.1)] flex items-center gap-2"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{state.error}</span>
                </motion.div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block pl-1" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-zinc-500">
                      <User className="h-4 w-4" />
                    </span>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Jane Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block pl-1" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-zinc-500">
                      <User className="h-4 w-4" />
                    </span>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="janedoe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block pl-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-zinc-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-zinc-500">
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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1" htmlFor="confirmPassword">
                    Confirm
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-zinc-500">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full glass-btn-primary h-11 text-sm font-bold rounded-xl"
              >
                {isPending ? "Creating Account..." : "Create Account"}
              </Button>
              <div className="text-xs text-zinc-400 mt-2">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-zinc-200 hover:text-white underline font-semibold transition-colors"
                >
                  Sign In
                </a>
              </div>
            </CardFooter>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { connectCodeforcesHandle, syncCodeforcesSubmissions } from "@/actions/sync";
import { saveOnboardingSettings } from "@/actions/platform";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { Activity, Check, CheckCircle2, ChevronRight, RefreshCw, Trophy, User } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(1);
  const [handle, setHandle] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [syncProgress, setSyncProgress] = React.useState(0);
  const [syncStatusText, setSyncStatusText] = React.useState("Ready to sync");
  const [dailyGoal, setDailyGoal] = React.useState(5);
  const [saving, setSaving] = React.useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    setConnecting(true);
    
    try {
      const res = await connectCodeforcesHandle(handle);
      if (res.error) {
        toast({ type: "error", title: "Connection Failed", description: res.error });
      } else {
        setConnected(true);
        toast({ type: "success", title: "Connected", description: "Your Codeforces handle is connected!" });
        setTimeout(() => {
          setStep(3);
        }, 800);
      }
    } catch (err: any) {
      toast({ type: "error", description: err.message || "An error occurred." });
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress(15);
    setSyncStatusText("Contacting Codeforces API...");
    
    try {
      // Simulate progress updates for a smoother visual feel
      const interval = setInterval(() => {
        setSyncProgress(p => {
          if (p >= 85) {
            clearInterval(interval);
            return p;
          }
          return p + 12;
        });
      }, 500);

      setSyncStatusText("Fetching user submissions...");
      const res = await syncCodeforcesSubmissions();
      
      clearInterval(interval);
      setSyncProgress(100);
      
      if (res.error) {
        toast({ type: "error", title: "Sync failed", description: res.error });
        setSyncStatusText("Sync failed: " + res.error);
        setSyncProgress(0);
        setSyncing(false);
      } else {
        setSyncStatusText("Successfully matched problems & stored stats!");
        toast({ type: "success", description: `Synced ${res.addedCount || 0} new solved problems!` });
        setTimeout(() => {
          setStep(4);
        }, 1200);
      }
    } catch (e: any) {
      toast({ type: "error", description: e.message || "Sync crashed." });
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await saveOnboardingSettings(dailyGoal);
      toast({ type: "success", description: "Onboarding settings saved successfully!" });
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      toast({ type: "error", description: e.message || "Failed to save settings." });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080A12] text-zinc-100 p-4 relative overflow-hidden">
      {/* Glow ambient background spheres */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#625cff]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] rounded-full bg-[#ff542f]/4 blur-[110px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Onboarding steps indicator */}
        <div className="flex justify-between items-center px-6 mb-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>Step {step} of 4</span>
          <div className="flex gap-1">
            <span className={cn("h-1.5 w-6 rounded-full transition-colors", step >= 1 ? "bg-[#ff6a3d]" : "bg-white/10")} />
            <span className={cn("h-1.5 w-6 rounded-full transition-colors", step >= 2 ? "bg-[#ff6a3d]" : "bg-white/10")} />
            <span className={cn("h-1.5 w-6 rounded-full transition-colors", step >= 3 ? "bg-[#ff6a3d]" : "bg-white/10")} />
            <span className={cn("h-1.5 w-6 rounded-full transition-colors", step >= 4 ? "bg-[#ff6a3d]" : "bg-white/10")} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard glassClassName="glass-3 p-8 border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#625cff] to-[#ff542f] shadow-lg shadow-[#625cff]/20">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Welcome to CP Progress Platform</h2>
                    <p className="text-xs text-zinc-400 mt-2 max-w-sm">
                      Track your syllabus completions, analyze your rating progress, identify weak points, and get smart recommendations based on your Codeforces stats.
                    </p>
                  </div>
                  <Button onClick={() => setStep(2)} className="glass-btn-primary w-full h-11 flex items-center justify-center gap-1">
                    Get Started <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard glassClassName="glass-3 p-8 border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Connect Codeforces</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Link your account by entering your public Codeforces handle. No password required.
                    </p>
                  </div>

                  <form onSubmit={handleConnect} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                        Codeforces Handle
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-zinc-555">
                          <User className="h-4 w-4" />
                        </span>
                        <Input
                          type="text"
                          placeholder="E.g. tourist"
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          className="pl-10"
                          disabled={connecting || connected}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={connecting || connected} className="w-full h-11 glass-btn-primary">
                      {connecting ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" /> Connecting...
                        </div>
                      ) : connected ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4" /> Handle Connected
                        </div>
                      ) : (
                        "Connect Profile"
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-zinc-500 hover:text-zinc-350 text-xs w-full text-center hover:underline mt-2"
                    >
                      Skip this step
                    </button>
                  </form>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard glassClassName="glass-3 p-8 border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/4 border border-white/8 shadow-sm">
                    <RefreshCw className={cn("h-6 w-6 text-[#5b8cff]", syncing && "animate-spin")} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Sync Submissions</h2>
                    <p className="text-xs text-zinc-400 mt-2 max-w-sm">
                      We will import your past solved problems to align them automatically with our practice syllabus.
                    </p>
                  </div>

                  {syncing && (
                    <div className="w-full space-y-2 pt-2 animate-in fade-in">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-450 uppercase tracking-wider">
                        <span>{syncStatusText}</span>
                        <span>{syncProgress}%</span>
                      </div>
                      <Progress value={syncProgress} className="h-1.5" />
                    </div>
                  )}

                  {!syncing && (
                    <Button onClick={handleSync} className="glass-btn-primary w-full h-11">
                      Start Ingestion Sync
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    disabled={syncing}
                    className="text-zinc-500 hover:text-zinc-350 text-xs w-full text-center hover:underline mt-2 disabled:opacity-30"
                  >
                    Skip sync
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard glassClassName="glass-3 p-8 border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Set Daily Goal</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      How many problems do you plan to solve every day? Keeping consistency is the key.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                        Daily Target (Solved Problems)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                      />
                    </div>

                    <Button onClick={handleSaveSettings} disabled={saving} className="w-full h-11 glass-btn-primary">
                      {saving ? "Completing setup..." : "Finish Onboarding"}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

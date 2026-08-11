"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  Lock,
  RefreshCw,
  LogOut,
  Trophy,
  ShieldCheck,
  BellRing
} from "lucide-react";
import { connectCodeforcesHandle, disconnectCodeforces } from "@/actions/sync";
import { changePassword } from "@/actions/auth";
import { saveOnboardingSettings } from "@/actions/platform";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  user: any;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Local settings forms states
  const [cfHandle, setCfHandle] = React.useState(user.codeforcesHandle || "");
  const [connecting, setConnecting] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);

  // Profile Form
  const [name, setName] = React.useState(user.name || "");
  const [username, setUsername] = React.useState(user.username || "");
  const [dailyTarget, setDailyTarget] = React.useState(user.dailyTarget || 5);
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Password change form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [changingPass, setChangingPass] = React.useState(false);

  // Connect Codeforces
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfHandle.trim()) return;
    setConnecting(true);

    try {
      const res = await connectCodeforcesHandle(cfHandle);
      if (res.error) {
        toast({ type: "error", title: "Connection Failed", description: res.error });
      } else {
        toast({ type: "success", title: "Connected", description: "Your Codeforces handle was successfully linked!" });
        router.refresh();
      }
    } catch (e: any) {
      toast({ type: "error", description: "An error occurred." });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Codeforces
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Codeforces profile?")) return;
    setDisconnecting(true);

    try {
      const res = await disconnectCodeforces();
      if (res.error) {
        toast({ type: "error", title: "Disconnection Failed", description: res.error });
      } else {
        toast({ type: "success", title: "Disconnected", description: "Your Codeforces profile is disconnected." });
        setCfHandle("");
        router.refresh();
      }
    } catch (e: any) {
      toast({ type: "error", description: "An error occurred." });
    } finally {
      setDisconnecting(false);
    }
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      await saveOnboardingSettings(dailyTarget);
      toast({ type: "success", description: "Profile settings saved successfully." });
      router.refresh();
    } catch (e: any) {
      toast({ type: "error", description: "Failed to update profile settings." });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ type: "error", description: "New passwords do not match." });
      return;
    }
    setChangingPass(true);

    try {
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await changePassword(null, formData);
      if (res.error) {
        toast({ type: "error", description: res.error });
      } else {
        toast({ type: "success", description: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (e: any) {
      toast({ type: "error", description: "Failed to update password." });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Codeforces Connection Panel */}
      <GlassCard glassClassName="glass-2 p-6 border-white/8 relative overflow-hidden shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Trophy className="h-4.5 w-4.5 text-[#ffbe3c]" />
          Codeforces Integration
        </h3>

        {user.codeforcesHandle ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/2 border border-white/6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-white/10 overflow-hidden bg-white/5">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-zinc-400 m-auto mt-2" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">@{user.codeforcesHandle}</h4>
                  <p className="text-[10px] text-zinc-450 uppercase tracking-wider mt-0.5">{user.codeforcesRank || "unranked"}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-bold">Connected</Badge>
            </div>

            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 h-10 rounded-xl text-xs font-bold transition-all duration-200"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect Codeforces Account"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <p className="text-xs text-zinc-400 leading-snug">
              Link your Codeforces account handle to fetch submissions, contests, and update your streaks.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block pl-1">
                Codeforces Handle
              </label>
              <Input
                placeholder="E.g. tourist"
                value={cfHandle}
                onChange={(e) => setCfHandle(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={connecting} className="w-full h-10 glass-btn-primary text-xs">
              {connecting ? "Connecting..." : "Connect Handle"}
            </Button>
          </form>
        )}
      </GlassCard>

      {/* Edit Profile details */}
      <GlassCard glassClassName="glass-2 p-6 border-white/8 relative overflow-hidden shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Settings className="h-4.5 w-4.5 text-[#5b8cff]" />
          Profile Settings
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
              Daily Target (Solves)
            </label>
            <Input
              type="number"
              min="1"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
              required
            />
          </div>

          <Button type="submit" disabled={savingProfile} className="w-full h-10 glass-btn-primary text-xs">
            {savingProfile ? "Saving Settings..." : "Save Settings"}
          </Button>
        </form>
      </GlassCard>

      {/* Security settings */}
      <GlassCard className="col-span-1 md:col-span-2" glassClassName="glass-2 p-6 border-white/8 relative overflow-hidden shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Lock className="h-4.5 w-4.5 text-[#9b6dff]" />
          Account Security
        </h3>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
              Current Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
              New Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <Button type="submit" disabled={changingPass} className="glass-btn-primary h-10 px-6 text-xs">
              {changingPass ? "Updating Password..." : "Change Password"}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
export default SettingsClient;

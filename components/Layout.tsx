"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  LogOut,
  LogIn,
  Home,
  Menu,
  X,
  User,
  Activity,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { Progress } from "@/components/ui/progress";

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  overallProgress?: {
    total: number;
    completed: number;
    percentage: number;
  };
  adminEmail?: string | null;
}

export function SidebarLayout({
  children,
  isAdmin = false,
  overallProgress = { total: 0, completed: 0, percentage: 0 },
  adminEmail = null,
}: LayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navigation = React.useMemo(() => {
    const items = [
      { name: "Home", href: "/", icon: Home },
    ];

    if (adminEmail) {
      items.push(
        { name: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Manage Topics", href: "/admin/topics", icon: BookOpen },
        { name: "Manage Problems", href: "/admin/problems", icon: CheckSquare }
      );
    }

    return items;
  }, [adminEmail]);

  const handleLogout = async () => {
    await logout();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 22,
      }
    },
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full glass-2 border-r border-white/5 p-6 relative overflow-hidden glass-reflect">
      {/* Background ambient element inside sidebar */}
      <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[40%] rounded-full bg-[#625cff]/5 blur-[60px] pointer-events-none" />

      {/* Title */}
      <motion.div 
        className="flex items-center gap-3 mb-8 relative z-10"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#625cff] to-[#ff542f] shadow-lg shadow-[#625cff]/20 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight leading-none text-sm">CF Practice</h1>
          <span className="text-[9px] text-[#ff6a3d] font-extrabold tracking-widest uppercase mt-0.5 block">Tracker</span>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.nav 
        className="flex-1 space-y-2 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <motion.div key={item.name} variants={itemVariants}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group overflow-hidden cursor-pointer",
                  isActive
                    ? "bg-[#ff542f]/8 border border-[#ff542f]/20 text-white shadow-[0_4px_20px_rgba(255,84,47,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-zinc-400 hover:bg-white/4 hover:text-white border border-transparent"
                )}
              >
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff542f]"
                    layoutId="activeNavIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110", isActive ? "text-[#ff542f] drop-shadow-[0_0_8px_rgba(255,84,47,0.4)]" : "text-zinc-400")} />
                {item.name}
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Progress Widget */}
      {overallProgress.total > 0 && (
        <motion.div 
          className="rounded-2xl glass-1 p-4 mb-6 relative z-10 overflow-hidden border border-white/8 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Overall Progress</span>
            <span className="text-xs font-bold text-[#ffbe3c]">{overallProgress.percentage}%</span>
          </div>
          <Progress value={overallProgress.percentage} className="mb-2 h-1.5" />
          <div className="text-[10px] text-zinc-400">
            {overallProgress.completed} of {overallProgress.total} solved
          </div>
        </motion.div>
      )}

      {/* Footer Profile / Session info */}
      <motion.div 
        className="pt-4 border-t border-white/5 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {adminEmail ? (
          <div className="flex items-center justify-between p-1 rounded-xl bg-white/2 border border-white/5 shadow-inner">
            <div className="flex items-center gap-3 pl-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-sm">
                <User className="h-4 w-4 text-zinc-300" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-pulse" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white leading-none truncate">Admin</p>
                <p className="text-[9px] text-zinc-500 truncate mt-0.5 max-w-[100px]">{adminEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-white/8 bg-white/3 text-xs font-bold text-zinc-200 hover:bg-white/6 hover:text-white hover:border-white/12 transition-all duration-200 shadow-md active:scale-98"
          >
            <LogIn className="h-4 w-4" />
            Admin Login
          </Link>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#080A12] text-zinc-100 font-sans antialiased selection:bg-[#ff542f]/30 selection:text-white">
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 max-w-xs h-full z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-lg text-zinc-400 hover:text-white transition-colors z-50 hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between px-6 bg-white/2 border-b border-white/5 backdrop-blur-xl sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex md:hidden p-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white cursor-pointer transition-all duration-200"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1 flex items-center justify-end md:justify-between gap-4 pl-4 md:pl-0">
            {/* Title display */}
            <div className="hidden md:block">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Codeforces Practice
              </span>
              <h2 className="text-xs font-semibold text-zinc-300 mt-0.5">
                {isAdmin ? "Admin Workspace" : "Personal Dashboard"}
              </h2>
            </div>
            
            {/* Nav controls */}
            <div className="flex items-center gap-4">
              {overallProgress.total > 0 && (
                <div className="hidden sm:flex items-center gap-3 text-xs bg-white/3 border border-white/8 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md">
                  <span className="text-zinc-450 font-medium">Total Progress:</span>
                  <span className="font-bold text-[#625cff] drop-shadow-[0_0_8px_rgba(98,92,255,0.2)]">{overallProgress.percentage}%</span>
                </div>
              )}
              {adminEmail && (
                <div className="flex items-center gap-2 border border-[#625cff]/25 bg-[#625cff]/10 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#716bff] shadow-[0_2px_12px_rgba(98,92,255,0.15)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#716bff] animate-pulse" />
                  Admin
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <motion.div 
            className="max-w-7xl mx-auto space-y-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
export default SidebarLayout;

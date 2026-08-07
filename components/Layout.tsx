"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-950/80 border-r border-zinc-900/60 p-6">
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight leading-none">CF Practice</h1>
          <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">Tracker</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner shadow-black/20"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Progress Widget */}
      {overallProgress.total > 0 && (
        <div className="rounded-xl border border-zinc-850 bg-zinc-900/20 p-4 mb-6 backdrop-blur-md">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Overall Progress</span>
            <span className="text-xs font-bold text-zinc-100">{overallProgress.percentage}%</span>
          </div>
          <Progress value={overallProgress.percentage} className="mb-2 h-1.5" />
          <div className="text-[10px] text-zinc-500">
            {overallProgress.completed} of {overallProgress.total} problems solved
          </div>
        </div>
      )}

      {/* Footer Profile / Session info */}
      <div className="pt-4 border-t border-zinc-900/80">
        {adminEmail ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                <User className="h-4 w-4 text-zinc-300" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-pulse" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white leading-none truncate">Admin</p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{adminEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 text-xs font-semibold text-zinc-200 hover:bg-zinc-900 transition-all duration-200"
          >
            <LogIn className="h-4 w-4" />
            Admin Login
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#030303] text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] animate-pulse" />
      </div>

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
              className="absolute right-4 top-4 p-2 rounded-lg text-zinc-400 hover:text-white transition-colors z-50"
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
        <header className="flex h-16 items-center justify-between px-6 bg-zinc-950/40 border-b border-zinc-900/60 backdrop-blur-md sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex md:hidden p-2 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1 flex items-center justify-end md:justify-between gap-4 pl-4 md:pl-0">
            {/* Title display */}
            <div className="hidden md:block">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Codeforces Practice
              </span>
              <h2 className="text-sm font-semibold text-zinc-300 mt-0.5">
                {isAdmin ? "Admin Workspace" : "Personal Dashboard"}
              </h2>
            </div>
            
            {/* Nav controls */}
            <div className="flex items-center gap-4">
              {overallProgress.total > 0 && (
                <div className="hidden sm:flex items-center gap-3 text-xs bg-zinc-900/40 border border-zinc-800/60 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <span className="text-zinc-400">Total Progress:</span>
                  <span className="font-semibold text-indigo-400">{overallProgress.percentage}%</span>
                </div>
              )}
              {adminEmail && (
                <div className="flex items-center gap-2 border border-indigo-950 bg-indigo-950/20 px-3 py-1.5 rounded-full text-[11px] font-semibold text-indigo-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Admin
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
export default SidebarLayout;

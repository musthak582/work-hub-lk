"use client";

import { useState }    from "react";
import Link            from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Briefcase,
  CreditCard, Star, Menu, X,
  Zap, ShieldCheck, LogOut,
  ChevronRight,
} from "lucide-react";
import { cn }           from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

const NAV = [
  { label: "Overview",  href: "/admin",           icon: LayoutDashboard },
  { label: "Users",     href: "/admin/users",      icon: Users           },
  { label: "Workers",   href: "/admin/workers",    icon: Briefcase       },
  { label: "Payments",  href: "/admin/payments",   icon: CreditCard      },
  { label: "Reviews",   href: "/admin/reviews",    icon: Star            },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open,       setOpen]       = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  async function handleLogout() {
    setLoggingOut(true);
    await logoutAction();
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/50">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-sm block leading-none">
              WorkHub LK
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const Icon     = item.icon;
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className={cn(
                "w-3.5 h-3.5 opacity-0 group-hover:opacity-100",
                isActive && "opacity-60"
              )} />
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border/50 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          User dashboard
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-secondary/30 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-card border-r border-border/60">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-card border-r border-border/60 shadow-soft-xl lg:hidden"
            >
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-card border-b border-border/60 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Admin Panel
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
"use client";

import { useState }    from "react";
import Link            from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageCircle, Star, Settings,
  User, Search, Zap, Menu, X, LogOut,
  ChevronRight, Bell, Briefcase,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { cn }       from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import type { AuthUser } from "@/types/actions";

interface NavItem {
  label:    string;
  href:     string;
  icon:     React.ElementType;
  badge?:   number;
  workerOnly?: boolean;
  hirerOnly?:  boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",   href: "/dashboard",           icon: LayoutDashboard },
  { label: "My Profile",  href: "/dashboard/profile",   icon: User,      workerOnly: true  },
  { label: "Find Workers", href: "/workers",             icon: Search,    hirerOnly:  true  },
  { label: "Messages",    href: "/dashboard/chats",     icon: MessageCircle },
  { label: "Reviews",     href: "/dashboard/reviews",   icon: Star,      workerOnly: true  },
  { label: "Settings",    href: "/dashboard/settings",  icon: Settings   },
];

interface DashboardLayoutProps {
  user:     AuthUser;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const pathname = usePathname();

  const initials = user.full_name
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.workerOnly && user.role !== "worker") return false;
    if (item.hirerOnly  && user.role !== "hirer")  return false;
    return true;
  });

  async function handleLogout() {
    setLoggingOut(true);
    await logoutAction();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-soft">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base">
            Work<span className="text-primary">Hub</span>
            <span className="text-muted-foreground text-xs font-normal ml-0.5">LK</span>
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarImage src={user.avatar_url ?? ""} alt={user.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.full_name}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded font-medium capitalize",
                user.role === "worker"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              )}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon     = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <Badge className={cn(
                  "text-xs h-5 px-1.5 ml-auto",
                  isActive ? "bg-white/20 text-white" : "bg-primary text-white"
                )}>
                  {item.badge}
                </Badge>
              ) : (
                <ChevronRight className={cn(
                  "w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity",
                  isActive && "opacity-60"
                )} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border/50">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all w-full"
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
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-card border-r border-border/60 shadow-soft-sm">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-border/60 shadow-soft-xl lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border/60 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-soft-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title — derived from current nav */}
            <div>
              {(() => {
                const current = visibleNav.find(
                  (n) =>
                    n.href === pathname ||
                    (n.href !== "/dashboard" && pathname.startsWith(n.href))
                );
                return (
                  <h1 className="text-sm font-semibold text-foreground">
                    {current?.label ?? "Dashboard"}
                  </h1>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell (placeholder for future) */}
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
              <Bell className="w-4.5 h-4.5 text-muted-foreground" />
            </button>

            {/* Avatar */}
            <Link href="/dashboard/settings">
              <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                <AvatarImage src={user.avatar_url ?? ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
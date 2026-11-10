
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, BarChart3, Settings, Trophy, Lock, CreditCard, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const isKidPath = pathname?.startsWith("/kid");
  const isParentPath = pathname?.startsWith("/parent");

  const kidLinks = [
    { href: "/kid/dashboard", label: "Eye Data", icon: Activity },
    { href: "/kid/eye-health", label: "Eye Gym", icon: ShieldCheck },
    { href: "/parent/settings", label: "Parents", icon: Lock },
    { href: "/kid/achievements", label: "Rewards", icon: Trophy },
  ];

  const parentLinks = [
    { href: "/parent/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/parent/billing", label: "Billing", icon: CreditCard },
    { href: "/parent/settings", label: "Settings", icon: Settings },
  ];

  const links = isKidPath ? kidLinks : isParentPath ? parentLinks : [];

  if (links.length === 0) return null;

  return (
    <nav className="fixed bottom-3 left-3 right-3 glass-strong rounded-[2rem] h-[76px] px-2 flex justify-around items-center z-50 md:h-auto md:relative md:bg-transparent md:border-none md:shadow-none md:backdrop-blur-none md:rounded-none md:p-6 md:flex-col md:items-start md:space-y-4">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] transition-all rounded-2xl py-2 md:flex-row md:justify-start md:space-x-4 md:px-6 md:w-full md:py-3",
              active 
                ? "text-primary md:bg-primary/10" 
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-full transition-all duration-300",
              active ? "bg-primary text-white shadow-lg shadow-primary/30 md:bg-transparent md:text-primary md:shadow-none" : ""
            )}>
              <Icon className={cn("h-6 w-6 transition-transform", active ? "stroke-[2.5px]" : "stroke-2")} />
            </div>
            <span className={cn(
              "text-xs mt-1 font-bold tracking-tight md:text-sm md:mt-0 transition-all",
              active ? "opacity-100 scale-105" : "opacity-80"
            )}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

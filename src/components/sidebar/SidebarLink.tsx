"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface SidebarLinkProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

export function SidebarLink({ icon: Icon, label, href }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname.startsWith(`${href}/`) && href !== "/dashboard");
  
  // Exact match for /dashboard
  const isExactActive = href === "/dashboard" ? pathname === "/dashboard" : isActive;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
        isExactActive
          ? "bg-violet-600 text-white"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

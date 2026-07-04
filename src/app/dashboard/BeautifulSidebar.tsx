"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Bell,
  FileText,
  MessageSquare,
  Ghost,
  BarChart2,
  Smile,
  Cake,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";

interface NavLinkProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  isActive: boolean;
}

function NavLink({ icon: Icon, label, href, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
        ${isActive
          ? "bg-violet-600 text-white shadow-sm"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
        }
      `}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navLinks = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Bell, label: "Notices", href: "/dashboard/notices" },
    { icon: FileText, label: "Notes", href: "/dashboard/notes" },
    { icon: MessageSquare, label: "Discussions", href: "/dashboard/discussions" },
    { icon: Ghost, label: "Confessions", href: "/dashboard/confessions" },
    { icon: BarChart2, label: "Polls", href: "/dashboard/polls" },
    { icon: Smile, label: "Memes", href: "/dashboard/memes" },
    { icon: Cake, label: "Birthdays", href: "/dashboard/birthdays" },
    { icon: Users, label: "Students", href: "/dashboard/students" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-zinc-800 rounded-lg text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-60 bg-zinc-900 border-r border-zinc-800
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white tracking-tight">ClassSpace</h1>
          <p className="text-xs text-zinc-400 mt-1">CSM-A Class Portal</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              icon={link.icon}
              label={link.label}
              href={link.href}
              isActive={isLinkActive(link.href)}
            />
          ))}
          {session?.user?.role === "ADMIN" && (
            <NavLink
              icon={ShieldCheck}
              label="Admin"
              href="/dashboard/admin"
              isActive={isLinkActive("/dashboard/admin")}
            />
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-10 h-10 rounded-full border border-zinc-800 object-cover bg-zinc-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || "Student"}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {session?.user?.email || "No email"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

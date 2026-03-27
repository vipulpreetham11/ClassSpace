"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Search, Users, Activity, FileText, Bell } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

type UserBasic = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  rollNumber?: string | null;
  branch?: string | null;
  year?: number | null;
};

interface AdminPanelClientProps {
  initialPending: UserBasic[]
  initialStudents: UserBasic[]
  stats: { totalStudents: number; pendingApprovals: number; totalNotes: number; totalNotices: number; }
}

export function AdminPanelClient({
  initialPending,
  initialStudents,
  stats,
}: AdminPanelClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "students" | "overview">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingId, setIsLoadingId] = useState<string | null>(null);

  // Local state management for instant updates
  const [pendingUsers, setPendingUsers] = useState(initialPending);
  const [students, setStudents] = useState(initialStudents);

  const handleAction = async (id: string, action: "approve" | "reject" | "remove") => {
    if (action === "reject" || action === "remove") {
      if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    }

    setIsLoadingId(id);

    // Find the user for instant UI update
    const pendingUser = pendingUsers.find(user => user.id === id);
    const studentUser = students.find(user => user.id === id);

    try {
      // Optimistically update UI first for instant feedback
      if (action === "approve" && pendingUser) {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== id));
        // Add to students list
        setStudents(prev => [pendingUser, ...prev]);
      } else if (action === "reject" && pendingUser) {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== id));
      } else if (action === "remove" && studentUser) {
        // Remove from students list
        setStudents(prev => prev.filter(user => user.id !== id));
        // Add to pending list
        setPendingUsers(prev => [studentUser, ...prev]);
      }

      // Then make the API call
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error("Action failed");
      }

      // Keep the router.refresh as backup
      router.refresh();
    } catch (error) {
      // Revert optimistic update if API call failed
      if (action === "approve" && pendingUser) {
        setPendingUsers(prev => [pendingUser, ...prev]);
        setStudents(prev => prev.filter(user => user.id !== id));
      } else if (action === "reject" && pendingUser) {
        setPendingUsers(prev => [pendingUser, ...prev]);
      } else if (action === "remove" && studentUser) {
        setStudents(prev => [studentUser, ...prev]);
        setPendingUsers(prev => prev.filter(user => user.id !== id));
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);
      alert("Failed to perform action");
    } finally {
      setIsLoadingId(null);
    }
  };

  const filteredStudents = students.filter((u: UserBasic) =>
    (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-400 mt-1">Manage users, roles, and platform metrics.</p>
      </div>

      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1 overflow-x-auto">
        {(["pending", "students", "overview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg font-medium text-sm transition-colors capitalize ${
              activeTab === tab 
                ? "bg-violet-600 text-white shadow" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {tab === "pending" ? "Pending Approvals" : tab === "students" ? "All Students" : "Overview"}
            {tab === "pending" && pendingUsers.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 text-xs font-bold rounded-full bg-orange-500/20 text-orange-400">
                {pendingUsers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Students" value={stats.totalStudents} icon={<Users className="w-5 h-5 text-violet-400" />} />
            <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={<Activity className="w-5 h-5 text-orange-400" />} />
            <StatCard title="Total Notes" value={stats.totalNotes} icon={<FileText className="w-5 h-5 text-blue-400" />} />
            <StatCard title="Total Notices" value={stats.totalNotices} icon={<Bell className="w-5 h-5 text-red-400" />} />
          </div>
        )}

        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
                <p className="text-zinc-400 font-medium">No pending approvals</p>
              </div>
            ) : (
              pendingUsers.map((user: UserBasic) => (
                <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-zinc-800 border border-zinc-700 rounded-xl hover:border-zinc-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <UserAvatar name={user.name} image={user.image} email={user.email} />
                    <div>
                      <h3 className="text-white font-medium">{user.name || "Unknown"}</h3>
                      <p className="text-zinc-400 text-sm">{user.email}</p>
                      <p className="text-zinc-500 text-xs mt-1">Joined {formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleAction(user.id, "approve")}
                      disabled={isLoadingId === user.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(user.id, "reject")}
                      disabled={isLoadingId === user.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name or email..."
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <p className="text-zinc-400 font-medium">No students found</p>
                </div>
              ) : (
                filteredStudents.map((user: UserBasic) => (
                  <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-zinc-800 border border-zinc-700 rounded-xl hover:border-zinc-600 transition-colors">
                    <div className="flex items-center gap-4">
                      <UserAvatar name={user.name} image={user.image} email={user.email} />
                      <div>
                        <h3 className="text-white font-medium">{user.name || "Unknown"}</h3>
                        <p className="text-zinc-400 text-sm mb-1">{user.email}</p>
                        <div className="flex gap-2.5 text-xs font-mono text-violet-300/80 bg-zinc-900 px-2 py-1 rounded inline-block">
                          {user.rollNumber || "N/A"} • {user.branch || "N/A"} • Yr {user.year || "?"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction(user.id, "remove")}
                      disabled={isLoadingId === user.id}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 flex flex-col justify-center shadow-sm">
      <div className="flex items-center justify-between font-semibold">
        <span className="text-zinc-400 text-sm tracking-wide">{title}</span>
        <div className="p-2 bg-zinc-900 rounded-lg">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white mt-4">{value}</p>
    </div>
  );
}

function UserAvatar({ name, image, email }: { name: string|null, image: string|null, email: string|null }) {
  if (image) return <img src={image} alt={name || "User"} className="w-12 h-12 rounded-full border border-zinc-700 object-cover bg-zinc-800 shrink-0" />;
  const initial = name?.charAt(0) || email?.charAt(0) || "U";
  return (
    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
      {initial.toUpperCase()}
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Bell, Users, MessageSquareMore } from 'lucide-react';
import { formatDate } from "@/lib/formatDate";
import { Sidebar } from './BeautifulSidebar';

interface DashboardData {
  stats: {
    totalNotes: number;
    activeNotices: number;
    totalStudents: number;
    pendingConfessions: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
}

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  const loadDashboardData = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/home');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const homeData = await res.json();

      setData({
        stats: homeData.stats,
        recentActivity: homeData.recentActivity,
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setLoading(false);
    }
  };

  // Load data once on mount only — no polling
  useEffect(() => {
    loadDashboardData();
  }, [status]);

  // Handle authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role === "PENDING") {
      router.push("/pending");
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto" />
          <p className="text-white text-lg">Loading ClassSpace...</p>
          <p className="text-zinc-400 text-sm">Getting everything ready for you</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const username = session?.user?.name ? session.user.name.split(" ")[0] : "Student";

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        {data && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Welcome back, {username}
              </h1>
              <p className="text-zinc-400 mt-2">Here is what is happening in CSM-A today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Notes" value={data.stats.totalNotes} icon="notes" />
              <StatCard title="Active Notices" value={data.stats.activeNotices} icon="notices" />
              <StatCard title="Total Students" value={data.stats.totalStudents} icon="students" />
              {isAdmin && (
                <StatCard title="Pending Confessions" value={data.stats.pendingConfessions} icon="confessions" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              {data.recentActivity.length === 0 ? (
                <p className="text-zinc-500 text-sm">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 bg-zinc-800 rounded-xl p-4 border border-zinc-700"
                    >
                      <div className="p-2 rounded-lg bg-violet-600/20 text-violet-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">{event.message}</p>
                        <p className="text-zinc-500 text-xs mt-1">{formatDate(new Date(event.createdAt))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  const getIcon = () => {
    switch (icon) {
      case 'notes': return <FileText className="w-6 h-6" />;
      case 'notices': return <Bell className="w-6 h-6" />;
      case 'students': return <Users className="w-6 h-6" />;
      case 'confessions': return <MessageSquareMore className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const getColor = () => {
    switch (icon) {
      case 'notes': return 'text-violet-600 bg-violet-600/20';
      case 'notices': return 'text-orange-500 bg-orange-500/20';
      case 'students': return 'text-emerald-500 bg-emerald-500/20';
      case 'confessions': return 'text-orange-500 bg-orange-500/20';
      default: return 'text-violet-600 bg-violet-600/20';
    }
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-800 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-zinc-400 text-sm font-medium">{title}</p>
        <p className="text-white text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${getColor()}`}>
        {getIcon()}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Home,
  FileText,
  MessageSquareMore,
  Image,
  MessageCircle,
  Bell,
  Users,
  Settings,
  Loader2
} from 'lucide-react';

// Import existing page components (we'll convert them)
import { formatDate } from "@/lib/formatDate";

type TabType = 'home' | 'notes' | 'confessions' | 'memes' | 'discussions' | 'notices' | 'students' | 'admin';

interface DashboardData {
  // Home data
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

  // Other pages data
  notes: Array<{
    id: string;
    title: string;
    subject: string;
    description: string;
    user: { name: string | null };
    createdAt: string;
    bookmarks: Array<{ userId: string }>;
  }>;

  memes: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
    reactions: Array<{ type: string; userId: string }>;
    user: { name: string | null };
  }>;

  confessions: Array<{
    id: string;
    content: string;
    createdAt: string;
    reactions: Array<{ type: string; userId: string }>;
  }>;

  discussions: Array<{
    id: string;
    title: string;
    category: string;
    content: string;
    createdAt: string;
    user: { name: string | null };
    _count: { comments: number };
  }>;

  notices: Array<{
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    isUrgent: boolean;
    createdAt: string;
    user: { name: string | null };
  }>;
}

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  // Load all dashboard data at once
  const loadDashboardData = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);

      // Load all data in parallel
      const [
        homeRes,
        notesRes,
        memesRes,
        confessionsRes,
        discussionsRes,
        noticesRes
      ] = await Promise.all([
        fetch('/api/dashboard/home'),
        fetch('/api/notes?take=50'),
        fetch('/api/memes?take=50'),
        fetch('/api/confessions?take=50'),
        fetch('/api/discussions?take=50'),
        fetch('/api/notices?take=50')
      ]);

      const [homeData, notes, memes, confessions, discussions, notices] = await Promise.all([
        homeRes.json(),
        notesRes.json(),
        memesRes.json(),
        confessionsRes.json(),
        discussionsRes.json(),
        noticesRes.json()
      ]);

      setData({
        stats: homeData.stats,
        recentActivity: homeData.recentActivity,
        notes,
        memes,
        confessions,
        discussions,
        notices
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setLoading(false);
    }
  };

  // Load data on mount and every 30 seconds
  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(loadDashboardData, 30000); // 30 seconds
    return () => clearInterval(interval);
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

  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'notes' as TabType, label: 'Notes', icon: FileText },
    { id: 'confessions' as TabType, label: 'Confessions', icon: MessageSquareMore },
    { id: 'memes' as TabType, label: 'Memes', icon: Image },
    { id: 'discussions' as TabType, label: 'Discussions', icon: MessageCircle },
    { id: 'notices' as TabType, label: 'Notices', icon: Bell },
    { id: 'students' as TabType, label: 'Students', icon: Users },
    ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Admin', icon: Settings }] : [])
  ];

  const renderTabContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Welcome back, {username}
              </h1>
              <p className="text-zinc-400 mt-2">Here is what is happening in CSM-A today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Notes" value={data.stats.totalNotes} icon="notes" />
              <StatCard title="Active Notices" value={data.stats.activeNotices} icon="notices" />
              <StatCard title="Total Students" value={data.stats.totalStudents} icon="students" />
              {isAdmin && (
                <StatCard title="Pending Confessions" value={data.stats.pendingConfessions} icon="confessions" />
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="bg-zinc-800 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/50">
                {data.recentActivity.length === 0 ? (
                  <div className="p-6 text-zinc-400 text-sm">No activity yet.</div>
                ) : (
                  data.recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-zinc-700/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{activity.message}</p>
                        <p className="text-xs text-zinc-400 mt-1">{formatDate(new Date(activity.createdAt))}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Notes Library</h1>
                <p className="text-zinc-400">Access all your class materials.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.notes.slice(0, 20).map((note) => (
                <div key={note.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <h3 className="text-white font-medium mb-2">{note.title}</h3>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{note.description}</p>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>{note.subject}</span>
                    <span>{formatDate(new Date(note.createdAt))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'memes':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Memes</h1>
                <p className="text-zinc-400">Campus humor and relatable moments.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.memes.slice(0, 20).map((meme) => (
                <div key={meme.id} className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
                  <img src={meme.imageUrl} alt="Meme" className="w-full h-48 object-cover" />
                  {meme.caption && (
                    <div className="p-4">
                      <p className="text-white text-sm">{meme.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // Add other cases for confessions, discussions, etc.
      default:
        return (
          <div className="text-center py-12">
            <p className="text-white text-xl">Coming soon...</p>
            <p className="text-zinc-400 mt-2">This tab is being optimized</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-8 py-4 overflow-x-auto">
            <div className="text-xl font-bold text-violet-400 whitespace-nowrap">ClassSpace</div>
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderTabContent()}
      </main>
    </div>
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
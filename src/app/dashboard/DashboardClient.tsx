"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  FileText,
  MessageSquareMore,
  Image,
  MessageCircle,
  Bell,
  Users,
  Settings,
  Loader2,
  LogOut,
  BarChart2,
  Cake
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

  students: Array<{
    id: string;
    name: string | null;
    email: string | null;
    rollNumber: string | null;
    branch: string | null;
    year: number | null;
    createdAt: string;
  }>;
}

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  // Set initial tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['home', 'notes', 'confessions', 'memes', 'discussions', 'notices', 'students', 'admin'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
        noticesRes,
        studentsRes
      ] = await Promise.all([
        fetch('/api/dashboard/home'),
        fetch('/api/notes?take=50'),
        fetch('/api/memes?take=50'),
        fetch('/api/confessions?take=50'),
        fetch('/api/discussions?take=50'),
        fetch('/api/notices?take=50'),
        fetch('/api/students')
      ]);

      const [homeData, notes, memes, confessions, discussions, notices, students] = await Promise.all([
        homeRes.json(),
        notesRes.json(),
        memesRes.json(),
        confessionsRes.json(),
        discussionsRes.json(),
        noticesRes.json(),
        studentsRes.json()
      ]);

      setData({
        stats: homeData.stats,
        recentActivity: homeData.recentActivity,
        notes,
        memes,
        confessions,
        discussions,
        notices,
        students
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
    { id: 'notices' as TabType, label: 'Notices', icon: Bell },
    { id: 'discussions' as TabType, label: 'Discussions', icon: MessageCircle },
    { id: 'confessions' as TabType, label: 'Confessions', icon: MessageSquareMore },
    { id: 'memes' as TabType, label: 'Memes', icon: Image },
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
                  <h3 className="text-white font-medium mb-2 line-clamp-2">{note.title}</h3>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{note.description}</p>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span className="bg-violet-600/20 text-violet-400 px-2 py-1 rounded">{note.subject}</span>
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

      case 'confessions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Confessions Wall</h1>
                <p className="text-zinc-400">Anonymous thoughts and feelings from campus.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-4xl">
              {data.confessions.slice(0, 20).map((confession) => (
                <div key={confession.id} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <p className="text-white text-sm leading-relaxed mb-4">{confession.content}</p>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>{formatDate(new Date(confession.createdAt))}</span>
                    <span>{confession.reactions.length} reactions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'discussions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Discussions</h1>
                <p className="text-zinc-400">Start conversations and ask for help.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data.discussions.slice(0, 20).map((discussion) => (
                <div key={discussion.id} className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 text-xs bg-violet-600/20 text-violet-400 rounded">{discussion.category}</span>
                    <span className="text-xs text-zinc-500">{formatDate(new Date(discussion.createdAt))}</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">{discussion.title}</h3>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{discussion.content}</p>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>by {discussion.user?.name || "Unknown"}</span>
                    <span>{discussion._count.comments} comments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notices':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Notices</h1>
                <p className="text-zinc-400">Important announcements and updates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data.notices.slice(0, 20).map((notice) => (
                <div key={notice.id} className={`rounded-xl p-5 border ${
                  notice.isUrgent ? 'bg-red-900/20 border-red-700' : 'bg-zinc-800 border-zinc-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-medium">{notice.title}</h3>
                    {notice.isPinned && (
                      <span className="px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded">Pinned</span>
                    )}
                    {notice.isUrgent && (
                      <span className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded">Urgent</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-3">{notice.content}</p>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>by {notice.user?.name || "Admin"}</span>
                    <span>{formatDate(new Date(notice.createdAt))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Students</h1>
                <p className="text-zinc-400">Browse your classmates and their profiles.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.students.slice(0, 30).map((student) => (
                <div key={student.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
                      {student.name?.charAt(0) || student.email?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{student.name || "Unknown"}</h3>
                      <p className="text-zinc-400 text-sm">{student.email}</p>
                    </div>
                  </div>
                  {(student.rollNumber || student.branch || student.year) && (
                    <div className="text-xs text-violet-300 bg-zinc-900 px-2 py-1 rounded">
                      {student.rollNumber || "N/A"} • {student.branch || "N/A"} • Yr {student.year || "?"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="text-center py-12">
            <p className="text-white text-xl">Admin Panel</p>
            <p className="text-zinc-400 mt-2">Click the Admin link in the top navigation for full admin features</p>
          </div>
        );

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
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-8 overflow-x-auto">
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

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-zinc-400">Welcome back,</span>
                <span className="text-white font-medium">{username}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign out</span>
              </button>
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
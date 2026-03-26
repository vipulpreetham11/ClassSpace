import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

export const dynamic = "force-dynamic";

export default async function BirthdaysPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";

  const birthdays = await prisma.birthday.findMany({
    include: {
      user: { select: { name: true } }
    }
  });

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const todaysBirthdays = birthdays.filter(b => {
    const d = new Date(b.date);
    return d.getMonth() === currentMonth && d.getDate() === currentDay;
  });

  const upcomingBirthdays = birthdays.filter(b => {
    const d = new Date(b.date);
    d.setFullYear(today.getFullYear()); 
    if (d < today) {
      d.setFullYear(today.getFullYear() + 1); 
    }
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; 
  }).sort((a, b) => {
    const da = new Date(a.date); da.setFullYear(today.getFullYear()); if (da < today) da.setFullYear(today.getFullYear() + 1);
    const db = new Date(b.date); db.setFullYear(today.getFullYear()); if (db < today) db.setFullYear(today.getFullYear() + 1);
    return da.getTime() - db.getTime();
  });

  const getInitials = (name: string | null) => (name || "U").charAt(0).toUpperCase();

  const formatBirthday = (dateInput: Date | string) => formatDate(dateInput);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Birthdays</h1>
          <p className="text-zinc-400 mt-1">Celebrate your peers&apos; special days.</p>
        </div>
        {isAdmin && (
          <Link 
            href="/dashboard/birthdays/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Add Birthday
          </Link>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span aria-hidden="true">🎂</span> Today&apos;s Birthdays
        </h2>
        {todaysBirthdays.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-8 text-center text-zinc-500">
            No birthdays today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysBirthdays.map(b => (
              <div key={b.id} className="bg-violet-600/10 border-2 border-violet-600 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                  {getInitials(b.user?.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{b.user?.name || "Unknown"}</h3>
                  {b.message && (
                    <p className="text-violet-300 text-sm italic mt-0.5">
                      &quot;{b.message}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Upcoming Birthdays</h2>
        <p className="text-xs text-zinc-500 -mt-1">Next 30 days</p>
        {upcomingBirthdays.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-8 text-center text-zinc-500">
            No upcoming birthdays in the next 30 days.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBirthdays.map(b => (
              <div key={b.id} className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 flex gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {getInitials(b.user?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-medium truncate">{b.user?.name || "Unknown"}</h3>
                  <p className="text-zinc-400 text-xs mt-1">
                    {formatBirthday(b.date)}
                  </p>
                  {b.message && (
                    <p className="text-zinc-500 text-xs italic mt-2 line-clamp-2">
                      &quot;{b.message}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

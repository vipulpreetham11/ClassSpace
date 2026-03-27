import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

function DashboardLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 animate-spin text-violet-500 mx-auto border-4 border-violet-500 border-t-transparent rounded-full"></div>
        <p className="text-white text-lg">Loading ClassSpace...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoader />}>
      <DashboardClient />
    </Suspense>
  );
}


'use client';

import Link from 'next/link';

import { RoadmapHistoryPage } from '../../../components/roadmap-history/roadmap-history-page';

export default function RoadmapHistoryDashboardPage() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <Link className="text-sm text-primary hover:underline" href="/dashboard">
          ダッシュボードへ
        </Link>
      </div>
      <RoadmapHistoryPage />
    </div>
  );
}

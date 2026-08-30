"use client";

import { useEffect, useState } from "react";
import { PageLayout } from '@/components/layout';

export default function ReleaseNotesPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/release-notes')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ notes: [] }));
  }, []);

  return (
    <PageLayout>
      <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-white">发布说明</h1>
          <div className="mt-8 space-y-6">
            {(data?.notes || []).map((item: any) => (
              <div key={item.date} className="rounded-lg border border-neutral-800 p-6">
                <div className="text-white font-semibold">{item.date}</div>
                <ul className="mt-3 space-y-2 text-neutral-300">
                  {(item.notes || []).map((note: string, index: number) => (
                    <li key={index}>• {note}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

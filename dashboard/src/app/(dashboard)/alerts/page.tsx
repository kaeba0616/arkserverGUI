"use client";

import { useEffect, useState } from "react";
import { AlertConfig } from "@/components/alert-config";

export default function AlertsPage() {
  const [data, setData] = useState<{ rules: []; events: [] }>({ rules: [], events: [] });

  const loadData = () => {
    fetch("/api/alerts").then((r) => r.json()).then(setData);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">알림 설정</h2>
      <AlertConfig rules={data.rules} events={data.events} onRefresh={loadData} />
    </div>
  );
}

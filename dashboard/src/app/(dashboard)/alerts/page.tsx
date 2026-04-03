"use client";

import { useEffect, useState } from "react";
import { AlertConfig } from "@/components/alert-config";
import { useServerContext } from "@/hooks/use-server-context";

export default function AlertsPage() {
  const [data, setData] = useState<{ rules: []; events: [] }>({ rules: [], events: [] });
  const { serverId } = useServerContext();

  const loadData = () => {
    if (!serverId) return;
    fetch(`/api/alerts?serverId=${serverId}`).then((r) => r.json()).then(setData);
  };

  useEffect(() => { loadData(); }, [serverId]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">알림 설정</h2>
      <AlertConfig rules={data.rules} events={data.events} onRefresh={loadData} />
    </div>
  );
}

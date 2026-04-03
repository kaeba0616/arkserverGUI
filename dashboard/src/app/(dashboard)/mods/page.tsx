"use client";

import { useEffect, useState } from "react";
import { ModManager } from "@/components/mod-manager";
import { useServerContext } from "@/hooks/use-server-context";

export default function ModsPage() {
  const [mods, setMods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { serverId } = useServerContext();

  useEffect(() => {
    if (!serverId) return;
    fetch(`/api/settings/env?serverId=${serverId}`)
      .then((r) => r.json())
      .then((data) => {
        const modStr = data.ARK_MODS || "";
        setMods(modStr ? modStr.split(",").map((m: string) => m.trim()).filter(Boolean) : []);
        setLoading(false);
      });
  }, [serverId]);

  const saveMods = async (newMods: string[]) => {
    const res = await fetch(`/api/settings/env?serverId=${serverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ARK_MODS: newMods.join(","),
        GAME_MOD_IDS: newMods.join(","),
      }),
    });
    const result = await res.json();
    alert(result.message || result.error);
  };

  if (loading) return <div className="text-muted-foreground">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">모드 관리</h2>
      <ModManager mods={mods} onSave={saveMods} />
    </div>
  );
}

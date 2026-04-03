"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnvSettingsForm, IniSettingsForm } from "@/components/settings-form";
import { useServerContext } from "@/hooks/use-server-context";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const [envData, setEnvData] = useState<Record<string, string>>({});
  const [configData, setConfigData] = useState<Record<number, Record<string, Record<string, string>>>>({});
  const [loading, setLoading] = useState(true);
  const { serverId } = useServerContext();

  const { data: serverInfo } = useSWR(
    serverId ? `/api/servers/${serverId}` : null,
    fetcher
  );

  const configFiles = serverInfo?.adapter?.configFiles || [];

  useEffect(() => {
    if (!serverId) return;

    setLoading(true);
    fetch(`/api/settings/env?serverId=${serverId}`)
      .then((r) => r.json())
      .then(setEnvData);

    // Load all config files
    if (configFiles.length > 0) {
      Promise.all(
        configFiles.map((_: unknown, i: number) =>
          fetch(`/api/settings/game-user?serverId=${serverId}&fileIndex=${i}`).then((r) => r.json())
        )
      ).then((results: Record<string, Record<string, string>>[]) => {
        const data: Record<number, Record<string, Record<string, string>>> = {};
        results.forEach((result, i) => { data[i] = result; });
        setConfigData(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [serverId, configFiles.length]);

  const saveEnv = async (data: Record<string, string>) => {
    const res = await fetch(`/api/settings/env?serverId=${serverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    alert(result.message || result.error);
  };

  const saveConfigFile = async (fileIndex: number, data: Record<string, Record<string, string>>) => {
    const res = await fetch(`/api/settings/game-user?serverId=${serverId}&fileIndex=${fileIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    alert(result.message || result.error);
  };

  if (loading) {
    return <div className="text-muted-foreground">설정 로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">서버 설정</h2>
      <Tabs defaultValue="env">
        <TabsList>
          <TabsTrigger value="env">환경 변수</TabsTrigger>
          {configFiles.map((cf: { name: string }, i: number) => (
            <TabsTrigger key={i} value={`config-${i}`}>{cf.name}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="env" className="mt-4">
          <EnvSettingsForm data={envData} onSave={saveEnv} />
        </TabsContent>
        {configFiles.map((cf: { name: string }, i: number) => (
          <TabsContent key={i} value={`config-${i}`} className="mt-4">
            <IniSettingsForm
              title={cf.name}
              data={configData[i] || {}}
              onSave={(data) => saveConfigFile(i, data)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnvSettingsForm, IniSettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  const [envData, setEnvData] = useState<Record<string, string>>({});
  const [gameUserData, setGameUserData] = useState<Record<string, Record<string, string>>>({});
  const [gameData, setGameData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/env").then((r) => r.json()),
      fetch("/api/settings/game-user").then((r) => r.json()),
      fetch("/api/settings/game").then((r) => r.json()),
    ]).then(([env, gameUser, game]) => {
      setEnvData(env);
      setGameUserData(gameUser);
      setGameData(game);
      setLoading(false);
    });
  }, []);

  const saveEnv = async (data: Record<string, string>) => {
    const res = await fetch("/api/settings/env", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    alert(result.message || result.error);
  };

  const saveIni = async (endpoint: string, data: Record<string, Record<string, string>>) => {
    const res = await fetch(endpoint, {
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
          <TabsTrigger value="gameuser">GameUserSettings</TabsTrigger>
          <TabsTrigger value="game">Game.ini</TabsTrigger>
        </TabsList>
        <TabsContent value="env" className="mt-4">
          <EnvSettingsForm data={envData} onSave={saveEnv} />
        </TabsContent>
        <TabsContent value="gameuser" className="mt-4">
          <IniSettingsForm
            title="GameUserSettings.ini"
            data={gameUserData}
            onSave={(data) => saveIni("/api/settings/game-user", data)}
          />
        </TabsContent>
        <TabsContent value="game" className="mt-4">
          <IniSettingsForm
            title="Game.ini"
            data={gameData}
            onSave={(data) => saveIni("/api/settings/game", data)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

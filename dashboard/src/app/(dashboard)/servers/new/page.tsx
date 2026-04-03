"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerContext } from "@/hooks/use-server-context";

interface AdapterInfo {
  id: string;
  displayName: string;
  ports: { name: string; default: number; protocol: string }[];
  settingsFields: { key: string; label: string; type: string; defaultValue?: string; options?: { value: string; label: string }[] }[];
  docker: { image: string; resources?: { memLimitGb?: number; cpus?: number } };
}

const GAME_ICONS: Record<string, string> = {
  ark: "A",
  minecraft: "M",
  valheim: "V",
  palworld: "P",
};

export default function NewServerPage() {
  const router = useRouter();
  const { setServerId } = useServerContext();
  const [step, setStep] = useState(1);
  const [adapters, setAdapters] = useState<AdapterInfo[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [serverName, setServerName] = useState("");
  const [serverId, setServerIdInput] = useState("");
  const [rconPassword, setRconPassword] = useState("");
  const [envOverrides, setEnvOverrides] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/adapters").then((r) => r.json()).then(setAdapters);
  }, []);

  const selectedAdapter = adapters.find((a) => a.id === selectedGame);

  const handleSelectGame = (gameId: string) => {
    setSelectedGame(gameId);
    const adapter = adapters.find((a) => a.id === gameId);
    if (adapter) {
      setServerName(`My ${adapter.displayName} Server`);
      setServerIdInput(`${gameId}-1`);
      // Set default env values
      const defaults: Record<string, string> = {};
      for (const field of adapter.settingsFields) {
        if (field.defaultValue) {
          defaults[field.key] = field.defaultValue;
        }
      }
      setEnvOverrides(defaults);
    }
    setStep(2);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: serverId,
          name: serverName,
          gameId: selectedGame,
          rconPassword,
          envOverrides,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "서버 생성 실패");
        setCreating(false);
        return;
      }

      setServerId(serverId);
      router.push("/servers");
    } catch {
      setError("서버 통신 오류");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">새 서버 추가</h2>

      {/* Step 1: Game Selection */}
      {step === 1 && (
        <div>
          <p className="text-muted-foreground mb-4">게임을 선택하세요</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {adapters.map((adapter) => (
              <Card
                key={adapter.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleSelectGame(adapter.id)}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-lg font-bold">
                    {GAME_ICONS[adapter.id] || "?"}
                  </span>
                  <div>
                    <p className="font-medium">{adapter.displayName}</p>
                    <p className="text-xs text-muted-foreground">{adapter.docker.image}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Basic Settings */}
      {step === 2 && selectedAdapter && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>&larr; 뒤로</Button>
            <span className="text-muted-foreground">{selectedAdapter.displayName}</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">기본 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>서버 이름</Label>
                <Input value={serverName} onChange={(e) => setServerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>서버 ID (영문 소문자, 숫자, 하이픈)</Label>
                <Input value={serverId} onChange={(e) => setServerIdInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </div>
              <div className="space-y-2">
                <Label>RCON/관리자 비밀번호</Label>
                <Input value={rconPassword} onChange={(e) => setRconPassword(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">게임 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAdapter.settingsFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  {field.type === "select" && field.options ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={envOverrides[field.key] || field.defaultValue || ""}
                      onChange={(e) => setEnvOverrides({ ...envOverrides, [field.key]: e.target.value })}
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === "boolean" ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={envOverrides[field.key] || field.defaultValue || "false"}
                      onChange={(e) => setEnvOverrides({ ...envOverrides, [field.key]: e.target.value })}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={envOverrides[field.key] || field.defaultValue || ""}
                      onChange={(e) => setEnvOverrides({ ...envOverrides, [field.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating || !serverName || !serverId}>
              {creating ? "생성 중..." : "서버 생성"}
            </Button>
            <Button variant="outline" onClick={() => setStep(1)}>취소</Button>
          </div>
        </div>
      )}
    </div>
  );
}

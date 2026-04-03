"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerContext } from "@/hooks/use-server-context";

interface Props {
  serverState: string;
  hasUpdateCommand: boolean;
  onAction: () => void;
}

export function ServerControlPanel({ serverState, hasUpdateCommand, onAction }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const { serverId } = useServerContext();

  const handleAction = async (action: string) => {
    if (loading || !serverId) return;

    const confirmMessages: Record<string, string> = {
      stop: "서버를 종료하시겠습니까? 30초 경고 후 종료됩니다.",
      restart: "서버를 재시작하시겠습니까? 60초 경고 후 재시작됩니다.",
      update: "서버를 업데이트하시겠습니까?",
    };

    if (confirmMessages[action] && !window.confirm(confirmMessages[action])) {
      return;
    }

    setLoading(action);
    try {
      const res = await fetch(`/api/server/control?serverId=${serverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "오류가 발생했습니다.");
      }
      onAction();
    } catch {
      alert("서버 통신 오류");
    } finally {
      setLoading(null);
    }
  };

  const isRunning = serverState === "running";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">서버 제어</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => handleAction("start")}
          disabled={isRunning || !!loading}
        >
          {loading === "start" ? "시작 중..." : "시작"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction("stop")}
          disabled={!isRunning || !!loading}
        >
          {loading === "stop" ? "종료 중..." : "종료"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleAction("restart")}
          disabled={!isRunning || !!loading}
        >
          {loading === "restart" ? "재시작 중..." : "재시작"}
        </Button>
        {hasUpdateCommand && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("update")}
            disabled={!isRunning || !!loading}
          >
            {loading === "update" ? "업데이트 중..." : "업데이트"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

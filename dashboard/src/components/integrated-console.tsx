"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useServerContext } from "@/hooks/use-server-context";
import useSWR from "swr";

interface LogEntry {
  type: "server" | "command" | "response" | "error" | "system";
  text: string;
  timestamp: Date;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function IntegratedConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { serverId } = useServerContext();

  const { data: serverInfo } = useSWR(
    serverId ? `/api/servers/${serverId}` : null,
    fetcher
  );

  const quickCommands: { label: string; cmd: string }[] = serverInfo?.adapter?.quickCommands || [];

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // SSE log stream
  const connectStream = useCallback(() => {
    if (!serverId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setLogs((prev) => [...prev, { type: "system", text: "서버 로그에 연결 중...", timestamp: new Date() }]);

    const es = new EventSource(`/api/logs/stream?serverId=${serverId}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setLogs((prev) => [...prev, { type: "system", text: "연결됨", timestamp: new Date() }]);
    };

    es.onmessage = (event) => {
      try {
        const line = JSON.parse(event.data);
        setLogs((prev) => {
          const next = [...prev, { type: "server" as const, text: line, timestamp: new Date() }];
          return next.length > 2000 ? next.slice(-1000) : next;
        });
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setLogs((prev) => [...prev, { type: "system", text: "연결 끊김. 3초 후 재연결...", timestamp: new Date() }]);
      setTimeout(connectStream, 3000);
    };
  }, [serverId]);

  // Connect on mount / server change
  useEffect(() => {
    connectStream();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectStream]);

  // RCON command
  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || loading || !serverId) return;

    setHistory((prev) => [cmd, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    setLogs((prev) => [...prev, { type: "command", text: cmd, timestamp: new Date() }]);
    setCommand("");
    setLoading(true);

    try {
      const res = await fetch(`/api/rcon?serverId=${serverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (res.ok) {
        setLogs((prev) => [...prev, { type: "response", text: data.response || "(empty)", timestamp: new Date() }]);
      } else {
        setLogs((prev) => [...prev, { type: "error", text: data.error || "Error", timestamp: new Date() }]);
      }
    } catch {
      setLogs((prev) => [...prev, { type: "error", text: "통신 오류", timestamp: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "command": return "text-green-400";
      case "response": return "text-yellow-300";
      case "error": return "text-red-400";
      case "system": return "text-blue-400 italic";
      default: return "text-gray-300";
    }
  };

  const filteredLogs = filter
    ? logs.filter((l) => l.text.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "destructive"}>
            {connected ? "연결됨" : "연결 끊김"}
          </Badge>
          {!connected && (
            <Button size="sm" variant="outline" onClick={connectStream}>재연결</Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="필터..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-7 w-40 text-xs"
          />
          <Button size="sm" variant="ghost" onClick={() => setAutoScroll(!autoScroll)}>
            {autoScroll ? "자동스크롤 ON" : "자동스크롤 OFF"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setLogs([])}>지우기</Button>
        </div>
      </div>

      {/* Log area */}
      <div className="flex-1 overflow-y-auto rounded-md border bg-black/80 p-3 font-mono text-xs leading-5">
        {filteredLogs.map((log, i) => (
          <div key={i} className={getLogColor(log.type)}>
            {log.type === "command" && <span className="text-green-600">&gt; </span>}
            {log.type === "response" && <span className="text-yellow-600">&lt; </span>}
            <span className="whitespace-pre-wrap">{log.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick commands */}
      {quickCommands.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quickCommands.map((qc) => (
            <Button key={qc.cmd} size="sm" variant="outline" className="h-7 text-xs" onClick={() => executeCommand(qc.cmd)} disabled={loading}>
              {qc.label}
            </Button>
          ))}
        </div>
      )}

      {/* Command input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeCommand(command);
        }}
        className="flex gap-2"
      >
        <Input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="명령어 입력... (RCON)"
          className="font-mono text-sm"
          autoFocus
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !command.trim()}>
          전송
        </Button>
      </form>
    </div>
  );
}

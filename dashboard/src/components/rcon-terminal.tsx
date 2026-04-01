"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  type: "command" | "response" | "error";
  text: string;
  timestamp: Date;
}

const QUICK_COMMANDS = [
  { label: "월드 저장", cmd: "saveworld" },
  { label: "접속자", cmd: "listplayers" },
  { label: "야생공룡 리스폰", cmd: "destroywilddinos" },
  { label: "시간 변경 (낮)", cmd: "settimeofday 12:00" },
];

export function RconTerminal() {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || loading) return;

    setHistory((prev) => [cmd, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    setLogs((prev) => [...prev, { type: "command", text: cmd, timestamp: new Date() }]);
    setCommand("");
    setLoading(true);

    try {
      const res = await fetch("/api/rcon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (res.ok) {
        setLogs((prev) => [...prev, { type: "response", text: data.response || "(empty response)", timestamp: new Date() }]);
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

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((qc) => (
          <Button key={qc.cmd} size="sm" variant="outline" onClick={() => executeCommand(qc.cmd)} disabled={loading}>
            {qc.label}
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1 rounded-md border bg-black/50 p-4 font-mono text-sm">
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className={log.type === "command" ? "text-green-400" : log.type === "error" ? "text-red-400" : "text-gray-300"}>
              {log.type === "command" && <span className="text-green-600">&gt; </span>}
              <span className="whitespace-pre-wrap">{log.text}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

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
          placeholder="RCON 명령어 입력..."
          className="font-mono"
          autoFocus
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !command.trim()}>
          실행
        </Button>
      </form>
    </div>
  );
}

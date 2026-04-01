"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogStream } from "@/hooks/use-log-stream";

export function LogViewer() {
  const { logs, connected, connect, disconnect, clearLogs } = useLogStream();
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = filter
    ? logs.filter((l) => l.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={connected ? disconnect : connect}>
          {connected ? "연결 해제" : "연결"}
        </Button>
        <Button size="sm" variant="outline" onClick={clearLogs}>
          로그 지우기
        </Button>
        <Badge variant={connected ? "default" : "secondary"}>
          {connected ? "연결됨" : "연결 안됨"}
        </Badge>
        <div className="flex items-center gap-2">
          <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
          <Label className="text-sm">자동 스크롤</Label>
        </div>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="필터..."
          className="max-w-xs"
        />
        <span className="text-xs text-muted-foreground">{filteredLogs.length}줄</span>
      </div>

      <ScrollArea className="flex-1 rounded-md border bg-black/50 p-4">
        <div className="font-mono text-xs leading-relaxed text-gray-300">
          {filteredLogs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap hover:bg-white/5">
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

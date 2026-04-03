"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useServerContext } from "./use-server-context";

export function useLogStream() {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { serverId } = useServerContext();

  const connect = useCallback(() => {
    if (!serverId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/logs/stream?serverId=${serverId}`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const line = JSON.parse(event.data);
        setLogs((prev) => {
          const next = [...prev, line];
          return next.length > 1000 ? next.slice(-500) : next;
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(connect, 3000);
    };
  }, [serverId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // Reconnect when serverId changes
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [serverId]);

  return { logs, connected, connect, disconnect, clearLogs };
}

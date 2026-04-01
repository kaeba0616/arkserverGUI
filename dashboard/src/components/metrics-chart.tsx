"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricPoint {
  timestamp: number;
  cpuPercent: number;
  memUsageMb: number;
  playerCount: number;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function CpuChart({ data }: { data: MetricPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">CPU 사용률 (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} domain={[0, "auto"]} />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleString("ko-KR")}
              contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}
            />
            <Line type="monotone" dataKey="cpuPercent" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPU %" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MemoryChart({ data }: { data: MetricPoint[] }) {
  const formatted = data.map((d) => ({ ...d, memUsageGb: (d.memUsageMb / 1024).toFixed(2) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">메모리 사용량 (GB)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleString("ko-KR")}
              contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}
            />
            <Line type="monotone" dataKey="memUsageGb" stroke="#10b981" strokeWidth={2} dot={false} name="Memory GB" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PlayerChart({ data }: { data: MetricPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">접속자 수</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleString("ko-KR")}
              contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}
            />
            <Line type="stepAfter" dataKey="playerCount" stroke="#f59e0b" strokeWidth={2} dot={false} name="Players" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

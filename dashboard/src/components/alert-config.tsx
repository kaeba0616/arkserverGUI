"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AlertRule } from "@/types/alert";

const METRICS = [
  { value: "cpu", label: "CPU (%)" },
  { value: "memory", label: "메모리 (MB)" },
  { value: "players", label: "접속자 수" },
];

const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "eq", label: "=" },
];

interface Props {
  rules: AlertRule[];
  events: Array<{ id: number; metric: string; operator: string; threshold: number; value: number; timestamp: number }>;
  onRefresh: () => void;
}

export function AlertConfig({ rules, events, onRefresh }: Props) {
  const [metric, setMetric] = useState("cpu");
  const [operator, setOperator] = useState("gt");
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  const addRule = async () => {
    if (!threshold) return;
    setSaving(true);
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric, operator, threshold: parseFloat(threshold), enabled: true }),
    });
    setThreshold("");
    setSaving(false);
    onRefresh();
  };

  const deleteRule = async (id: number) => {
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRefresh();
  };

  const acknowledgeAll = async () => {
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acknowledge" }),
    });
    onRefresh();
  };

  const metricLabel = (m: string) => METRICS.find((x) => x.value === m)?.label || m;
  const opLabel = (o: string) => OPERATORS.find((x) => x.value === o)?.label || o;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">새 알림 규칙</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">메트릭</Label>
              <Select value={metric} onValueChange={(v) => v && setMetric(v)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">조건</Label>
              <Select value={operator} onValueChange={(v) => v && setOperator(v)}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">임계값</Label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-24"
                placeholder="80"
              />
            </div>
            <Button onClick={addRule} disabled={saving || !threshold}>추가</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">활성 규칙</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 알림 규칙이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <span>
                    {metricLabel(rule.metric)} {opLabel(rule.operator)} {rule.threshold}
                  </span>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRule(rule.id)}>
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">최근 알림</CardTitle>
          {events.length > 0 && (
            <Button size="sm" variant="outline" onClick={acknowledgeAll}>모두 확인</Button>
          )}
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">미확인 알림이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm">
                  <div>
                    <Badge variant="destructive" className="mr-2">경고</Badge>
                    {metricLabel(event.metric)} {opLabel(event.operator)} {event.threshold} (현재: {event.value.toFixed(1)})
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString("ko-KR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

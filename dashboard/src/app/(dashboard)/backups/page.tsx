"use client";

import { useEffect, useState } from "react";
import { BackupTable } from "@/components/backup-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useServerContext } from "@/hooks/use-server-context";
import type { BackupInfo, BackupSchedule } from "@/types/backup";

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [schedule, setSchedule] = useState<BackupSchedule>({
    enabled: false,
    cronExpression: "0 */6 * * *",
    retentionDays: 7,
    maxCount: 20,
  });
  const [saving, setSaving] = useState(false);
  const { serverId } = useServerContext();

  const loadData = () => {
    if (!serverId) return;
    fetch(`/api/backups?serverId=${serverId}`).then((r) => r.json()).then(setBackups);
    fetch(`/api/backups/schedule?serverId=${serverId}`).then((r) => r.json()).then(setSchedule);
  };

  useEffect(() => { loadData(); }, [serverId]);

  const saveSchedule = async () => {
    setSaving(true);
    const res = await fetch(`/api/backups/schedule?serverId=${serverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    const data = await res.json();
    alert(data.message || data.error);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">백업 관리</h2>

      <BackupTable backups={backups} onRefresh={loadData} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">자동 백업 스케줄</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={schedule.enabled}
              onCheckedChange={(v) => setSchedule((s) => ({ ...s, enabled: v }))}
            />
            <Label>자동 백업 활성화</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Cron 표현식</Label>
              <Input
                value={schedule.cronExpression}
                onChange={(e) => setSchedule((s) => ({ ...s, cronExpression: e.target.value }))}
                placeholder="0 */6 * * *"
              />
              <p className="text-xs text-muted-foreground">기본: 6시간마다</p>
            </div>
            <div className="space-y-2">
              <Label>보존 기간 (일)</Label>
              <Input
                type="number"
                value={schedule.retentionDays}
                onChange={(e) => setSchedule((s) => ({ ...s, retentionDays: parseInt(e.target.value) || 7 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>최대 백업 수</Label>
              <Input
                type="number"
                value={schedule.maxCount}
                onChange={(e) => setSchedule((s) => ({ ...s, maxCount: parseInt(e.target.value) || 20 }))}
              />
            </div>
          </div>
          <Button onClick={saveSchedule} disabled={saving}>
            {saving ? "저장 중..." : "스케줄 저장"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

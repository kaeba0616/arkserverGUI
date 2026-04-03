"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerContext } from "@/hooks/use-server-context";
import type { BackupInfo } from "@/types/backup";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface Props {
  backups: BackupInfo[];
  onRefresh: () => void;
}

export function BackupTable({ backups, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const { serverId } = useServerContext();

  const createBackup = async () => {
    setLoading("create");
    const res = await fetch(`/api/backups?serverId=${serverId}`, { method: "POST" });
    const data = await res.json();
    alert(data.message || data.error);
    setLoading(null);
    onRefresh();
  };

  const restoreBackup = async (filename: string) => {
    if (!window.confirm(`"${filename}"을(를) 복원하시겠습니까?\n서버가 중지됩니다.`)) return;
    setLoading(filename);
    const res = await fetch(`/api/backups/restore?serverId=${serverId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    const data = await res.json();
    alert(data.message || data.error);
    setLoading(null);
    onRefresh();
  };

  const deleteBackup = async (filename: string) => {
    if (!window.confirm(`"${filename}"을(를) 삭제하시겠습니까?`)) return;
    setLoading(filename);
    const res = await fetch(`/api/backups?serverId=${serverId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    const data = await res.json();
    alert(data.message || data.error);
    setLoading(null);
    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">백업 목록</CardTitle>
        <Button size="sm" onClick={createBackup} disabled={!!loading}>
          {loading === "create" ? "생성 중..." : "새 백업"}
        </Button>
      </CardHeader>
      <CardContent>
        {backups.length === 0 ? (
          <p className="text-sm text-muted-foreground">백업이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">파일명</th>
                <th className="pb-2 font-medium">크기</th>
                <th className="pb-2 font-medium">생성일</th>
                <th className="pb-2 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.filename} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{b.filename}</td>
                  <td className="py-2">{formatSize(b.size)}</td>
                  <td className="py-2">{new Date(b.createdAt).toLocaleString("ko-KR")}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreBackup(b.filename)}
                        disabled={!!loading}
                      >
                        복원
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteBackup(b.filename)}
                        disabled={!!loading}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

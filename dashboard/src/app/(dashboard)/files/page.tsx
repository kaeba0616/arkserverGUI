"use client";

import { FileManager } from "@/components/file-manager";
import { useServerContext } from "@/hooks/use-server-context";

export default function FilesPage() {
  const { serverId } = useServerContext();

  if (!serverId) {
    return (
      <div className="text-muted-foreground">서버를 선택하세요.</div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      <h2 className="text-2xl font-bold">파일 매니저</h2>
      <FileManager />
    </div>
  );
}

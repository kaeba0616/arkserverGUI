"use client";

import { LogViewer } from "@/components/log-viewer";

export default function LogsPage() {
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col space-y-4">
      <h2 className="text-2xl font-bold">서버 로그</h2>
      <div className="flex-1">
        <LogViewer />
      </div>
    </div>
  );
}

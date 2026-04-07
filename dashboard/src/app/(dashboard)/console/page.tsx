"use client";

import { IntegratedConsole } from "@/components/integrated-console";

export default function ConsolePage() {
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      <h2 className="text-2xl font-bold">콘솔</h2>
      <IntegratedConsole />
    </div>
  );
}

"use client";

import { RconTerminal } from "@/components/rcon-terminal";

export default function ConsolePage() {
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col space-y-4">
      <h2 className="text-2xl font-bold">RCON 콘솔</h2>
      <div className="flex-1">
        <RconTerminal />
      </div>
    </div>
  );
}

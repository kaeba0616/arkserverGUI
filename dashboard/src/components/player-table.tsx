"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlayerInfo } from "@/types/server";

export function PlayerTable({ players }: { players: PlayerInfo[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">접속 중인 플레이어</CardTitle>
        <Badge variant="secondary">{players.length}명</Badge>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">접속 중인 플레이어가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span className="font-medium">{player.name}</span>
                <span className="text-xs text-muted-foreground">{player.id}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { usePlayers } from "@/hooks/use-players";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PlayersPage() {
  const { players, count, isLoading } = usePlayers();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">플레이어</h2>
        <Badge variant="secondary">{count}명 접속 중</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">접속자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          ) : players.length === 0 ? (
            <p className="text-sm text-muted-foreground">접속 중인 플레이어가 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">이름</th>
                  <th className="pb-2 font-medium">ID</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b last:border-0">
                    <td className="py-2">{player.index}</td>
                    <td className="py-2 font-medium">{player.name}</td>
                    <td className="py-2 text-muted-foreground">{player.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

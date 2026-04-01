"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  mods: string[];
  onSave: (mods: string[]) => Promise<void>;
}

export function ModManager({ mods: initialMods, onSave }: Props) {
  const [mods, setMods] = useState(initialMods);
  const [newModId, setNewModId] = useState("");
  const [saving, setSaving] = useState(false);

  const addMod = () => {
    const id = newModId.trim();
    if (!id || mods.includes(id)) return;
    setMods((prev) => [...prev, id]);
    setNewModId("");
  };

  const removeMod = (id: string) => {
    setMods((prev) => prev.filter((m) => m !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(mods);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Steam Workshop 모드</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newModId}
            onChange={(e) => setNewModId(e.target.value)}
            placeholder="모드 ID 입력 (예: 731604991)"
            onKeyDown={(e) => e.key === "Enter" && addMod()}
          />
          <Button onClick={addMod} variant="secondary">추가</Button>
        </div>

        {mods.length === 0 ? (
          <p className="text-sm text-muted-foreground">설치된 모드가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mods.map((mod) => (
              <Badge key={mod} variant="secondary" className="gap-1 pr-1">
                {mod}
                <button
                  onClick={() => removeMod(mod)}
                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
          <p className="text-xs text-muted-foreground">저장 후 서버를 재시작해야 적용됩니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}

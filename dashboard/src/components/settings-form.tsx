"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SERVER_MAPS = [
  "TheIsland", "Ragnarok", "TheCenter", "Valguero_P",
  "CrystalIsles", "LostIsland", "Fjordur",
];

interface EnvFormProps {
  data: Record<string, string>;
  onSave: (data: Record<string, string>) => Promise<void>;
}

export function EnvSettingsForm({ data, onSave }: EnvFormProps) {
  const [values, setValues] = useState(data);
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">서버 기본 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>서버 이름</Label>
            <Input value={values.SESSION_NAME || ""} onChange={(e) => update("SESSION_NAME", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>맵</Label>
            <Select value={values.SERVER_MAP || "TheIsland"} onValueChange={(v) => v && update("SERVER_MAP", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVER_MAPS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>서버 비밀번호</Label>
            <Input value={values.SERVER_PASSWORD || ""} onChange={(e) => update("SERVER_PASSWORD", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>관리자 비밀번호</Label>
            <Input value={values.ADMIN_PASSWORD || ""} onChange={(e) => update("ADMIN_PASSWORD", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>최대 접속자</Label>
            <Input type="number" value={values.MAX_PLAYERS || "20"} onChange={(e) => update("MAX_PLAYERS", e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        <p className="text-xs text-muted-foreground">저장 후 서버를 재시작해야 적용됩니다.</p>
      </CardContent>
    </Card>
  );
}

interface IniFormProps {
  title: string;
  data: Record<string, Record<string, string>>;
  onSave: (data: Record<string, Record<string, string>>) => Promise<void>;
}

export function IniSettingsForm({ title, data, onSave }: IniFormProps) {
  const [values, setValues] = useState(data);
  const [saving, setSaving] = useState(false);

  const update = (section: string, key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(values).map(([section, fields]) => (
          <div key={section}>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">[{section}]</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(fields).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{key}</Label>
                  <Input
                    value={val}
                    onChange={(e) => update(section, key, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        <p className="text-xs text-muted-foreground">저장 후 서버를 재시작해야 적용됩니다.</p>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { SettingsFieldDef } from "@/lib/adapters/types";

interface EnvFormProps {
  data: Record<string, string>;
  settingsFields?: SettingsFieldDef[];
  onSave: (data: Record<string, string>) => Promise<void>;
}

export function EnvSettingsForm({ data, settingsFields, onSave }: EnvFormProps) {
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

  // Group fields by category
  const fields = settingsFields || [];
  const categories = new Map<string, SettingsFieldDef[]>();
  for (const field of fields) {
    const cat = field.category || "기타";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(field);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">서버 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.length > 0 ? (
          Array.from(categories.entries()).map(([category, catFields]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {catFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    {field.type === "select" && field.options ? (
                      <Select
                        value={values[field.key] || field.defaultValue || ""}
                        onValueChange={(v) => v && update(field.key, v)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === "boolean" ? (
                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          checked={(values[field.key] || field.defaultValue) === "true"}
                          onCheckedChange={(v) => update(field.key, v ? "true" : "false")}
                        />
                        <span className="text-sm text-muted-foreground">
                          {(values[field.key] || field.defaultValue) === "true" ? "활성" : "비활성"}
                        </span>
                      </div>
                    ) : (
                      <Input
                        type={field.type === "number" ? "number" : "text"}
                        value={values[field.key] || field.defaultValue || ""}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Fallback: show raw key-value editor
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(values).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{key}</Label>
                <Input value={val} onChange={(e) => update(key, e.target.value)} className="h-8 text-sm" />
              </div>
            ))}
          </div>
        )}
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

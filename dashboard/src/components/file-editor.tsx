"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerContext } from "@/hooks/use-server-context";

interface Props {
  filePath: string;
  content: string;
  onClose: () => void;
  onSaved: () => void;
}

export function FileEditor({ filePath, content: initialContent, onClose, onSaved }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { serverId } = useServerContext();

  const handleChange = (value: string) => {
    setContent(value);
    setModified(value !== initialContent);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/write?serverId=${serverId}&path=${encodeURIComponent(filePath)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setModified(false);
        onSaved();
      } else {
        setError(data.error || "저장 실패");
      }
    } catch {
      setError("통신 오류");
    } finally {
      setSaving(false);
    }
  };

  const lines = content.split("\n");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground">{filePath}</span>
          {modified && <span className="text-yellow-500 text-xs">(수정됨)</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>닫기</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !modified}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-auto bg-black/50 font-mono text-sm">
        {/* Line numbers */}
        <div className="select-none border-r border-border/30 px-2 py-2 text-right text-muted-foreground/50 leading-6">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Text area */}
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 resize-none bg-transparent p-2 text-gray-200 outline-none leading-6"
          spellCheck={false}
          wrap="off"
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerContext } from "@/hooks/use-server-context";
import { FileEditor } from "./file-editor";

interface FileEntry {
  name: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function FileManager() {
  const [currentPath, setCurrentPath] = useState("/");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { serverId } = useServerContext();

  const loadDirectory = useCallback(async (dirPath: string) => {
    if (!serverId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files?serverId=${serverId}&path=${encodeURIComponent(dirPath)}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
        setCurrentPath(dirPath);
      } else {
        setError(data.error || "디렉토리를 불러올 수 없습니다.");
      }
    } catch {
      setError("서버 통신 오류");
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadDirectory("/");
  }, [loadDirectory]);

  const navigateTo = (name: string) => {
    const newPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
    loadDirectory(newPath);
  };

  const navigateUp = () => {
    if (currentPath === "/") return;
    const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
    loadDirectory(parent);
  };

  const openFile = async (name: string) => {
    const filePath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
    try {
      const res = await fetch(`/api/files/read?serverId=${serverId}&path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "파일을 열 수 없습니다.");
        return;
      }
      if (!data.editable) {
        setError(data.message || "편집할 수 없는 파일입니다.");
        return;
      }
      setEditingFile({ path: filePath, content: data.content });
    } catch {
      setError("통신 오류");
    }
  };

  const deleteEntry = async (name: string) => {
    if (!window.confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return;
    const entryPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
    try {
      await fetch(`/api/files?serverId=${serverId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: entryPath }),
      });
      loadDirectory(currentPath);
    } catch {
      setError("삭제 실패");
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const folderPath = currentPath === "/" ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
    try {
      const res = await fetch(`/api/files/mkdir?serverId=${serverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderPath }),
      });
      if (res.ok) {
        setNewFolderName("");
        setShowNewFolder(false);
        loadDirectory(currentPath);
      } else {
        const data = await res.json();
        setError(data.error || "폴더 생성 실패");
      }
    } catch {
      setError("통신 오류");
    }
  };

  // Show file editor
  if (editingFile) {
    return (
      <FileEditor
        filePath={editingFile.path}
        content={editingFile.content}
        onClose={() => setEditingFile(null)}
        onSaved={() => loadDirectory(currentPath)}
      />
    );
  }

  // Breadcrumb
  const pathParts = currentPath === "/" ? [] : currentPath.split("/").filter(Boolean);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm">
          <button onClick={() => loadDirectory("/")} className="text-primary hover:underline">/</button>
          {pathParts.map((part, i) => {
            const partPath = "/" + pathParts.slice(0, i + 1).join("/");
            return (
              <span key={i} className="flex items-center gap-1">
                <span className="text-muted-foreground">/</span>
                <button onClick={() => loadDirectory(partPath)} className="text-primary hover:underline">{part}</button>
              </span>
            );
          })}
        </div>
        <div className="flex gap-2">
          {showNewFolder ? (
            <div className="flex gap-1">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
                placeholder="폴더명"
                className="h-8 w-32 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={createFolder}>생성</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)}>취소</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowNewFolder(true)}>새 폴더</Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>닫기</button>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium w-24">크기</th>
              <th className="px-3 py-2 font-medium w-40">수정일</th>
              <th className="px-3 py-2 font-medium w-20 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {currentPath !== "/" && (
              <tr className="border-b hover:bg-muted/20 cursor-pointer" onClick={navigateUp}>
                <td className="px-3 py-2 flex items-center gap-2">
                  <FolderIcon />
                  <span className="text-muted-foreground">..</span>
                </td>
                <td></td><td></td><td></td>
              </tr>
            )}
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">로딩 중...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">빈 디렉토리</td></tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.name}
                  className="border-b hover:bg-muted/20 cursor-pointer"
                  onClick={() => entry.type === "directory" ? navigateTo(entry.name) : openFile(entry.name)}
                >
                  <td className="px-3 py-2 flex items-center gap-2">
                    {entry.type === "directory" ? <FolderIcon /> : <FileIcon />}
                    <span>{entry.name}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {entry.type === "file" ? formatSize(entry.size) : "-"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {entry.modifiedAt ? new Date(entry.modifiedAt).toLocaleString("ko-KR") : ""}
                  </td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs text-destructive"
                      onClick={() => deleteEntry(entry.name)}
                    >
                      삭제
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FolderIcon() {
  return (
    <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

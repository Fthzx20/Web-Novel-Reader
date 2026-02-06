"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { normalizeNodeId, type Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { Toaster, toast } from "sonner";

import { EditorKit } from "@/plate/components/editor/editor-kit";
import { SettingsDialog } from "@/plate/components/editor/settings-dialog";
import { Button } from "@/plate/components/ui/button";
import { Editor, EditorContainer } from "@/plate/components/ui/editor";

const storageKey = "malaz.newNovelWorkstation";

const defaultValue: Value = normalizeNodeId([
  {
    type: "p",
    children: [{ text: "" }],
  },
]);

export default function TextEditorPage() {
  const [value, setValue] = useState<Value>(defaultValue);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const editor = usePlateEditor({
    plugins: EditorKit,
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove("dark");
    root.style.backgroundColor = "white";
    body.style.backgroundColor = "white";
    body.style.color = "black";

    return () => {
      root.style.removeProperty("background-color");
      body.style.removeProperty("background-color");
      body.style.removeProperty("color");
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { plateValue?: Value; plateSavedAt?: string };
      if (parsed.plateValue) {
        setValue(parsed.plateValue);
      }
      if (parsed.plateSavedAt) {
        setLastSavedAt(parsed.plateSavedAt);
      }
    } catch {
      setLastSavedAt(null);
    }
  }, []);

  const handleSave = () => {
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? (JSON.parse(saved) as Record<string, unknown>) : {};
    const savedAt = new Date().toISOString();
    const payload = {
      ...parsed,
      plateValue: value,
      plateSavedAt: savedAt,
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    setLastSavedAt(savedAt);
    toast.success("Saved to workstation.");
  };

  const savedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString()
    : "Not saved yet";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-sm font-semibold">Text editor</p>
          <p className="text-xs text-muted-foreground">Last saved: {savedLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/novels/new">Back to metadata</Link>
          </Button>
          <Button onClick={handleSave}>Save to workstation</Button>
        </div>
      </div>

      <div className="flex-1">
        <Plate
          editor={editor}
          value={value}
          onChange={(nextValue: Value) => setValue(nextValue)}
        >
          <EditorContainer>
            <Editor variant="demo" />
          </EditorContainer>
          <SettingsDialog />
        </Plate>
      </div>
      <Toaster />
    </div>
  );
}

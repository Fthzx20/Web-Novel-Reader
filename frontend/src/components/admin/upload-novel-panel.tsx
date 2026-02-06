"use client";

import { useEffect, useState } from "react";
import { FileUp, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createNovelAdmin, uploadNovelCover } from "@/lib/api";

type Draft = {
  id: number;
  title: string;
  author: string;
  origin: string;
  team: string;
  status: "Draft" | "Published";
};

export function UploadNovelPanel() {
  const [form, setForm] = useState({
    title: "",
    altTitle: "",
    origin: "",
    author: "",
    team: "",
    language: "EN",
    tags: "",
    synopsis: "",
    age: "",
  });
  const [coverName, setCoverName] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const saveDraft = async (status: Draft["status"]) => {
    if (!form.title || !form.author || !form.origin || !form.team) {
      setNotice("Title, author, origin, and team are required.");
      return;
    }
    try {
      await createNovelAdmin({
        title: form.title,
        author: form.author,
        summary: form.synopsis || "No summary provided.",
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: status === "Published" ? "published" : "draft",
        coverUrl,
      });
      setDrafts((current) => [
        {
          id: Date.now(),
          title: form.title,
          author: form.author,
          origin: form.origin,
          team: form.team,
          status,
        },
        ...current,
      ]);
      setNotice("Saved to backend.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save.");
      return;
    }
    setForm({
      title: "",
      altTitle: "",
      origin: "",
      author: "",
      team: "",
      language: "EN",
      tags: "",
      synopsis: "",
      age: "",
    });
    setCoverName(null);
    setCoverPreview(null);
    setCoverUrl("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Upload novel profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice && <p className="text-sm text-amber-200">{notice}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <Input
              placeholder="Alt title"
              value={form.altTitle}
              onChange={(event) =>
                setForm((current) => ({ ...current, altTitle: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Origin (JP/CN/KR/ID)"
              value={form.origin}
              onChange={(event) =>
                setForm((current) => ({ ...current, origin: event.target.value }))
              }
            />
            <Input
              placeholder="Translation team"
              value={form.team}
              onChange={(event) =>
                setForm((current) => ({ ...current, team: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Author"
              value={form.author}
              onChange={(event) =>
                setForm((current) => ({ ...current, author: event.target.value }))
              }
            />
            <Input
              placeholder="Age rating"
              value={form.age}
              onChange={(event) =>
                setForm((current) => ({ ...current, age: event.target.value }))
              }
            />
          </div>
          <Input
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(event) =>
              setForm((current) => ({ ...current, tags: event.target.value }))
            }
          />
          <Textarea
            placeholder="Synopsis"
            value={form.synopsis}
            onChange={(event) =>
              setForm((current) => ({ ...current, synopsis: event.target.value }))
            }
          />
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => saveDraft("Draft")}> 
              <FileUp className="h-4 w-4" />
              Save draft
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => saveDraft("Published")}
            >
              <ShieldCheck className="h-4 w-4" />
              Save & publish
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-amber-200/40">
        <CardHeader>
          <CardTitle>Cover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                setCoverName(file.name);
                const url = URL.createObjectURL(file);
                setCoverPreview((current) => {
                  if (current) {
                    URL.revokeObjectURL(current);
                  }
                  return url;
                });
                try {
                  const uploadedUrl = await uploadNovelCover(file);
                  setCoverUrl(uploadedUrl);
                  setNotice("Cover uploaded.");
                } catch (err) {
                  setNotice(err instanceof Error ? err.message : "Cover upload failed.");
                }
              }}
            />
            {coverPreview ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="h-44 w-32 rounded-xl border border-border/60 bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverPreview})` }}
                />
                <span className="text-xs">{coverName}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Drop cover here
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or WEBP · Auto-synced to novel cards
                </p>
              </div>
            )}
          </label>
          <div className="rounded-lg border border-border/40 bg-card/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Cover URL</p>
            <p className="text-sm text-foreground break-all">
              {coverUrl || "Not uploaded yet."}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Recent drafts</p>
            {drafts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No drafts yet.</p>
            ) : (
              drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-foreground">{draft.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {draft.author} · {draft.origin}
                    </p>
                  </div>
                  <Badge variant={draft.status === "Published" ? "default" : "outline"}>
                    {draft.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

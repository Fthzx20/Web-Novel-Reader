"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, Minus, Plus, Send, ShieldCheck } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createNovelAdmin, uploadIllustration, uploadNovelCover } from "@/lib/api";
import { loadSession, type AuthSession } from "@/lib/auth";

type Draft = {
  id: number;
  title: string;
  author: string;
  origin: string;
  team: string;
  status: "Draft" | "Published";
};

type WorkstationDraft = {
  form: {
    title: string;
    altTitle: string;
    origin: string;
    author: string;
    team: string;
    language: string;
    tags: string;
    synopsis: string;
    age: string;
  };
  coverUrl: string;
  volumeNumber: number;
  chapterNumber: number;
  chapterTitle: string;
  illustrationUrl: string;
  illustrationNote: string;
  publishNote: string;
  plateValue?: unknown;
  plateSavedAt?: string;
  savedAt: string;
};

const storageKey = "malaz.newNovelWorkstation";

const revokeIfObjectUrl = (value: string | null) => {
  if (value && value.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
};

export default function NewNovelPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const isAdmin = session?.user.role === "admin";
  const [checked, setChecked] = useState(false);
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
  const [volumeNumber, setVolumeNumber] = useState(1);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState("");
  const [illustrationName, setIllustrationName] = useState<string | null>(null);
  const [illustrationPreview, setIllustrationPreview] = useState<string | null>(null);
  const [illustrationUrl, setIllustrationUrl] = useState("");
  const [illustrationNote, setIllustrationNote] = useState("");
  const [publishNote, setPublishNote] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [plateValue, setPlateValue] = useState<unknown>(null);
  const [plateSavedAt, setPlateSavedAt] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferNovelId, setTransferNovelId] = useState("");
  const [transferVolume, setTransferVolume] = useState(1);
  const [transferChapterNumber, setTransferChapterNumber] = useState(1);
  const [transferChapterTitle, setTransferChapterTitle] = useState("");

  const transferOptions = [
    { id: "", label: "Select a novel" },
    { id: "sample-novel", label: "Sample Novel (placeholder)" },
  ];

  useEffect(() => {
    setSession(loadSession());
    setChecked(true);
  }, []);

  useEffect(() => {
    return () => {
      revokeIfObjectUrl(coverPreview);
      revokeIfObjectUrl(illustrationPreview);
    };
  }, [coverPreview, illustrationPreview]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }
    try {
      const parsed = JSON.parse(saved) as WorkstationDraft;
      setForm(parsed.form ?? form);
      setCoverUrl(parsed.coverUrl ?? "");
      setVolumeNumber(parsed.volumeNumber ?? 1);
      setChapterNumber(parsed.chapterNumber ?? 1);
      setChapterTitle(parsed.chapterTitle ?? "");
      setIllustrationUrl(parsed.illustrationUrl ?? "");
      setIllustrationNote(parsed.illustrationNote ?? "");
      setPublishNote(parsed.publishNote ?? "");
      setPlateValue(parsed.plateValue ?? null);
      setPlateSavedAt(parsed.plateSavedAt ?? null);
      setLastSavedAt(parsed.savedAt ?? null);
    } catch {
      setLastSavedAt(null);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) {
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as WorkstationDraft;
        setPlateValue(parsed.plateValue ?? null);
        setPlateSavedAt(parsed.plateSavedAt ?? null);
      } catch {
        setPlateValue(null);
        setPlateSavedAt(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const payload: WorkstationDraft = {
        form,
        coverUrl,
        volumeNumber,
        chapterNumber,
        chapterTitle,
        illustrationUrl,
        illustrationNote,
        publishNote,
        plateValue,
        plateSavedAt: plateSavedAt ?? undefined,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastSavedAt(payload.savedAt);
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    form,
    coverUrl,
    volumeNumber,
    chapterNumber,
    chapterTitle,
    illustrationUrl,
    illustrationNote,
    publishNote,
    plateValue,
    plateSavedAt,
  ]);

  if (checked && !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please log in with an admin account to manage projects.</p>
              <Button asChild className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90">
                <a href="/auth/sign-in">Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
    }
  };

  const clearSavedProgress = () => {
    localStorage.removeItem(storageKey);
    setLastSavedAt(null);
    setPlateValue(null);
    setPlateSavedAt(null);
    setNotice("Saved workstation progress cleared.");
  };

  const handleTransfer = () => {
    if (!transferNovelId) {
      setNotice("Select a novel before transferring.");
      return;
    }
    if (!plateValue) {
      setNotice("Open the text editor and save content before transferring.");
      return;
    }
    setNotice("Transfer request queued (mock).");
    setTransferOpen(false);
  };

  const coverDisplayUrl = coverPreview || coverUrl;
  const illustrationDisplayUrl = illustrationPreview || illustrationUrl;
  const lastSavedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString()
    : "Waiting for changes...";
  const plateSavedLabel = plateSavedAt
    ? new Date(plateSavedAt).toLocaleTimeString()
    : "Not saved yet";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            Publishing workstation
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Create and publish in one space</h1>
          <p className="max-w-2xl text-muted-foreground">
            Manage metadata, cover assets, chapter text, and release settings without leaving the
            workstation.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => saveDraft("Draft")}>
              <ShieldCheck className="h-4 w-4" />
              Save draft
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
              onClick={() => saveDraft("Published")}
            >
              <FileUp className="h-4 w-4" />
              Publish series
            </Button>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setTransferOpen(true)}>
            <Send className="h-4 w-4" />
            Transfer text
          </Button>
        </div>
        {notice && <p className="mt-3 text-sm text-amber-200">{notice}</p>}

        <div className="mt-8">
          <Tabs defaultValue="metadata">
            <TabsList className="flex w-full flex-wrap justify-start gap-2">
              <TabsTrigger value="metadata">Novel metadata</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <a
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/admin/novels/new/editor"
                target="_blank"
                rel="noreferrer"
              >
                Text editor
              </a>
            </TabsList>

            <TabsContent value="metadata">
              <Card>
                <CardHeader>
                  <CardTitle>Novel metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Novel metadata</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        placeholder="Title"
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, title: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Origin ID"
                        value={form.altTitle}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, altTitle: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Origin"
                        value={form.origin}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, origin: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Author"
                        value={form.author}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, author: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Translation team"
                        value={form.team}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, team: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Language"
                        value={form.language}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, language: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Tags (comma-separated)"
                        value={form.tags}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, tags: event.target.value }))
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
                    <Textarea
                      placeholder="Synopsis"
                      value={form.synopsis}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, synopsis: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Volume and chapter picker</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setVolumeNumber((current) => Math.max(1, current - 1))}
                            aria-label="Decrease volume"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={volumeNumber}
                            onChange={(event) => setVolumeNumber(Number(event.target.value) || 1)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setVolumeNumber((current) => current + 1)}
                            aria-label="Increase volume"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Chapter</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setChapterNumber((current) => Math.max(1, current - 1))}
                            aria-label="Decrease chapter"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={chapterNumber}
                            onChange={(event) => setChapterNumber(Number(event.target.value) || 1)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setChapterNumber((current) => current + 1)}
                            aria-label="Increase chapter"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Chapter title</p>
                    <Input
                      placeholder="Chapter title"
                      value={chapterTitle}
                      onChange={(event) => setChapterTitle(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Open the text editor tab to write the chapter content.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Cover publishing</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          revokeIfObjectUrl(coverPreview);
                          const preview = URL.createObjectURL(file);
                          setCoverPreview(preview);
                          setCoverName(file.name);
                          try {
                            const uploadedUrl = await uploadNovelCover(file);
                            setCoverUrl(uploadedUrl);
                            setNotice("Cover uploaded.");
                          } catch (err) {
                            setNotice(err instanceof Error ? err.message : "Cover upload failed.");
                          }
                        }}
                      />
                      <Input
                        placeholder="Cover URL"
                        value={coverUrl}
                        onChange={(event) => setCoverUrl(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Illustrations</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          revokeIfObjectUrl(illustrationPreview);
                          const preview = URL.createObjectURL(file);
                          setIllustrationPreview(preview);
                          setIllustrationName(file.name);
                          try {
                            const uploadedUrl = await uploadIllustration(file);
                            setIllustrationUrl(uploadedUrl);
                            setNotice("Illustration uploaded.");
                          } catch (err) {
                            setNotice(err instanceof Error ? err.message : "Illustration upload failed.");
                          }
                        }}
                      />
                      <div className="flex items-center rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Upload an illustration to generate the token URL.
                      </div>
                    </div>
                    <Textarea
                      placeholder="Illustration notes"
                      value={illustrationNote}
                      onChange={(event) => setIllustrationNote(event.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Publishing notes</p>
                    <Textarea
                      placeholder="Release notes, schedule details, or internal reminders"
                      value={publishNote}
                      onChange={(event) => setPublishNote(event.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card className="border-amber-200/40">
                <CardHeader>
                  <CardTitle>Live preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p className="text-base font-semibold text-foreground">
                    {form.title || "Untitled series"}
                  </p>
                  <p>{form.author || "Unknown author"}</p>
                  <p>{form.team || "No team assigned"}</p>
                  <p>{form.origin || "Origin pending"}</p>
                  <p>{form.tags || "No tags"}</p>
                  <p>
                    Volume {volumeNumber} · Chapter {chapterNumber}
                  </p>
                  <p>{chapterTitle || "Chapter title pending"}</p>
                  {coverDisplayUrl ? (
                    <div className="flex items-center gap-3 rounded-md border border-border/60 p-2">
                      <Image
                        src={coverDisplayUrl}
                        alt="Cover preview"
                        width={64}
                        height={96}
                        className="h-24 w-16 object-cover"
                        unoptimized
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {coverName ?? "Cover preview"}
                        </p>
                        <p className="text-xs text-muted-foreground">{coverUrl || "No URL yet"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Upload a cover to preview.</p>
                  )}
                  {illustrationDisplayUrl ? (
                    <div className="flex items-center gap-3 rounded-md border border-border/60 p-2">
                      <Image
                        src={illustrationDisplayUrl}
                        alt="Illustration preview"
                        width={96}
                        height={96}
                        className="h-24 w-24 object-cover"
                        unoptimized
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {illustrationName ?? "Illustration"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {illustrationUrl || "No URL yet"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Add an illustration to preview next to the cover.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Recent drafts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {drafts.length === 0 && <p>No drafts yet.</p>}
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{draft.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {draft.author} · {draft.origin} · {draft.team}
                        </p>
                      </div>
                      <Badge variant={draft.status === "Published" ? "default" : "outline"}>
                        {draft.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-save enabled</p>
                      <p className="text-xs text-muted-foreground">Last saved: {lastSavedLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        Text editor saved: {plateSavedLabel}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearSavedProgress}>
                      Clear saved progress
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    More editor settings will appear here as we connect backend data.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {transferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg border border-border/60 bg-background p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Transfer text</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a novel and chapter target for this editor content.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setTransferOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Target novel</p>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm"
                  value={transferNovelId}
                  onChange={(event) => setTransferNovelId(event.target.value)}
                >
                  {transferOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Options will be loaded from the backend later.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <Input
                    type="number"
                    min={1}
                    value={transferVolume}
                    onChange={(event) => setTransferVolume(Number(event.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Chapter</p>
                  <Input
                    type="number"
                    min={1}
                    value={transferChapterNumber}
                    onChange={(event) => setTransferChapterNumber(Number(event.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Chapter title</p>
                <Input
                  placeholder="Chapter title"
                  value={transferChapterTitle}
                  onChange={(event) => setTransferChapterTitle(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button className="gap-2" onClick={handleTransfer}>
                <Send className="h-4 w-4" />
                Transfer chapter
              </Button>
            </div>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}

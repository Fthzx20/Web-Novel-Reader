"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, BookmarkCheck, ChevronDown, Save } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchChaptersByNovel,
  createChapterAdmin,
  fetchNovel,
  deleteChapterAdmin,
  deleteNovelAdmin,
  updateChapterAdmin,
  updateNovelAdmin,
  uploadNovelCover,
  type AdminNovel,
} from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { loadDraft, removeDraft, saveDraft as persistDraft } from "@/lib/draft-storage";
import { serializePlateToText } from "@/lib/plate-content";
import { resolveAssetUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/plate/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/plate/components/ui/dialog";
import { PlateEditor, type PlateValue } from "@/plate/components/editor/plate-editor";

type ChapterItem = {
  id: number;
  number: number;
  volume: number;
  title: string;
  content: string;
  releasedAt: string;
};

type ChapterDraft = {
  number: number;
  volume: string;
  title: string;
  value: PlateValue;
  savedAt: string;
};

export default function EditNovelPage() {
  const params = useParams();
  const router = useRouter();
  const novelId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const session = useAuthSession();
  const isAdmin = session?.user.role === "admin";
  const [novel, setNovel] = useState<AdminNovel | null>(null);
  const [status, setStatus] = useState("Ongoing");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterVolume, setChapterVolume] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterValue, setChapterValue] = useState<PlateValue>([
    { type: "p", children: [{ text: "" }] },
  ]);
  const chapterValueRef = useRef<PlateValue>(chapterValue);
  const [editorKey, setEditorKey] = useState(0);
  const [editorNotice, setEditorNotice] = useState("");
  const [editorSaving, setEditorSaving] = useState(false);
  const [draft, setDraft] = useState<ChapterDraft | null>(null);
  const [resumeDraft, setResumeDraft] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const editorInitializedRef = useRef(false);
  const statusOptions = ["Hiatus", "Completed", "Ongoing", "Axed", "Dropped"];
  const [chapters, setChapters] = useState<ChapterItem[]>(
    []
  );
  const resolvedCoverUrl = coverUrl ? resolveAssetUrl(coverUrl) : "";
  const draftKey = useMemo(
    () => (Number.isFinite(novelId) ? `admin:novel:${novelId}:draft` : ""),
    [novelId]
  );

  useEffect(() => {
    if (!isAdmin || !novelId) {
      return;
    }
    Promise.all([fetchNovel(novelId), fetchChaptersByNovel(novelId)])
      .then(([novelData, chapterData]) => {
        setNovel(novelData);
        setStatus(novelData.status || "Ongoing");
        setTitle(novelData.title || "");
        setAuthor(novelData.author || "");
        setSlug(novelData.slug || "");
        setTags((novelData.tags ?? []).join(", "));
        setSynopsis(novelData.summary || "");
        setCoverUrl(novelData.coverUrl || "");
        setChapters(
          chapterData.map((chapter) => ({
            id: chapter.id,
            number: chapter.number,
            volume: chapter.volume ?? 1,
            title: chapter.title,
            content: chapter.content,
            releasedAt: chapter.createdAt
              ? new Date(chapter.createdAt).toLocaleDateString()
              : "",
          }))
        );
      })
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : "Failed to load project.");
      });
  }, [isAdmin, novelId]);

  useEffect(() => {
    if (!draftKey || !isAdmin) {
      return;
    }
    let mounted = true;
    void loadDraft<ChapterDraft>(draftKey).then((result) => {
      if (!mounted) {
        return;
      }
      setDraft(result.value);
    });
    return () => {
      mounted = false;
    };
  }, [draftKey, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    if (!editorOpen) {
      editorInitializedRef.current = false;
      return;
    }
    if (editorInitializedRef.current) {
      return;
    }
    if (draft) {
      setChapterNumber(draft.number || 1);
      setChapterVolume(draft.volume || "");
      setChapterTitle(draft.title || "");
      chapterValueRef.current = draft.value;
      setChapterValue(draft.value);
      setEditorKey((current) => current + 1);
      setEditorNotice("");
      setResumeDraft(false);
      editorInitializedRef.current = true;
      return;
    }
    const nextNumber = chapters.length
      ? Math.max(...chapters.map((chapter) => chapter.number)) + 1
      : 1;
    setChapterNumber(nextNumber);
    setChapterVolume("");
    setChapterTitle("");
    const nextValue: PlateValue = [{ type: "p", children: [{ text: "" }] }];
    chapterValueRef.current = nextValue;
    setChapterValue(nextValue);
    setEditorKey((current) => current + 1);
    setEditorNotice("");
    setResumeDraft(false);
    editorInitializedRef.current = true;
  }, [editorOpen, chapters, draft, resumeDraft, isAdmin]);

  const saveDraft = useCallback(
    (manual: boolean) => {
      if (!draftKey) {
        return;
      }
      const payload: ChapterDraft = {
        number: chapterNumber,
        volume: chapterVolume,
        title: chapterTitle,
        value: chapterValueRef.current,
        savedAt: new Date().toISOString(),
      };
      void persistDraft(draftKey, payload)
        .then(() => {
          setDraft(payload);
          setDraftStatus(
            `${manual ? "Draft saved" : "Auto-saved"} ${new Date().toLocaleTimeString()}`
          );
        })
        .catch(() => {
          setDraftStatus("Draft too large to save locally.");
        });
    },
    [chapterNumber, chapterTitle, chapterVolume, draftKey]
  );

  useEffect(() => {
    if (!editorOpen) {
      return;
    }
    saveDraft(false);
    const handle = window.setInterval(() => saveDraft(false), 60000);
    return () => window.clearInterval(handle);
  }, [editorOpen, saveDraft]);

  const moveChapter = async (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= chapters.length) {
      return;
    }
    const previous = chapters;
    const clone = [...previous];
    const current = clone[index];
    const target = clone[nextIndex];
    clone[index] = { ...current, number: target.number };
    clone[nextIndex] = { ...target, number: current.number };
    setChapters(clone);
    try {
      await Promise.all([
        updateChapterAdmin(current.id, {
          number: clone[index].number,
          volume: current.volume,
          title: current.title,
          content: current.content,
        }),
        updateChapterAdmin(target.id, {
          number: clone[nextIndex].number,
          volume: target.volume,
          title: target.title,
          content: target.content,
        }),
      ]);
      setNotice("Chapter order updated.");
    } catch (err) {
      setChapters(previous);
      setNotice(err instanceof Error ? err.message : "Failed to update chapter order.");
    }
  };

  const handleSaveChapter = async () => {
    if (!novelId) {
      return;
    }
    const trimmedTitle = chapterTitle.trim();
    const content = serializePlateToText(chapterValueRef.current).trim();
    const rawVolume = chapterVolume.trim();
    const volumeValue = rawVolume ? Number(rawVolume) : 1;
    if (!chapterNumber || chapterNumber < 1 || !trimmedTitle || !content) {
      setEditorNotice("Chapter number, title, and content are required.");
      return;
    }
    if (Number.isNaN(volumeValue) || volumeValue < 1) {
      setEditorNotice("Volume must be 1 or greater.");
      return;
    }
    setEditorNotice("");
    setEditorSaving(true);
    try {
      const created = await createChapterAdmin(novelId, {
        number: chapterNumber,
        volume: volumeValue || 1,
        title: trimmedTitle,
        content,
      });
      setChapters((current) => [
        ...current,
        {
          id: created.id,
          number: created.number,
          volume: created.volume ?? (volumeValue || 1),
          title: created.title,
          content: created.content,
          releasedAt: created.createdAt
            ? new Date(created.createdAt).toLocaleDateString()
            : "",
        },
      ]);
      void removeDraft(draftKey);
      setDraft(null);
      setSaveModalOpen(false);
      setEditorOpen(false);
      setNotice("Chapter created.");
    } catch (err) {
      setEditorNotice(err instanceof Error ? err.message : "Failed to save chapter.");
    } finally {
      setEditorSaving(false);
    }
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Novel editor</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Loading session...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please log in with an admin account to edit projects.</p>
              <Button asChild className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90">
                <a href="/auth/sign-in">Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (editorOpen) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <div className="sticky top-0 z-40 border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Text editor
                </h1>
                <p className="text-sm text-muted-foreground">
                  Compose the chapter content and save it to the library.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {draftStatus && (
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-amber-200" />
                    {draftStatus}
                  </span>
                )}
                <Button variant="outline" onClick={() => saveDraft(true)}>
                  Save draft
                </Button>
                <Button variant="outline" onClick={() => setEditorOpen(false)}>
                  Back
                </Button>
                <Button
                  className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                  disabled={editorSaving}
                  onClick={() => setSaveModalOpen(true)}
                >
                  <Save className="h-4 w-4" />
                  Save chapter
                </Button>
              </div>
            </div>
            {editorNotice && <p className="mt-3 text-sm text-amber-200">{editorNotice}</p>}
          </div>
          <div className="min-h-0 flex-1">
            <PlateEditor
              key={editorKey}
              value={chapterValue}
              onChange={(nextValue) => {
                chapterValueRef.current = nextValue;
                setChapterValue(nextValue);
              }}
              containerClassName="overflow-visible"
              variant="demo"
            />
          </div>
          <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Chapter details</DialogTitle>
                <DialogDescription>
                  Add the chapter metadata before publishing.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Volume"
                    value={chapterVolume}
                    onChange={(event) => setChapterVolume(event.target.value)}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Chapter number"
                    value={chapterNumber}
                    onChange={(event) => setChapterNumber(Number(event.target.value))}
                  />
                </div>
                <Input
                  placeholder="Chapter title"
                  value={chapterTitle}
                  onChange={(event) => setChapterTitle(event.target.value)}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                    disabled={editorSaving}
                    onClick={handleSaveChapter}
                  >
                    <Save className="h-4 w-4" />
                    Publish chapter
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            Edit project
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Update details</h1>
          <p className="text-muted-foreground">
            Adjust metadata, reorder chapters, or archive the translation.
          </p>
        </div>
        <div className="mt-10 space-y-6">
          <Card className="border-amber-200/40">
            <CardHeader>
              <CardTitle>Project status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-6 text-sm text-muted-foreground sm:flex-row">
              <div className="space-y-3">
                <p className="text-base font-semibold text-foreground">
                  {novel?.title ?? "Loading..."}
                </p>
                <p>
                  {author || "Unknown author"} · {status}
                </p>
                <p>
                  Latest chapter:{" "}
                  {chapters.length
                    ? Math.max(...chapters.map((chapter) => chapter.number))
                    : "-"}
                </p>
              </div>
              <div className="h-40 w-28 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card/60">
                {resolvedCoverUrl ? (
                  <Image
                    src={resolvedCoverUrl}
                    alt={novel?.title ?? "Novel cover"}
                    width={112}
                    height={160}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                    No cover
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Project metadata</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setMetadataOpen((current) => !current)}
              >
                {metadataOpen ? "Hide" : "Show"} metadata
              </Button>
            </CardHeader>
            {metadataOpen && (
              <CardContent className="space-y-4">
                {notice && <p className="text-sm text-amber-200">{notice}</p>}
                <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
                <Input placeholder="Author" value={author} onChange={(event) => setAuthor(event.target.value)} />
                <Input placeholder="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    try {
                      const uploadedUrl = await uploadNovelCover(file);
                      setCoverUrl(uploadedUrl);
                      setNotice("Cover uploaded.");
                    } catch (err) {
                      setNotice(err instanceof Error ? err.message : "Cover upload failed.");
                    }
                  }}
                />
                <Input placeholder="Tags" value={tags} onChange={(event) => setTags(event.target.value)} />
                <Textarea placeholder="Synopsis" value={synopsis} onChange={(event) => setSynopsis(event.target.value)} />
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    className="w-full gap-2 sm:w-auto"
                    onClick={async () => {
                      if (!title.trim()) {
                        setNotice("Title is required.");
                        return;
                      }
                      try {
                        await updateNovelAdmin(novelId, {
                          title,
                          author,
                          summary: synopsis || "No summary provided.",
                          tags: tags
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                          status: status.toLowerCase(),
                          slug: slug.trim() || undefined,
                          coverUrl,
                        });
                        setNotice("Updated successfully.");
                      } catch (err) {
                        setNotice(err instanceof Error ? err.message : "Update failed.");
                      }
                    }}
                  >
                    <BookmarkCheck className="h-4 w-4" />
                    Update project
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 sm:w-auto">
                        Status: {status}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[180px]">
                      <DropdownMenuRadioGroup
                        value={status}
                        onValueChange={(value) => setStatus(value)}
                      >
                        {statusOptions.map((option) => (
                          <DropdownMenuRadioItem key={option} value={option}>
                            {option}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    className="w-full text-red-500 hover:text-red-600 sm:w-auto"
                    onClick={async () => {
                      if (!novelId) {
                        return;
                      }
                      const confirmed = window.confirm(
                        "Delete this project? This will remove the novel and all chapters."
                      );
                      if (!confirmed) {
                        return;
                      }
                      try {
                        await deleteNovelAdmin(novelId);
                        router.push("/admin");
                      } catch (err) {
                        setNotice(err instanceof Error ? err.message : "Delete failed.");
                      }
                    }}
                  >
                    Delete project
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Write chapter</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                Open editor
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Draft new chapters with the rich text editor.
            </CardContent>
          </Card>
        </div>
        {draft && (
          <Card className="mt-8 border-amber-200/40 bg-card/80">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Saved draft</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                  onClick={() => {
                    setResumeDraft(true);
                    setEditorOpen(true);
                  }}
                >
                  Resume draft
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void removeDraft(draftKey);
                    setDraft(null);
                  }}
                >
                  Discard
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="text-foreground">
                {draft.title ? draft.title : "Untitled draft"}
              </p>
              <p>
                Volume {draft.volume || "-"} · Chapter {draft.number || "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                Saved {new Date(draft.savedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Chapter order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Volume {chapter.volume} · Chapter {chapter.number}: {chapter.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Released {chapter.releasedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveChapter(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveChapter(index, "down")}
                    disabled={index === chapters.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600"
                    onClick={async () => {
                      const confirmed = window.confirm("Delete this chapter?");
                      if (!confirmed) {
                        return;
                      }
                      try {
                        await deleteChapterAdmin(chapter.id);
                        setChapters((current) =>
                          current.filter((entry) => entry.id !== chapter.id)
                        );
                      } catch (err) {
                        setNotice(err instanceof Error ? err.message : "Delete failed.");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

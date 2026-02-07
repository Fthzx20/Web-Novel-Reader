"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  FileUp,
  LayoutGrid,
  Minus,
  MessageSquare,
  Plus,
  Star,
  Settings,
  Gauge,
} from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { teamSpotlight } from "@/lib/sample";
import { loadSession, type AuthSession } from "@/lib/auth";
import { useSearchParams } from "next/navigation";
import {
  createChapterAdmin,
  createReleaseQueue,
  deleteNovelAdmin,
  deleteModerationReport,
  fetchNovelsAdmin,
  fetchModerationReports,
  fetchReleaseQueue,
  uploadIllustration,
  type AdminNovel,
  type ModerationReport,
  type ReleaseQueueItem,
  updateReleaseQueueStatus,
} from "@/lib/api";
import { resolveAssetUrl } from "@/lib/utils";

type QueueItem = ReleaseQueueItem;
type ReportItem = ModerationReport;

export default function AdminPage() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<AuthSession | null>(null);
  const isAdmin = session?.user.role === "admin";
  const [checked, setChecked] = useState(false);
  const sections = [
    {
      label: "Dashboard",
      icon: Gauge,
      title: "Scanlation dashboard",
      description:
        "Queue chapters, track translation notes, and keep the update feed moving without clutter.",
    },
    {
      label: "Reports",
      icon: MessageSquare,
      title: "Reports inbox",
      description: "Resolve reader notes and translation flags.",
    },
  ];

  const [activeSection, setActiveSection] = useState(() => {
    const tab = searchParams.get("tab");
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      reports: "Reports",
    };
    return tab && map[tab] ? map[tab] : "Dashboard";
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [chapterForm, setChapterForm] = useState({
    novelId: "",
    number: "",
    title: "",
    content: "",
  });
  const [volumeNumber, setVolumeNumber] = useState(1);
  const [illustrationName, setIllustrationName] = useState<string | null>(null);
  const [illustrationPreview, setIllustrationPreview] = useState<string | null>(null);
  const [illustrationUrl, setIllustrationUrl] = useState("");
  const chapterContentRef = useRef<HTMLTextAreaElement | null>(null);
  const [chapterNotice, setChapterNotice] = useState("");
  const [libraryNotice, setLibraryNotice] = useState("");
  const [queueNotice, setQueueNotice] = useState("");
  const [reportNotice, setReportNotice] = useState("");

  useEffect(() => {
    setSession(loadSession());
    setChecked(true);
  }, []);

  useEffect(() => {
    fetchNovelsAdmin()
      .then((data) => {
        setNovels(data);
      })
      .catch((err) => {
        setLibraryNotice(err instanceof Error ? err.message : "Failed to load projects.");
      });
  }, []);

  useEffect(() => {
    fetchReleaseQueue()
      .then((data) => setQueue(data))
      .catch((err) => {
        setQueueNotice(err instanceof Error ? err.message : "Failed to load release queue.");
      });
    fetchModerationReports()
      .then((data) => setReports(data))
      .catch((err) => {
        setReportNotice(err instanceof Error ? err.message : "Failed to load reports.");
      });
  }, []);

  const selectedNovelId =
    chapterForm.novelId || (novels.length ? String(novels[0].id) : "");

  const statusStyle = (status: QueueItem["status"]) => {
    if (status === "Released") {
      return "default";
    }
    if (status === "Delayed") {
      return "outline";
    }
    return "subtle";
  };

  const activeMeta = sections.find((item) => item.label === activeSection) ?? sections[0];

  const scrollToSection = (id: string) => {
    if (typeof window === "undefined") {
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const insertChapterToken = (value: string, position: "cursor" | "top" | "bottom") => {
    if (position === "top") {
      setChapterForm((current) => ({
        ...current,
        content: `${value}\n\n${current.content}`.trim(),
      }));
      return;
    }
    if (position === "bottom") {
      setChapterForm((current) => ({
        ...current,
        content: `${current.content}\n\n${value}`.trim(),
      }));
      return;
    }
    const textarea = chapterContentRef.current;
    if (!textarea) {
      setChapterForm((current) => ({
        ...current,
        content: `${current.content}${value}`,
      }));
      return;
    }
    const start = textarea.selectionStart ?? chapterForm.content.length;
    const end = textarea.selectionEnd ?? chapterForm.content.length;
    const next = `${chapterForm.content.slice(0, start)}${value}${chapterForm.content.slice(end)}`;
    setChapterForm((current) => ({ ...current, content: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + value.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

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
              <p>Please log in with an admin account to view the dashboard.</p>
              <Button asChild className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90">
                <a href="/auth/sign-in">Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[240px,1fr]">
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin menu</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {sections.map((item) => (
                  <Button
                    key={item.label}
                    variant={item.label === activeSection ? "secondary" : "ghost"}
                    className="justify-start gap-2"
                    onClick={() => setActiveSection(item.label)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card className="border-amber-200/40">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    setActiveSection("Dashboard");
                    scrollToSection("upload-chapter");
                  }}
                >
                  <FileUp className="h-4 w-4" />
                  Upload chapter
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setActiveSection("Dashboard");
                    scrollToSection("publishing-workstation");
                  }}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Upload novel
                </Button>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href="/admin/settings">
                    <Settings className="h-4 w-4" />
                    Site settings
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                >
                  <Link href="/blogger-dashboard">
                    <LayoutGrid className="h-4 w-4" />
                    Blogger dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
          <div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Badge variant="subtle" className="w-fit">
                  {activeMeta?.title}
                </Badge>
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {activeMeta?.title}
                </h1>
                <p className="max-w-2xl text-muted-foreground">
                  {activeMeta?.description}
                </p>
              </div>
            </div>
            <Separator className="my-10" />
            {activeSection === "Dashboard" && (
              <>
                <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Release queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      {queue.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {item.novelTitle} · Chapter {item.chapterNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.title} · ETA {item.eta || "Pending"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusStyle(item.status)}>
                              {item.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const updated = await updateReleaseQueueStatus(item.id, "Released");
                                  setQueue((current) =>
                                    current.map((entry) =>
                                      entry.id === item.id ? updated : entry
                                    )
                                  );
                                } catch (err) {
                                  setQueueNotice(
                                    err instanceof Error ? err.message : "Failed to update queue."
                                  );
                                }
                              }}
                            >
                              Mark released
                            </Button>
                          </div>
                        </div>
                      ))}
                      {queueNotice && (
                        <p className="text-xs text-amber-200">{queueNotice}</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Today at a glance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Chapters queued</span>
                        <span className="text-foreground">{queue.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active projects</span>
                        <span className="text-foreground">
                          {novels.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reports waiting</span>
                        <span className="text-foreground">{reports.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Separator className="my-10" />
                <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
                  <Card id="upload-chapter">
                    <CardHeader>
                      <CardTitle>Upload a chapter</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {chapterNotice && (
                        <p className="text-sm text-amber-200">{chapterNotice}</p>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Project</p>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={selectedNovelId}
                          onChange={(event) =>
                            setChapterForm((current) => ({
                              ...current,
                              novelId: event.target.value,
                            }))
                          }
                        >
                          {novels.length === 0 && (
                            <option value="">No projects found</option>
                          )}
                          {novels.map((novel) => (
                            <option key={novel.id} value={novel.id}>
                              {novel.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Volume</p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setVolumeNumber((current) => Math.max(1, current - 1))
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={volumeNumber}
                              onChange={(event) => {
                                const next = Number(event.target.value);
                                setVolumeNumber(Number.isFinite(next) && next > 0 ? next : 1);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setVolumeNumber((current) => Math.max(1, current + 1))
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Chapter</p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const next = Math.max(1, Number(chapterForm.number || "1") - 1);
                                setChapterForm((current) => ({
                                  ...current,
                                  number: String(next),
                                }));
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Chapter number"
                              value={chapterForm.number}
                              onChange={(event) =>
                                setChapterForm((current) => ({
                                  ...current,
                                  number: event.target.value,
                                }))
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const next = Math.max(1, Number(chapterForm.number || "0") + 1);
                                setChapterForm((current) => ({
                                  ...current,
                                  number: String(next),
                                }));
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Title</p>
                          <Input
                            placeholder="Chapter title"
                            value={chapterForm.title}
                            onChange={(event) =>
                              setChapterForm((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <Textarea
                        ref={chapterContentRef}
                        placeholder="Chapter content"
                        value={chapterForm.content}
                        onChange={(event) =>
                          setChapterForm((current) => ({
                            ...current,
                            content: event.target.value,
                          }))
                        }
                      />
                      <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">Insert illustrations</p>
                            <p className="text-xs text-muted-foreground">
                              Upload an image and place the token in your chapter text.
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Volume {volumeNumber}, Chapter {chapterForm.number || "-"}
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr,auto]">
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) {
                                  return;
                                }
                                setIllustrationName(file.name);
                                setIllustrationPreview(null);
                                setChapterNotice("");
                                try {
                                  const uploaded = await uploadIllustration(file);
                                  setIllustrationUrl(uploaded.url);
                                  setIllustrationPreview(uploaded.url);
                                } catch (err) {
                                  setChapterNotice(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to upload illustration."
                                  );
                                }
                              }}
                            />
                            {illustrationName && (
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {illustrationName}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!illustrationUrl}
                              onClick={() =>
                                insertChapterToken(`[[img:${illustrationUrl}]]`, "cursor")
                              }
                            >
                              Insert at cursor
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!illustrationUrl}
                              onClick={() =>
                                insertChapterToken(`[[img:${illustrationUrl}]]`, "top")
                              }
                            >
                              Insert at top
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!illustrationUrl}
                              onClick={() =>
                                insertChapterToken(`[[img:${illustrationUrl}]]`, "bottom")
                              }
                            >
                              Insert at bottom
                            </Button>
                          </div>
                        </div>
                        {illustrationPreview && (
                          <div className="overflow-hidden rounded-lg border border-border/50 bg-background">
                            <Image
                              src={resolveAssetUrl(illustrationPreview)}
                              alt="Illustration preview"
                              width={720}
                              height={360}
                              className="h-auto w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={async () => {
                          const novelId = Number(selectedNovelId);
                          const chapterNumber = Number(chapterForm.number);
                          if (!novelId || !chapterNumber || !chapterForm.title.trim() || !chapterForm.content.trim()) {
                            setChapterNotice("Project, number, title, and content are required.");
                            return;
                          }
                          try {
                            await createChapterAdmin(novelId, {
                              number: chapterNumber,
                              title: chapterForm.title.trim(),
                              content: chapterForm.content.trim(),
                            });
                            const created = await createReleaseQueue({
                              novelId,
                              chapterNumber,
                              title: chapterForm.title.trim(),
                              status: "Queued",
                              eta: "Pending",
                            });
                            setQueue((current) => [created, ...current]);
                            setChapterNotice("Chapter uploaded.");
                            setChapterForm((current) => ({
                              ...current,
                              number: "",
                              title: "",
                              content: "",
                            }));
                          } catch (err) {
                            setChapterNotice(
                              err instanceof Error ? err.message : "Failed to upload chapter."
                            );
                          }
                        }}
                      >
                        Add to queue
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Moderation queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      {reportNotice && (
                        <p className="text-xs text-amber-200">{reportNotice}</p>
                      )}
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between gap-4 rounded-lg border border-border/40 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {report.novelTitle || "General"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.note} · {new Date(report.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await deleteModerationReport(report.id);
                                setReports((current) =>
                                  current.filter((entry) => entry.id !== report.id)
                                );
                              } catch (err) {
                                setReportNotice(
                                  err instanceof Error ? err.message : "Failed to resolve report."
                                );
                              }
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <Separator className="my-10" />
                <div className="space-y-6" id="publishing-workstation">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Publishing workstation
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Upload a draft or publish a new project without leaving the dashboard.
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/admin/novels/new">Open full workstation</Link>
                    </Button>
                  </div>
                  <Card className="border-dashed border-border/60">
                    <CardContent className="flex flex-col gap-3 py-6 text-sm text-muted-foreground">
                      <p className="text-foreground">Profile and cover uploads live in the full workstation.</p>
                      <Button className="w-fit" asChild>
                        <Link href="/admin/novels/new">Open full workstation</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <Separator className="my-10" />
                <div className="grid gap-6 md:grid-cols-3">
                  {["Reads", "Ratings", "Comments"].map((label, index) => {
                    const Icon = [BookOpenText, Star, MessageSquare][index];
                    return (
                      <Card key={label}>
                        <CardHeader>
                          <CardTitle>{label}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{["210k", "4.5", "5.3k"][index]}</span>
                          <Icon className="h-4 w-4 text-amber-200" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <Separator className="my-10" />
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Project library
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Manage updates and open a project editor.
                        </p>
                        {libraryNotice && (
                          <p className="text-xs text-amber-200">{libraryNotice}</p>
                        )}
                      </div>
                      <Button variant="outline" asChild>
                        <Link href="/admin/novels/new">Create new project</Link>
                      </Button>
                    </div>
                  </div>
                  {novels.map((novel) => (
                    <Card key={novel.id}>
                      <CardHeader>
                        <CardTitle>{novel.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-4">
                          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-card/60">
                            {novel.coverUrl ? (
                              <Image
                                src={resolveAssetUrl(novel.coverUrl)}
                                alt={novel.title}
                                width={56}
                                height={80}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                                {novel.title.charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="flex-1">{novel.summary ?? ""}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {novel.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{novel.author}</span>
                          <span>
                            {novel.updatedAt
                              ? new Date(novel.updatedAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" asChild>
                            <Link href={`/admin/novels/${novel.id}/edit`}>Edit project</Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={async () => {
                              const confirmed = window.confirm(
                                "Delete this project? This will remove the novel and all chapters."
                              );
                              if (!confirmed) {
                                return;
                              }
                              try {
                                await deleteNovelAdmin(novel.id);
                                setNovels((current) =>
                                  current.filter((entry) => entry.id !== novel.id)
                                );
                              } catch (err) {
                                setLibraryNotice(
                                  err instanceof Error ? err.message : "Delete failed."
                                );
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator className="my-10" />
                  <Card>
                  <CardHeader>
                    <CardTitle>Team spotlight</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    {teamSpotlight.map((team) => (
                      <div
                        key={team.name}
                        className="rounded-lg border border-border/40 p-4 text-sm text-muted-foreground"
                      >
                        <p className="text-base font-medium text-foreground">
                          {team.name}
                        </p>
                        <p>{team.focus}</p>
                        <p>
                          {team.language} · {team.active} active series
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSection === "Reports" && (
              <Card>
                <CardHeader>
                  <CardTitle>Moderation queue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {report.novelTitle || "General"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.note} · {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await deleteModerationReport(report.id);
                            setReports((current) =>
                              current.filter((entry) => entry.id !== report.id)
                            );
                          } catch (err) {
                            setReportNotice(
                              err instanceof Error ? err.message : "Failed to resolve report."
                            );
                          }
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {activeSection === "Settings" && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Release defaults</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Auto publish after upload</span>
                      <Badge variant="outline">Off</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Notify followers</span>
                      <Badge variant="outline">On</Badge>
                    </div>
                    <Button variant="secondary" className="w-full">
                      Save settings
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Roles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Translator</span>
                      <Badge variant="subtle">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Editor</span>
                      <Badge variant="subtle">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Proofreader</span>
                      <Badge variant="subtle">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

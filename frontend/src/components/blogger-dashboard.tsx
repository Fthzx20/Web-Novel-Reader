"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Pencil,
  Plus,
  ChevronDown,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteNav } from "@/components/site/site-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/plate/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/plate/components/ui/dropdown-menu";
import {
  createNovelAdmin,
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  deleteNovelAdmin,
  fetchNovelsAdmin,
  fetchNovelStats,
  fetchSiteSettings,
  fetchUsers,
  updateAnnouncement,
  uploadNovelCover,
  type AdminNovel,
} from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { resolveAssetUrl } from "@/lib/utils";

const coverTones = [
  "from-rose-500/40 to-amber-200/30",
  "from-sky-400/40 to-indigo-200/30",
  "from-emerald-400/40 to-lime-200/30",
  "from-orange-400/40 to-yellow-200/30",
  "from-fuchsia-400/40 to-purple-200/30",
];

export function BloggerDashboard() {
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<number, number>>({});
  const [notice, setNotice] = useState("");
  const session = useAuthSession();
  const isAdmin = session?.user.role === "admin";
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newStatus, setNewStatus] = useState("Ongoing");
  const [newPostNotice, setNewPostNotice] = useState("");
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [usersCount, setUsersCount] = useState(0);
  const [announcements, setAnnouncements] = useState<
    Array<{ id: number; title: string; body: string }>
  >([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
  });
  const statusOptions = ["Hiatus", "Completed", "Ongoing", "Axed", "Dropped"];

  const getDashboardData = async () => {
    return Promise.all([fetchNovelsAdmin(), fetchNovelStats()]);
  };

  const applyDashboardData = (
    data: AdminNovel[],
    stats: Awaited<ReturnType<typeof fetchNovelStats>>
  ) => {
    setNovels(data);

    const counts: Record<number, number> = {};
    stats.forEach((stat) => {
      counts[stat.novelId] = stat.chapterCount;
    });
    setChapterCounts(counts);
  };

  const loadDashboardData = async () => {
    setNotice("");
    try {
      const [data, stats] = await getDashboardData();
      applyDashboardData(data, stats);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to load dashboard.");
    }
  };

  useEffect(() => {
    getDashboardData()
      .then(([data, stats]) => applyDashboardData(data, stats))
      .catch((err) =>
        setNotice(err instanceof Error ? err.message : "Failed to load dashboard.")
      );
    fetchSiteSettings()
      .then((settings) => setSiteLogoUrl(settings.logoUrl || ""))
      .catch(() => null);
    fetchUsers()
      .then((users) => setUsersCount(users.length))
      .catch(() => null);
    fetchAnnouncements()
      .then((data) =>
        setAnnouncements(data.map((item) => ({ id: item.id, title: item.title, body: item.body })))
      )
      .catch(() => null);
  }, []);

  const sortedNovels = useMemo(() => {
    return [...novels].sort((a, b) => {
      const aTime = Date.parse(a.updatedAt);
      const bTime = Date.parse(b.updatedAt);
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
  }, [novels]);

  const recentNovels = useMemo(() => sortedNovels.slice(0, 3), [sortedNovels]);
  const libraryPreview = useMemo(() => sortedNovels.slice(0, 3), [sortedNovels]);

  const totalChapters = useMemo(() => {
    return Object.values(chapterCounts).reduce((sum, count) => sum + count, 0);
  }, [chapterCounts]);

  const statusCounts = useMemo(() => {
    const counts = {
      ongoing: 0,
      completed: 0,
      hiatus: 0,
      axed: 0,
      dropped: 0,
    };
    novels.forEach((novel) => {
      const key = novel.status?.toLowerCase() ?? "";
      if (key in counts) {
        counts[key as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [novels]);

  const handleCreateNovel = async () => {
    if (!isAdmin) {
      setNewPostNotice("Admin access required.");
      return;
    }
    const trimmedTitle = newTitle.trim();
    const trimmedAuthor = newAuthor.trim();
    const trimmedSummary = newSummary.trim();
    if (!trimmedTitle || !trimmedAuthor || !trimmedSummary) {
      setNewPostNotice("Title, author, and synopsis are required.");
      return;
    }
    setNewPostNotice("");
    try {
      let coverUrl = "";
      if (newCoverFile) {
        coverUrl = await uploadNovelCover(newCoverFile);
      }
      const tagList = newTags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (newLanguage.trim()) {
        tagList.push(`Language: ${newLanguage.trim()}`);
      }
      await createNovelAdmin({
        title: trimmedTitle,
        author: trimmedAuthor,
        summary: trimmedSummary,
        tags: tagList,
        status: newStatus,
        coverUrl: coverUrl || undefined,
      });
      setNewTitle("");
      setNewAuthor("");
      setNewLanguage("");
      setNewTags("");
      setNewSummary("");
      setNewCoverFile(null);
      setNewStatus("Ongoing");
      setNewPostOpen(false);
      await loadDashboardData();
    } catch (err) {
      setNewPostNotice(err instanceof Error ? err.message : "Failed to create novel.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_10%,rgba(251,191,36,0.18),transparent_45%),radial-gradient(800px_circle_at_85%_0%,rgba(56,189,248,0.16),transparent_40%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:py-14">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-amber-200 text-zinc-900">
                {siteLogoUrl ? (
                  <Image
                    src={resolveAssetUrl(siteLogoUrl)}
                    alt="Malaz Studio"
                    width={44}
                    height={44}
                    className="h-full w-full rounded-2xl object-cover"
                    unoptimized
                  />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Malaz Studio
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Admin Dashboard
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/updates">
                  <Bell className="h-4 w-4" />
                  Alerts
                </Link>
              </Button>
              <Button
                className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                onClick={() => setNewPostOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                New post
              </Button>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
            <aside className="space-y-4">
              <Card className="border-border/60 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm">Workspace</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <Link href="/blogger-dashboard" className="flex items-center gap-2 text-foreground">
                    <LayoutDashboard className="h-4 w-4 text-amber-200" />
                    Dashboard
                  </Link>
                  <Link href="/blogger-dashboard/moderation" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Account moderation
                  </Link>
                  <Link href="/blogger-dashboard/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Website settings
                  </Link>
                </CardContent>
              </Card>
              <Card className="border-amber-200/40 bg-amber-200/10">
                <CardHeader>
                  <CardTitle className="text-sm">Quick links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Link href="/library" className="block text-amber-200 hover:text-amber-100">
                    View public library
                  </Link>
                  <Link href="/updates" className="block text-amber-200 hover:text-amber-100">
                    Latest updates
                  </Link>
                  <Link href="/account/history" className="block text-amber-200 hover:text-amber-100">
                    Reading history
                  </Link>
                </CardContent>
              </Card>
            </aside>

            <main className="space-y-6">
              {notice && <p className="text-sm text-amber-200">{notice}</p>}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total series", value: novels.length },
                  { label: "Ongoing", value: statusCounts.ongoing },
                  { label: "Completed", value: statusCounts.completed },
                  { label: "Chapters", value: totalChapters },
                ].map((item) => (
                  <Card key={item.label} className="border-border/60 bg-card/80">
                    <CardContent className="space-y-2 pt-6">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {item.label}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">{item.value}</p>
                        <Badge variant="subtle">Live</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
                <Card className="border-border/60 bg-card/80">
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Recent projects</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Latest edits from your novel library.
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2" asChild>
                      <Link href="/blogger-dashboard/library">
                        <BarChart3 className="h-4 w-4" />
                        View library
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentNovels.map((novel) => (
                      <div
                        key={novel.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{novel.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated {novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{novel.status}</Badge>
                          <span className="text-muted-foreground">
                            {chapterCounts[novel.id] ?? 0} chapters
                          </span>
                        </div>
                      </div>
                    ))}
                    {!recentNovels.length && (
                      <p className="text-sm text-muted-foreground">No projects yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-amber-200/30 bg-amber-200/10">
                  <CardHeader>
                    <CardTitle>Growth pulse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <TrendingUp className="h-4 w-4 text-amber-200" />
                      {novels.length} active series
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Users className="h-4 w-4 text-amber-200" />
                      {usersCount} registered users
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Ongoing</span>
                        <span className="text-foreground">{statusCounts.ongoing}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border/60">
                        <div
                          className="h-2 rounded-full bg-amber-200"
                          style={{ width: novels.length ? `${(statusCounts.ongoing / novels.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Completed</span>
                        <span className="text-foreground">{statusCounts.completed}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border/60">
                        <div
                          className="h-2 rounded-full bg-sky-300"
                          style={{ width: novels.length ? `${(statusCounts.completed / novels.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Hiatus</span>
                        <span className="text-foreground">{statusCounts.hiatus}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border/60">
                        <div
                          className="h-2 rounded-full bg-emerald-300"
                          style={{ width: novels.length ? `${(statusCounts.hiatus / novels.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60 bg-card/80">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Novel library</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Curate your translation projects and publishing flow.
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2" asChild>
                    <Link href="/blogger-dashboard/library">
                      <FileText className="h-4 w-4" />
                      Manage library
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {libraryPreview.map((novel, index) => {
                    const coverUrl = novel.coverUrl ? resolveAssetUrl(novel.coverUrl) : "";
                    const fallbackLabel = novel.title
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part.charAt(0).toUpperCase())
                      .join("");
                    return (
                      <div
                        key={novel.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-16 w-12 items-center justify-center rounded-lg border border-border/50 bg-gradient-to-br ${coverTones[index % coverTones.length]}`}
                          >
                            {coverUrl ? (
                              <Image
                                src={coverUrl}
                                alt={novel.title}
                                width={48}
                                height={64}
                                className="h-full w-full rounded-lg object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-xs font-semibold text-foreground">
                                {fallbackLabel || "NV"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{novel.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Updated {novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline">{novel.status}</Badge>
                          <span className="text-muted-foreground">
                            {chapterCounts[novel.id] ?? 0} chapters
                          </span>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                            <Link href={`/admin/novels/${novel.id}/edit`}>Edit</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-500 hover:text-red-600 sm:w-auto"
                            disabled={!isAdmin}
                            onClick={async () => {
                              if (!isAdmin) {
                                setNotice("Admin access required.");
                                return;
                              }
                              const confirmed = window.confirm(
                                "Delete this novel? This will remove the novel and all chapters."
                              );
                              if (!confirmed) {
                                return;
                              }
                              try {
                                await deleteNovelAdmin(novel.id);
                                await loadDashboardData();
                              } catch (err) {
                                setNotice(
                                  err instanceof Error ? err.message : "Delete failed."
                                );
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {!libraryPreview.length && (
                    <p className="text-sm text-muted-foreground">No novels yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/80">
                <CardHeader>
                  <CardTitle>Announcements</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Publish updates that appear on the public updates page.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Announcement title"
                      value={announcementForm.title}
                      onChange={(event) =>
                        setAnnouncementForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                    <Textarea
                      placeholder="Announcement details"
                      value={announcementForm.body}
                      onChange={(event) =>
                        setAnnouncementForm((current) => ({
                          ...current,
                          body: event.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
                          setNotice("Announcement title and body are required.");
                          return;
                        }
                        try {
                          const created = await createAnnouncement(announcementForm);
                          setAnnouncements((current) => [created, ...current]);
                          setAnnouncementForm({ title: "", body: "" });
                          setNotice("Announcement published.");
                        } catch (err) {
                          setNotice(
                            err instanceof Error
                              ? err.message
                              : "Failed to publish announcement."
                          );
                        }
                      }}
                    >
                      Publish announcement
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {announcements.length === 0 && (
                      <p className="text-sm text-muted-foreground">No announcements yet.</p>
                    )}
                    {announcements.map((item) => (
                      <Card key={item.id} className="border-border/60">
                        <CardContent className="space-y-2 py-4 text-sm text-muted-foreground">
                          <Input
                            value={item.title}
                            onChange={(event) =>
                              setAnnouncements((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, title: event.target.value }
                                    : entry
                                )
                              )
                            }
                          />
                          <Textarea
                            value={item.body}
                            onChange={(event) =>
                              setAnnouncements((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, body: event.target.value }
                                    : entry
                                )
                              )
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const updated = await updateAnnouncement(item.id, {
                                    title: item.title,
                                    body: item.body,
                                  });
                                  setAnnouncements((current) =>
                                    current.map((entry) =>
                                      entry.id === item.id ? updated : entry
                                    )
                                  );
                                  setNotice("Announcement updated.");
                                } catch (err) {
                                  setNotice(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to update announcement."
                                  );
                                }
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await deleteAnnouncement(item.id);
                                  setAnnouncements((current) =>
                                    current.filter((entry) => entry.id !== item.id)
                                  );
                                } catch (err) {
                                  setNotice(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to delete announcement."
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
                </CardContent>
              </Card>

              
            </main>
          </div>
        </div>
      </div>

      <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create new novel</DialogTitle>
            <DialogDescription>
              Draft a new series entry. It will appear in the library for chapter writing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Novel title"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <Input
              placeholder="Author"
              value={newAuthor}
              onChange={(event) => setNewAuthor(event.target.value)}
            />
            <Input
              placeholder="Language"
              value={newLanguage}
              onChange={(event) => setNewLanguage(event.target.value)}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={newTags}
              onChange={(event) => setNewTags(event.target.value)}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setNewCoverFile(file);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Status: {newStatus}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                <DropdownMenuRadioGroup
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value)}
                >
                  {statusOptions.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>
                      {option}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Textarea
            placeholder="Synopsis"
            value={newSummary}
            onChange={(event) => setNewSummary(event.target.value)}
            rows={4}
          />
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span>Author: {newAuthor || "-"}</span>
            <span>Language: {newLanguage || "-"}</span>
            <span>Tags: {newTags || "-"}</span>
          </div>
          {newPostNotice && <p className="text-sm text-amber-200">{newPostNotice}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewPostOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
              onClick={handleCreateNovel}
            >
              <Plus className="h-4 w-4" />
              Create novel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

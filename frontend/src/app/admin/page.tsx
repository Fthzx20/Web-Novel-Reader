"use client";

import { useEffect, useState } from "react";
import {
  BookOpenText,
  FileUp,
  LayoutGrid,
  MessageSquare,
  Star,
  Users,
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
import { teamSpotlight, translationNovels } from "@/lib/sample";
import { loadSession } from "@/lib/auth";
import { UploadNovelPanel } from "@/components/admin/upload-novel-panel";
import { useSearchParams } from "next/navigation";

type QueueItem = {
  id: number;
  novel: string;
  chapter: string;
  title: string;
  status: "Queued" | "Released" | "Delayed";
  eta: string;
};

type ReportItem = {
  id: number;
  novel: string;
  note: string;
  time: string;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const searchParams = useSearchParams();
  const sections = [
    {
      label: "Dashboard",
      icon: Gauge,
      title: "Scanlation dashboard",
      description:
        "Queue chapters, track translation notes, and keep the update feed moving without clutter.",
    },
    {
      label: "Upload",
      icon: FileUp,
      title: "Uploader workspace",
      description: "Add a series profile, cover, and publish status in one flow.",
    },
    {
      label: "Projects",
      icon: LayoutGrid,
      title: "Project library",
      description: "Track the status of every series you manage.",
    },
    {
      label: "Reports",
      icon: MessageSquare,
      title: "Reports inbox",
      description: "Resolve reader notes and translation flags.",
    },
    {
      label: "Settings",
      icon: Settings,
      title: "Workspace settings",
      description: "Control defaults for releases and roles.",
    },
  ];

  const [activeSection, setActiveSection] = useState("Dashboard");
  const [queue, setQueue] = useState<QueueItem[]>([
    {
      id: 1,
      novel: "Ashen Crown",
      chapter: "65",
      title: "The Quiet Annex",
      status: "Queued",
      eta: "Tonight",
    },
    {
      id: 2,
      novel: "Neon Embassy",
      chapter: "44",
      title: "Static Echo",
      status: "Delayed",
      eta: "Tomorrow",
    },
  ]);
  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: 11,
      novel: "Winter Script",
      note: "Possible terminology mismatch in Chapter 90.",
      time: "2h ago",
    },
    {
      id: 12,
      novel: "Caravan of Mirrors",
      note: "Reader asked for glossary update.",
      time: "5h ago",
    },
  ]);
  const [form, setForm] = useState({
    novel: "",
    chapter: "",
    title: "",
    notes: "",
  });

  useEffect(() => {
    const session = loadSession();
    setIsAdmin(session?.user.role === "admin");
    setChecked(true);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      upload: "Upload",
      projects: "Projects",
      reports: "Reports",
      settings: "Settings",
    };
    if (tab && map[tab]) {
      setActiveSection(map[tab]);
    }
  }, [searchParams]);

  const statusStyle = (status: QueueItem["status"]) => {
    if (status === "Released") {
      return "default";
    }
    if (status === "Delayed") {
      return "outline";
    }
    return "subtle";
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
                <Button className="w-full gap-2">
                  <FileUp className="h-4 w-4" />
                  Upload chapter
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => setActiveSection("Upload")}>
                  <LayoutGrid className="h-4 w-4" />
                  Upload novel
                </Button>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href="/admin/settings">
                    <Settings className="h-4 w-4" />
                    Site settings
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
          <div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Badge variant="subtle" className="w-fit">
                  {sections.find((item) => item.label === activeSection)?.title}
                </Badge>
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {sections.find((item) => item.label === activeSection)?.title}
                </h1>
                <p className="max-w-2xl text-muted-foreground">
                  {sections.find((item) => item.label === activeSection)?.description}
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
                              {item.novel} · Chapter {item.chapter}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.title} · ETA {item.eta}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusStyle(item.status)}>
                              {item.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setQueue((current) =>
                                  current.map((entry) =>
                                    entry.id === item.id
                                      ? { ...entry, status: "Released" }
                                      : entry
                                  )
                                )
                              }
                            >
                              Mark released
                            </Button>
                          </div>
                        </div>
                      ))}
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
                          {translationNovels.length}
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload a chapter</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Novel title"
                        value={form.novel}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            novel: event.target.value,
                          }))
                        }
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          placeholder="Chapter number"
                          value={form.chapter}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              chapter: event.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Chapter title"
                          value={form.title}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <Textarea
                        placeholder="Translator notes"
                        value={form.notes}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                      />
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (!form.novel || !form.chapter || !form.title) {
                            return;
                          }
                          setQueue((current) => [
                            {
                              id: Date.now(),
                              novel: form.novel,
                              chapter: form.chapter,
                              title: form.title,
                              status: "Queued",
                              eta: "Pending",
                            },
                            ...current,
                          ]);
                          setForm({
                            novel: "",
                            chapter: "",
                            title: "",
                            notes: "",
                          });
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
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between gap-4 rounded-lg border border-border/40 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {report.novel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.note} · {report.time}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setReports((current) =>
                                current.filter((entry) => entry.id !== report.id)
                              )
                            }
                          >
                            Resolve
                          </Button>
                        </div>
                      ))}
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
                  {translationNovels.map((novel) => (
                    <Card key={novel.id}>
                      <CardHeader>
                        <CardTitle>{novel.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>{novel.synopsis}</p>
                        <div className="flex flex-wrap gap-2">
                          {novel.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{novel.team}</span>
                          <span>{novel.updatedAt}</span>
                        </div>
                        <Button variant="secondary">Edit project</Button>
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
            {activeSection === "Upload" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
                  Inkstone-style uploader: add title, metadata, and a cover in one pass.
                </div>
                <UploadNovelPanel />
              </div>
            )}
            {activeSection === "Releases" && (
              <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
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
                            {item.novel} · Chapter {item.chapter}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.title} · ETA {item.eta}
                          </p>
                        </div>
                        <Badge variant={statusStyle(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Upload a chapter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Novel title"
                      value={form.novel}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          novel: event.target.value,
                        }))
                      }
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        placeholder="Chapter number"
                        value={form.chapter}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            chapter: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Chapter title"
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <Textarea
                      placeholder="Translator notes"
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!form.novel || !form.chapter || !form.title) {
                          return;
                        }
                        setQueue((current) => [
                          {
                            id: Date.now(),
                            novel: form.novel,
                            chapter: form.chapter,
                            title: form.title,
                            status: "Queued",
                            eta: "Pending",
                          },
                          ...current,
                        ]);
                        setForm({
                          novel: "",
                          chapter: "",
                          title: "",
                          notes: "",
                        });
                      }}
                    >
                      Add to queue
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeSection === "Projects" && (
              <div className="grid gap-6 md:grid-cols-2">
                {translationNovels.map((novel) => (
                  <Card key={novel.id}>
                    <CardHeader>
                      <CardTitle>{novel.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>{novel.synopsis}</p>
                      <div className="flex flex-wrap gap-2">
                        {novel.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{novel.team}</span>
                        <span>{novel.updatedAt}</span>
                      </div>
                      <Button variant="secondary">Edit project</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {activeSection === "Teams" && (
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
                          {report.novel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.note} · {report.time}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setReports((current) =>
                            current.filter((entry) => entry.id !== report.id)
                          )
                        }
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

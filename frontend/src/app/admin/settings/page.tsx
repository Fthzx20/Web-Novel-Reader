"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchSiteSettings,
  uploadLogo,
  updateAnnouncement,
  updateSiteSettings,
} from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { resolveAssetUrl } from "@/lib/utils";

export default function AdminSettingsPage() {
  const session = useAuthSession();
  const isAdmin = session?.user.role === "admin";
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState({
    title: "Malaz Translation",
    tagline: "",
    logoUrl: "favicon.ico",
    logoAlt: "",
    headline: "",
    heroDescription: "",
    primaryButton: "",
    secondaryButton: "",
    accentColor: "",
    highlightLabel: "",
    facebookUrl: "",
    discordUrl: "",
    footerUpdatesLabel: "Updates",
    footerUpdatesUrl: "/updates",
    footerSeriesLabel: "Series",
    footerSeriesUrl: "/library",
    footerAdminLabel: "Admin",
    footerAdminUrl: "/admin",
    footerLink4Label: "",
    footerLink4Url: "",
    footerLink5Label: "",
    footerLink5Url: "",
  });
  const [announcements, setAnnouncements] = useState<
    Array<{ id: number; title: string; body: string }>
  >([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
  });

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchSiteSettings()
      .then((data) =>
        setSettings({
          title: data.title,
          tagline: data.tagline,
          logoUrl: data.logoUrl,
          logoAlt: data.logoAlt,
          headline: data.headline,
          heroDescription: data.heroDescription,
          primaryButton: data.primaryButton,
          secondaryButton: data.secondaryButton,
          accentColor: data.accentColor,
          highlightLabel: data.highlightLabel,
          facebookUrl: data.facebookUrl,
          discordUrl: data.discordUrl,
          footerUpdatesLabel: data.footerUpdatesLabel,
          footerUpdatesUrl: data.footerUpdatesUrl,
          footerSeriesLabel: data.footerSeriesLabel,
          footerSeriesUrl: data.footerSeriesUrl,
          footerAdminLabel: data.footerAdminLabel,
          footerAdminUrl: data.footerAdminUrl,
          footerLink4Label: data.footerLink4Label,
          footerLink4Url: data.footerLink4Url,
          footerLink5Label: data.footerLink5Label,
          footerLink5Url: data.footerLink5Url,
        })
      )
      .catch(() => setNotice("Unable to load settings."));
    fetchAnnouncements()
      .then((data) => setAnnouncements(data.map((item) => ({ id: item.id, title: item.title, body: item.body }))))
      .catch(() => null);
  }, [isAdmin]);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Admin settings</CardTitle>
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
              <p>Please log in with an admin account to manage site settings.</p>
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
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            Site settings
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Branding control</h1>
          <p className="max-w-2xl text-muted-foreground">
            Update the title, logo, and announcements without touching code.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notice && <p className="text-sm text-amber-200">{notice}</p>}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Logo upload</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    try {
                      const url = await uploadLogo(file);
                      setSettings((current) => ({ ...current, logoUrl: url }));
                      setNotice("Logo uploaded.");
                    } catch (err) {
                      setNotice(err instanceof Error ? err.message : "Logo upload failed.");
                    }
                  }}
                />
                {settings.logoUrl && (
                  <div className="flex items-center gap-3 rounded-md border border-border/60 p-2">
                    <Image
                      src={resolveAssetUrl(settings.logoUrl)}
                      alt="Logo preview"
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                      unoptimized
                    />
                    <span className="text-xs text-muted-foreground">{settings.logoUrl}</span>
                  </div>
                )}
              </div>
              <Input
                placeholder="Site title"
                value={settings.title}
                onChange={(event) => setSettings((current) => ({ ...current, title: event.target.value }))}
              />
              <Input
                placeholder="Tagline"
                value={settings.tagline}
                onChange={(event) => setSettings((current) => ({ ...current, tagline: event.target.value }))}
              />
              <Input
                placeholder="Logo URL"
                value={settings.logoUrl}
                onChange={(event) => setSettings((current) => ({ ...current, logoUrl: event.target.value }))}
              />
              <Button
                className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                onClick={async () => {
                  try {
                    const updated = await updateSiteSettings(settings);
                    setSettings({
                      title: updated.title,
                      tagline: updated.tagline,
                      logoUrl: updated.logoUrl,
                      logoAlt: updated.logoAlt,
                      headline: updated.headline,
                      heroDescription: updated.heroDescription,
                      primaryButton: updated.primaryButton,
                      secondaryButton: updated.secondaryButton,
                      accentColor: updated.accentColor,
                      highlightLabel: updated.highlightLabel,
                      facebookUrl: updated.facebookUrl,
                      discordUrl: updated.discordUrl,
                      footerUpdatesLabel: updated.footerUpdatesLabel,
                      footerUpdatesUrl: updated.footerUpdatesUrl,
                      footerSeriesLabel: updated.footerSeriesLabel,
                      footerSeriesUrl: updated.footerSeriesUrl,
                      footerAdminLabel: updated.footerAdminLabel,
                      footerAdminUrl: updated.footerAdminUrl,
                      footerLink4Label: updated.footerLink4Label,
                      footerLink4Url: updated.footerLink4Url,
                      footerLink5Label: updated.footerLink5Label,
                      footerLink5Url: updated.footerLink5Url,
                    });
                    setNotice("Settings saved.");
                  } catch (err) {
                    setNotice(err instanceof Error ? err.message : "Failed to save settings.");
                  }
                }}
              >
                Save settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Announcement title"
                  value={announcementForm.title}
                  onChange={(event) =>
                    setAnnouncementForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <Textarea
                  placeholder="Announcement details"
                  value={announcementForm.body}
                  onChange={(event) =>
                    setAnnouncementForm((current) => ({ ...current, body: event.target.value }))
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
                      setNotice(err instanceof Error ? err.message : "Failed to publish announcement.");
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
                                current.map((entry) => (entry.id === item.id ? updated : entry))
                              );
                              setNotice("Announcement updated.");
                            } catch (err) {
                              setNotice(err instanceof Error ? err.message : "Failed to update announcement.");
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
                              setAnnouncements((current) => current.filter((entry) => entry.id !== item.id));
                            } catch (err) {
                              setNotice(err instanceof Error ? err.message : "Failed to delete announcement.");
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
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

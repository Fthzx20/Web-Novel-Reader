"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchSiteSettings,
  updateSiteSettings,
  uploadLogo,
} from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";

export default function BloggerSettingsPage() {
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoAlt, setLogoAlt] = useState("Malaz logo");
  const [headline, setHeadline] = useState(
    "Fast updates, clean reading, and zero distractions."
  );
  const [heroDescription, setHeroDescription] = useState(
    "Track new chapters, follow translation teams, and read on any screen with a lightweight layout that keeps you focused."
  );
  const [primaryButton, setPrimaryButton] = useState("Start reading");
  const [secondaryButton, setSecondaryButton] = useState("Browse updates");
  const [accentColor, setAccentColor] = useState("#FBBF24");
  const [highlightLabel, setHighlightLabel] = useState("Malaz Translation Project");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [footerUpdatesLabel, setFooterUpdatesLabel] = useState("Updates");
  const [footerUpdatesUrl, setFooterUpdatesUrl] = useState("/updates");
  const [footerSeriesLabel, setFooterSeriesLabel] = useState("Series");
  const [footerSeriesUrl, setFooterSeriesUrl] = useState("/library");
  const [footerAdminLabel, setFooterAdminLabel] = useState("Admin");
  const [footerAdminUrl, setFooterAdminUrl] = useState("/admin");
  const [footerLink4Label, setFooterLink4Label] = useState("");
  const [footerLink4Url, setFooterLink4Url] = useState("");
  const [footerLink5Label, setFooterLink5Label] = useState("");
  const [footerLink5Url, setFooterLink5Url] = useState("");
  const [notice, setNotice] = useState("");
  const session = useAuthSession();
  const isAdmin = session?.user.role === "admin";

  useEffect(() => {
    if (session === undefined) {
      return;
    }
    fetchSiteSettings()
      .then((settings) => {
        setTitle(settings.title || "Malaz Translation");
        setTagline(settings.tagline || "Fast updates, clean reading.");
        setLogoUrl(settings.logoUrl || "");
        setLogoAlt(settings.logoAlt || "Malaz logo");
        setHeadline(settings.headline || "Fast updates, clean reading, and zero distractions.");
        setHeroDescription(
          settings.heroDescription ||
            "Track new chapters, follow translation teams, and read on any screen with a lightweight layout that keeps you focused."
        );
        setPrimaryButton(settings.primaryButton || "Start reading");
        setSecondaryButton(settings.secondaryButton || "Browse updates");
        setAccentColor(settings.accentColor || "#FBBF24");
        setHighlightLabel(settings.highlightLabel || "Malaz Translation Project");
        setFacebookUrl(settings.facebookUrl || "");
        setDiscordUrl(settings.discordUrl || "");
        setFooterUpdatesLabel(settings.footerUpdatesLabel || "Updates");
        setFooterUpdatesUrl(settings.footerUpdatesUrl || "/updates");
        setFooterSeriesLabel(settings.footerSeriesLabel || "Series");
        setFooterSeriesUrl(settings.footerSeriesUrl || "/library");
        setFooterAdminLabel(settings.footerAdminLabel || "Admin");
        setFooterAdminUrl(settings.footerAdminUrl || "/admin");
        setFooterLink4Label(settings.footerLink4Label || "");
        setFooterLink4Url(settings.footerLink4Url || "");
        setFooterLink5Label(settings.footerLink5Label || "");
        setFooterLink5Url(settings.footerLink5Url || "");
      })
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : "Failed to load settings.");
      });
  }, [session]);

  const handleSave = async () => {
    if (!isAdmin) {
      setNotice("Admin access required.");
      return;
    }
    if (!title.trim() || !tagline.trim()) {
      setNotice("Title and tagline are required.");
      return;
    }
    setNotice("");
    try {
      await updateSiteSettings({
        title: title.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        logoAlt: logoAlt.trim(),
        headline: headline.trim(),
        heroDescription: heroDescription.trim(),
        primaryButton: primaryButton.trim(),
        secondaryButton: secondaryButton.trim(),
        accentColor: accentColor.trim(),
        highlightLabel: highlightLabel.trim(),
        facebookUrl: facebookUrl.trim(),
        discordUrl: discordUrl.trim(),
        footerUpdatesLabel: footerUpdatesLabel.trim(),
        footerUpdatesUrl: footerUpdatesUrl.trim(),
        footerSeriesLabel: footerSeriesLabel.trim(),
        footerSeriesUrl: footerSeriesUrl.trim(),
        footerAdminLabel: footerAdminLabel.trim(),
        footerAdminUrl: footerAdminUrl.trim(),
        footerLink4Label: footerLink4Label.trim(),
        footerLink4Url: footerLink4Url.trim(),
        footerLink5Label: footerLink5Label.trim(),
        footerLink5Url: footerLink5Url.trim(),
      });
      setNotice("Settings saved.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Save failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_10%,rgba(251,191,36,0.18),transparent_45%),radial-gradient(800px_circle_at_90%_0%,rgba(56,189,248,0.14),transparent_40%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:py-14">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-amber-200 text-zinc-900">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Malaz Studio
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Website settings
                </h1>
              </div>
            </div>
            <Button variant="outline" asChild className="w-full gap-2 sm:w-auto">
              <Link href="/blogger-dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </header>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Brand and homepage</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the public site experience. Branding settings are stored now.
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Branding
                  </p>
                  <Input
                    placeholder="Site title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <Input
                    placeholder="Tagline"
                    value={tagline}
                    onChange={(event) => setTagline(event.target.value)}
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      try {
                        const uploaded = await uploadLogo(file);
                        setLogoUrl(uploaded);
                        setNotice("Logo uploaded.");
                      } catch (err) {
                        setNotice(err instanceof Error ? err.message : "Logo upload failed.");
                      }
                    }}
                  />
                  <Input
                    placeholder="Logo alt text"
                    value={logoAlt}
                    onChange={(event) => setLogoAlt(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Homepage hero
                  </p>
                  <Input
                    placeholder="Headline"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                  />
                  <Textarea
                    placeholder="Hero description"
                    value={heroDescription}
                    onChange={(event) => setHeroDescription(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Navigation
                  </p>
                  <Input
                    placeholder="Primary button"
                    value={primaryButton}
                    onChange={(event) => setPrimaryButton(event.target.value)}
                  />
                  <Input
                    placeholder="Secondary button"
                    value={secondaryButton}
                    onChange={(event) => setSecondaryButton(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Visual style
                  </p>
                  <Input
                    placeholder="Accent color"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                  />
                  <Input
                    placeholder="Highlight label"
                    value={highlightLabel}
                    onChange={(event) => setHighlightLabel(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {["Amber", "Sky", "Emerald", "Slate"].map((tone) => (
                      <Badge key={tone} variant="subtle">
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>
                {notice && <p className="text-sm text-amber-200">{notice}</p>}
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button
                    className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90 sm:w-auto"
                    onClick={handleSave}
                  >
                    Save settings
                  </Button>
                  <Button variant="outline" className="sm:w-auto" asChild>
                    <Link href="/">
                      Preview changes
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <p className="text-sm text-muted-foreground">
                Update social and footer links shown across the site.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Social links
                </p>
                <Input
                  placeholder="Facebook URL"
                  value={facebookUrl}
                  onChange={(event) => setFacebookUrl(event.target.value)}
                />
                <Input
                  placeholder="Discord URL"
                  value={discordUrl}
                  onChange={(event) => setDiscordUrl(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Footer links
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Footer link 1 label"
                    value={footerUpdatesLabel}
                    onChange={(event) => setFooterUpdatesLabel(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 1 URL"
                    value={footerUpdatesUrl}
                    onChange={(event) => setFooterUpdatesUrl(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 2 label"
                    value={footerSeriesLabel}
                    onChange={(event) => setFooterSeriesLabel(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 2 URL"
                    value={footerSeriesUrl}
                    onChange={(event) => setFooterSeriesUrl(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 3 label"
                    value={footerAdminLabel}
                    onChange={(event) => setFooterAdminLabel(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 3 URL"
                    value={footerAdminUrl}
                    onChange={(event) => setFooterAdminUrl(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 4 label"
                    value={footerLink4Label}
                    onChange={(event) => setFooterLink4Label(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 4 URL"
                    value={footerLink4Url}
                    onChange={(event) => setFooterLink4Url(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 5 label"
                    value={footerLink5Label}
                    onChange={(event) => setFooterLink5Label(event.target.value)}
                  />
                  <Input
                    placeholder="Footer link 5 URL"
                    value={footerLink5Url}
                    onChange={(event) => setFooterLink5Url(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchSiteSettings } from "@/lib/api";

export function SiteFooter() {
  const [links, setLinks] = useState([
    { label: "Updates", url: "/updates" },
    { label: "Series", url: "/library" },
    { label: "Admin", url: "/admin" },
    { label: "", url: "" },
    { label: "", url: "" },
  ]);

  useEffect(() => {
    fetchSiteSettings()
      .then((settings) => {
        setLinks([
          {
            label: settings.footerUpdatesLabel || "Updates",
            url: settings.footerUpdatesUrl || "/updates",
          },
          {
            label: settings.footerSeriesLabel || "Series",
            url: settings.footerSeriesUrl || "/library",
          },
          {
            label: settings.footerAdminLabel || "Admin",
            url: settings.footerAdminUrl || "/admin",
          },
          {
            label: settings.footerLink4Label || "",
            url: settings.footerLink4Url || "",
          },
          {
            label: settings.footerLink5Label || "",
            url: settings.footerLink5Url || "",
          },
        ]);
      })
      .catch(() => null);
  }, []);

  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">Malaz Translation</p>
          <p>Light novel translations with calm, fast reading.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {links
            .filter((item) => item.label && item.url)
            .map((item) => (
              <Link key={item.label} href={item.url} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
        </div>
      </div>
    </footer>
  );
}

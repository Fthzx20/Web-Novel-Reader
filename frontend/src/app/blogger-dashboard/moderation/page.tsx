"use client";

import { useEffect, useMemo, useState } from "react";

import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteUser,
  fetchAdminUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUser,
} from "@/lib/api";
import { loadSession } from "@/lib/auth";

const formatDate = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Date(parsed).toLocaleDateString();
};

export default function AccountModerationPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const session = loadSession();

  const loadUsers = async () => {
    setNotice("");
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to load users.");
    }
  };

  useEffect(() => {
    setIsAdmin(session?.user.role === "admin");
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!query.trim()) {
      return users;
    }
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle) ||
        user.role.toLowerCase().includes(needle) ||
        user.status.toLowerCase().includes(needle)
      );
    });
  }, [query, users]);

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
              <p>Please log in with an admin account to manage users.</p>
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
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            Account moderation
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Manage registered accounts</h1>
          <p className="max-w-2xl text-muted-foreground">
            Promote admins, ban abusive accounts, or remove users entirely.
          </p>
        </div>

        <Card className="mt-8">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Users</CardTitle>
            <Input
              placeholder="Search by name, email, role, status"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:max-w-xs"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {notice && <p className="text-sm text-amber-200">{notice}</p>}
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isSelf = session?.user.id === user.id;
                const isBanned = user.status.toLowerCase() === "banned";
                const nextRole = user.role === "admin" ? "user" : "admin";
                const nextStatus = isBanned ? "active" : "banned";

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-base font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge
                        variant={isBanned ? "outline" : "subtle"}
                        className={isBanned ? "border-red-500/40 text-red-500" : undefined}
                      >
                        {user.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf}
                        onClick={async () => {
                          try {
                            await updateUserRole(user.id, nextRole);
                            await loadUsers();
                          } catch (err) {
                            setNotice(err instanceof Error ? err.message : "Failed to update role.");
                          }
                        }}
                      >
                        Make {nextRole}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf}
                        onClick={async () => {
                          try {
                            await updateUserStatus(user.id, nextStatus);
                            await loadUsers();
                          } catch (err) {
                            setNotice(err instanceof Error ? err.message : "Failed to update status.");
                          }
                        }}
                      >
                        {isBanned ? "Unban" : "Ban"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        disabled={isSelf}
                        onClick={async () => {
                          const confirmed = window.confirm(
                            "Delete this account? This will remove all associated data."
                          );
                          if (!confirmed) {
                            return;
                          }
                          try {
                            await deleteUser(user.id);
                            await loadUsers();
                          } catch (err) {
                            setNotice(err instanceof Error ? err.message : "Failed to delete user.");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!filteredUsers.length && (
                <p className="text-sm text-muted-foreground">No accounts found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  clearUserHistory,
  deleteUser,
  fetchAdminUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUser,
} from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";

const formatDate = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Date(parsed).toLocaleDateString();
};

const maskName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "User";
  }
  if (trimmed.length <= 2) {
    return `${trimmed[0]}*`;
  }
  return `${trimmed.slice(0, 2)}***`;
};

const maskEmail = (value: string) => {
  const trimmed = value.trim();
  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return "hidden";
  }
  const local = parts[0];
  const domain = parts[1];
  const maskedLocal = local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
};

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger";
  onConfirm: () => Promise<void> | void;
};

type BulkAction = "make-admin" | "make-user" | "ban" | "unban" | "delete" | "clear-history";

export default function AccountModerationPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [moderationPassword, setModerationPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const session = useAuthSession();

  const loadUsers = async () => {
    setNotice("");
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users.";
      setNotice(message);
      throw new Error(message);
    }
  };

  useEffect(() => {
    setIsAdmin(session?.user.role === "admin");
  }, [session?.user.role]);

  useEffect(() => {
    if (session?.user.role !== "admin" || typeof window === "undefined") {
      return;
    }
    const stored = window.sessionStorage.getItem("moderationPassword") ?? "";
    if (stored) {
      setModerationPassword(stored);
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, [session?.user.role]);

  useEffect(() => {
    if (!isAdmin || !isUnlocked) {
      return;
    }
    void loadUsers();
  }, [isAdmin, isUnlocked]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => users.some((user) => user.id === id)));
  }, [users]);

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

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pagedUsers = filteredUsers.slice(pageStart, pageStart + pageSize);

  const toggleSelect = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    const pageIds = pagedUsers.map((user) => user.id);
    const isAllSelected = pageIds.every((id) => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds((current) => current.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...pageIds])));
    }
  };

  const applyBulkAction = async (action: BulkAction) => {
    if (!selectedIds.length) {
      setNotice("Select at least one account.");
      return;
    }
    const selfId = session?.user.id;
    const targetIds = selectedIds.filter((id) => id !== selfId);
    if (!targetIds.length) {
      setNotice("Bulk actions cannot target your own account.");
      return;
    }
    setIsBulkLoading(true);
    setNotice("");
    try {
      if (action === "make-admin") {
        await Promise.all(targetIds.map((id) => updateUserRole(id, "admin")));
      } else if (action === "make-user") {
        await Promise.all(targetIds.map((id) => updateUserRole(id, "user")));
      } else if (action === "ban") {
        await Promise.all(targetIds.map((id) => updateUserStatus(id, "banned")));
      } else if (action === "unban") {
        await Promise.all(targetIds.map((id) => updateUserStatus(id, "active")));
      } else if (action === "delete") {
        await Promise.all(targetIds.map((id) => deleteUser(id)));
      } else if (action === "clear-history") {
        await Promise.all(targetIds.map((id) => clearUserHistory(id)));
      }
      await loadUsers();
      setSelectedIds([]);
      if (selfId && selectedIds.includes(selfId)) {
        setNotice("Your account was skipped from bulk actions.");
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Bulk action failed.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const requestConfirm = (next: ConfirmState) => {
    setConfirmState(next);
  };

  const handleConfirm = async () => {
    if (!confirmState) {
      return;
    }
    setIsConfirming(true);
    try {
      await confirmState.onConfirm();
      setConfirmState(null);
    } finally {
      setIsConfirming(false);
    }
  };

  const requestBulkAction = (action: BulkAction) => {
    const descriptions: Record<BulkAction, string> = {
      "make-admin": "Promote the selected accounts to admin?",
      "make-user": "Demote the selected accounts to user?",
      ban: "Ban the selected accounts? They will be unable to log in.",
      unban: "Unban the selected accounts?",
      delete: "Delete the selected accounts? This will remove all associated data.",
      "clear-history": "Clear reading history for the selected accounts?",
    };
    const labels: Record<BulkAction, string> = {
      "make-admin": "Make admin",
      "make-user": "Make user",
      ban: "Ban accounts",
      unban: "Unban accounts",
      delete: "Delete accounts",
      "clear-history": "Clear history",
    };
    requestConfirm({
      title: "Confirm action",
      description: descriptions[action],
      confirmLabel: labels[action],
      tone: action === "delete" ? "danger" : undefined,
      onConfirm: () => applyBulkAction(action),
    });
  };

  const requestUserAction = (
    user: AdminUser,
    action: "make-admin" | "make-user" | "ban" | "unban" | "delete" | "clear-history"
  ) => {
    const label = action === "make-admin" ? "Make admin" :
      action === "make-user" ? "Make user" :
      action === "ban" ? "Ban" :
      action === "unban" ? "Unban" :
      action === "delete" ? "Delete" : "Clear history";
    const description =
      action === "delete"
        ? "Delete this account? This will remove all associated data."
        : action === "clear-history"
          ? "Clear this user's reading history?"
          : `Apply "${label}" to this account?`;
    requestConfirm({
      title: "Confirm action",
      description,
      confirmLabel: label,
      tone: action === "delete" ? "danger" : undefined,
      onConfirm: async () => {
        try {
          if (action === "make-admin") {
            await updateUserRole(user.id, "admin");
          } else if (action === "make-user") {
            await updateUserRole(user.id, "user");
          } else if (action === "ban") {
            await updateUserStatus(user.id, "banned");
          } else if (action === "unban") {
            await updateUserStatus(user.id, "active");
          } else if (action === "delete") {
            await deleteUser(user.id);
          } else if (action === "clear-history") {
            await clearUserHistory(user.id);
          }
          await loadUsers();
        } catch (err) {
          setNotice(err instanceof Error ? err.message : "Action failed.");
          throw err;
        }
      },
    });
  };

  const handleUnlock = async () => {
    setUnlockError("");
    const trimmed = moderationPassword.trim();
    if (!trimmed) {
      setUnlockError("Enter the moderation password.");
      return;
    }
    setIsUnlocking(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("moderationPassword", trimmed);
    }
    try {
      await loadUsers();
      setIsUnlocked(true);
    } catch (err) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("moderationPassword");
      }
      setUnlockError(err instanceof Error ? err.message : "Invalid moderation password.");
      setIsUnlocked(false);
    } finally {
      setIsUnlocking(false);
    }
  };

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

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Moderation access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the moderation password to manage user accounts.
              </p>
              <Input
                type="password"
                placeholder="Moderation password"
                value={moderationPassword}
                onChange={(event) => setModerationPassword(event.target.value)}
              />
              {unlockError && <p className="text-sm text-amber-200">{unlockError}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                >
                  {isUnlocking ? "Checking" : "Unlock"}
                </Button>
                <Button variant="outline" asChild>
                  <a href="/blogger-dashboard">Back to dashboard</a>
                </Button>
              </div>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-amber-200"
                  checked={pagedUsers.length > 0 && pagedUsers.every((user) => selectedIds.includes(user.id))}
                  onChange={toggleSelectAll}
                />
                <span className="text-muted-foreground">{selectedIds.length} selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!selectedIds.length || isBulkLoading}
                  className="w-full sm:w-auto"
                  onClick={() => requestBulkAction("make-admin")}
                >
                  Make admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!selectedIds.length || isBulkLoading}
                  className="w-full sm:w-auto"
                  onClick={() => requestBulkAction("make-user")}
                >
                  Make user
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!selectedIds.length || isBulkLoading}
                  className="w-full sm:w-auto"
                  onClick={() => requestBulkAction("ban")}
                >
                  Ban
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!selectedIds.length || isBulkLoading}
                  className="w-full sm:w-auto"
                  onClick={() => requestBulkAction("unban")}
                >
                  Unban
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!selectedIds.length || isBulkLoading}
                  className="w-full sm:w-auto"
                  onClick={() => requestBulkAction("clear-history")}
                >
                  Clear history
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-red-500 hover:text-red-600"
                  disabled={!selectedIds.length || isBulkLoading}
                  onClick={() => requestBulkAction("delete")}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {pagedUsers.map((user) => {
                const isSelf = session?.user.id === user.id;
                const isBanned = user.status.toLowerCase() === "banned";
                const nextRole = user.role === "admin" ? "user" : "admin";

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-amber-200"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                      />
                      <div className="space-y-1">
                        <p className="text-base font-medium">{maskName(user.name)}</p>
                        <p className="text-xs text-muted-foreground">{maskEmail(user.email)}</p>
                        <p className="text-xs text-muted-foreground">User #{user.id}</p>
                        <p className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end">
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
                        className="w-full sm:w-auto"
                        onClick={() => requestUserAction(user, nextRole === "admin" ? "make-admin" : "make-user")}
                      >
                        Make {nextRole}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf}
                        className="w-full sm:w-auto"
                        onClick={() => requestUserAction(user, isBanned ? "unban" : "ban")}
                      >
                        {isBanned ? "Unban" : "Ban"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf}
                        className="w-full sm:w-auto"
                        onClick={() => requestUserAction(user, "clear-history")}
                      >
                        Clear history
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-red-500 hover:text-red-600"
                        disabled={isSelf}
                        onClick={() => requestUserAction(user, "delete")}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Page {safePage} of {pageCount}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                >
                  Next
                </Button>
                <select
                  className="h-9 rounded-md border border-input bg-background/60 px-3 text-sm"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>{confirmState.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{confirmState.description}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmState(null)}
                    disabled={isConfirming}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={
                      confirmState.tone === "danger"
                        ? "bg-red-500 text-white hover:bg-red-500/90"
                        : "bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                    }
                    onClick={handleConfirm}
                    disabled={isConfirming}
                  >
                    {isConfirming ? "Working" : confirmState.confirmLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

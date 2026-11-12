"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2Icon, LogOutIcon, ShieldCheckIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { adminApi, setAdminToken, useAdminToken } from "@/lib/admin";
import { cn } from "@/lib/utils";

const AdminTokenContext = createContext<string>("");

export function useAdminContext() {
  return useContext(AdminTokenContext);
}

const tabs = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

function SignIn() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminApi.listOrders(token, { limit: 1 });
      setAdminToken(token);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "That admin token isn't valid."
          : err instanceof Error
            ? err.message
            : "Sign-in failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="size-5 text-primary" />
        <h1 className="text-xl font-semibold">Store admin</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Enter the <code>ADMIN_TOKEN</code> configured on the backend.
      </p>
      <div className="space-y-2">
        <Label htmlFor="admin-token">Admin token</Label>
        <Input
          id="admin-token"
          type="password"
          required
          autoComplete="current-password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2Icon className="animate-spin" />} Sign in
      </Button>
    </form>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const token = useAdminToken();
  const pathname = usePathname();

  if (token === undefined) return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  if (!token) return <SignIn />;

  return (
    <AdminTokenContext.Provider value={token}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex gap-1 rounded-lg bg-muted p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  pathname.startsWith(tab.href) ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={() => setAdminToken(null)}>
            <LogOutIcon /> Sign out
          </Button>
        </div>
        {children}
      </div>
    </AdminTokenContext.Provider>
  );
}

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Skeleton className="h-10 w-40" />;
  }

  if (!session) {
    return (
      <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">{session.user?.name ?? session.user?.email}</span>
      <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </div>
  );
}

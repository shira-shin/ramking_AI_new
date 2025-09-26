"use client";

import { Loader2 } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [isPending, startTransition] = useTransition();

  const handleSignIn = () => {
    startTransition(() => {
      signIn("google", { callbackUrl: "/dashboard" });
    });
  };

  const handleSignOut = () => {
    startTransition(() => {
      signOut({ callbackUrl: "/" });
    });
  };

  const loading = status === "loading" || isPending;

  if (loading) {
    return (
      <Button variant="secondary" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{session.user.name ?? session.user.email}</span>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleSignIn} className="gap-2">
      <svg
        aria-hidden
        focusable="false"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#4285F4"
          d="M23.76 12.276c0-.815-.073-1.597-.209-2.352H12.24v4.444h6.48a5.54 5.54 0 0 1-2.407 3.63v3.02h3.89c2.28-2.1 3.557-5.2 3.557-8.742Z"
        />
        <path
          fill="#34A853"
          d="M12.24 24c3.24 0 5.953-1.073 7.937-2.922l-3.89-3.02c-1.077.72-2.457 1.147-4.047 1.147-3.113 0-5.753-2.102-6.693-4.932H1.554v3.094C3.526 21.36 7.593 24 12.24 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.547 14.273a7.389 7.389 0 0 1-.386-2.273c0-.79.14-1.554.386-2.273V6.633H1.554A11.77 11.77 0 0 0 0 12c0 1.9.453 3.694 1.554 5.367l3.993-3.094Z"
        />
        <path
          fill="#EA4335"
          d="M12.24 4.765c1.79 0 3.396.62 4.665 1.835l3.48-3.48C18.185 1.235 15.48 0 12.24 0 7.593 0 3.526 2.64 1.554 6.633l3.993 3.094c.94-2.83 3.58-4.932 6.693-4.932Z"
        />
      </svg>
      Sign in with Google
    </Button>
  );
}

"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function SignOutButton({ className, children }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={cn(
        "inline-flex items-center rounded-xl border border-gray-300 px-5 py-3 text-gray-700 font-medium transition hover:bg-gray-50",
        className,
      )}
    >
      {children ?? "サインアウト"}
    </button>
  );
}

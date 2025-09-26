"use client";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  if (status === "loading") return <button className="btn">...</button>;
  if (!session) {
    return (
      <button className="btn-primary" onClick={() => signIn("google")}>
        Sign in with Google
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">Hi, {session.user?.name ?? "user"}</span>
      <button className="btn" onClick={() => signOut()}>Sign out</button>
    </div>
  );
}

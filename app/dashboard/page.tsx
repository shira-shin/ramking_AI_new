import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return <DashboardClient />;
}

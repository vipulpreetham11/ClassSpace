import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { BirthdayFormClient } from "./BirthdayFormClient";

export const dynamic = "force-dynamic";

export default async function AddBirthdayPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");
  if (session.user.role !== "ADMIN") redirect("/dashboard/birthdays");

  return <BirthdayFormClient />;
}

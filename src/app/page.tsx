import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getProfileOrRedirect();
  redirect(`/${profile.role}`);
}

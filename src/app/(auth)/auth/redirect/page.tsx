import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const TEAM_REDIRECT_URL = "https://videocontestfortheorphanscharity.help/";

export default async function AuthRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as Record<string, unknown>)?.role;

  if (role === "ADMIN") {
    redirect("/inbox");
  }

  // Regular team members go to the external URL
  redirect(TEAM_REDIRECT_URL);
}

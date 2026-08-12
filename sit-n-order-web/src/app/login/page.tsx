import { redirect } from "next/navigation";
import { SITE } from "@/lib/site";

export default function LoginPage() {
  redirect(`${SITE.dashboardUrl}/login`);
}

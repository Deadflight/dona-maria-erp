import { redirect } from "next/navigation"
import { getSession } from "@/actions/auth"

export default async function Home() {
  const { data: session } = await getSession()

  if (!session) {
    redirect("/login")
  }

  const redirectTo = session.role === "seller" ? "/pos" : "/dashboard"
  redirect(redirectTo)
}

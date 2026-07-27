import { redirect } from "next/navigation"
import { getSession } from "@/actions/auth"

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Only sellers and admins can access the POS terminal
  if (session.role !== "seller" && session.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {children}
    </div>
  )
}

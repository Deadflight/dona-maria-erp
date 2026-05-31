import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/actions/auth"

const navItems = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Productos", href: "/products" },
  { label: "Ventas", href: "/sales" },
  { label: "Clientes", href: "/clients" },
  { label: "Inventario", href: "/inventory" },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-muted/30">
        <div className="border-b px-4 py-4">
          <p className="text-sm font-medium">{session.fullName ?? session.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{session.role}</p>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

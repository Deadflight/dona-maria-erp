import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/actions/auth"
import { getStockAlertCount } from "@/lib/supabase/actions/inventario"

const navItems = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Productos", href: "/products" },
  { label: "Ventas", href: "/sales" },
  { label: "Clientes", href: "/clients" },
  { label: "Recepción", href: "/receipts" },
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

  const { data: alertCount } = await getStockAlertCount()

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
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              {item.label}
              {item.href === "/inventory" && (alertCount ?? 0) > 0 && (
                <span className="ml-auto inline-flex h-5 w-fit min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                  {alertCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { logout } from "@/actions/auth"

type LogoutButtonProps = {
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
  showLabel?: boolean
}

export function LogoutButton({
  variant = "ghost",
  size = "sm",
  className,
  showLabel = true,
}: LogoutButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    try {
      const result = await logout()

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      router.push("/login")
      router.refresh()
    } catch {
      toast.error("Error al cerrar sesión")
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={pending}
      aria-label={showLabel ? undefined : "Cerrar sesión"}
    >
      <LogOut className="size-3.5" />
      {showLabel && <span>Cerrar sesión</span>}
    </Button>
  )
}

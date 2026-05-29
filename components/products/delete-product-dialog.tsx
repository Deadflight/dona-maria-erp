"use client"

import { useActionState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { deleteProduct } from "@/actions/products"

interface DeleteProductDialogProps {
  productId: string
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState = {
  success?: boolean
  error?: string
}

export function DeleteProductDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: DeleteProductDialogProps) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState): Promise<FormState> => {
      const result = await deleteProduct(productId)
      if ("error" in result) {
        return { error: result.error }
      }
      return { success: true }
    },
    {}
  )

  // Refresh and close on success
  useEffect(() => {
    if (state.success) {
      router.refresh()
      onOpenChange(false)
    }
  }, [state.success, router, onOpenChange])

  const handleClose = useCallback(() => {
    if (!isPending) {
      onOpenChange(false)
    }
  }, [isPending, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{productName}</strong>?
            This action cannot be undone — the product will be deactivated and
            hidden from all views.
          </DialogDescription>
        </DialogHeader>

        {state.error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <form action={formAction}>
            <Button variant="destructive" type="submit" disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

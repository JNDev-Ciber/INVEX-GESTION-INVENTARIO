"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "./responsive-table"
import type { Product, Movement } from "../types/inventory"
import { ArrowUp, ArrowDown } from "lucide-react"

interface ProductMovementsModalProps {
  product: Product
  movements: Movement[]
  isOpen: boolean
  onClose: () => void
}

export function ProductMovementsModal({ product, movements, isOpen, onClose }: ProductMovementsModalProps) {
  const columns = [
    {
      key: "date",
      label: "Fecha",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "type",
      label: "Tipo",
      render: (value: "entrada" | "salida") => (
        <Badge variant={value === "entrada" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
          {value === "entrada" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {value === "entrada" ? "Entrada" : "Salida"}
        </Badge>
      ),
    },
    {
      key: "quantity",
      label: "Cantidad",
      render: (value: number) => value.toString(),
    },
    {
      key: "reason",
      label: "Motivo",
    },
    {
      key: "previousQuantity",
      label: "Stock Anterior",
      render: (value: number) => value.toString(),
    },
    {
      key: "newQuantity",
      label: "Stock Nuevo",
      render: (value: number) => value.toString(),
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos</DialogTitle>
          <DialogDescription>Movimientos de stock para: {product.name}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {movements.length > 0 ? (
            <ResponsiveTable data={movements} columns={columns} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos registrados para este producto.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

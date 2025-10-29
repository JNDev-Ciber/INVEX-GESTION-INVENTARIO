"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "./responsive-table"
import type { Product, PriceHistory } from "../types/inventory"

interface ProductPriceHistoryModalProps {
  product: Product
  priceHistory: PriceHistory[]
  isOpen: boolean
  onClose: () => void
}

export function ProductPriceHistoryModal({ product, priceHistory, isOpen, onClose }: ProductPriceHistoryModalProps) {
  const columns = [
    {
      key: "date",
      label: "Fecha",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "previousPrice",
      label: "Precio Anterior",
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      key: "newPrice",
      label: "Precio Nuevo",
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      key: "variation",
      label: "Variación",
      render: (_: any, item: PriceHistory) => {
        const variation = ((item.newPrice - item.previousPrice) / item.previousPrice) * 100
        return (
          <Badge variant={variation > 0 ? "default" : "destructive"}>
            {variation > 0 ? "+" : ""}
            {variation.toFixed(1)}%
          </Badge>
        )
      },
    },
    {
      key: "reason",
      label: "Motivo",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Precios</DialogTitle>
          <DialogDescription>Cambios de precio para: {product.name}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {priceHistory.length > 0 ? (
            <ResponsiveTable data={priceHistory} columns={columns} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay cambios de precio registrados para este producto.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

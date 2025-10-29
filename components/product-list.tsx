"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ShoppingCart,
  Package,
  Eye,
  History,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import type { Product, Movement, PriceHistory } from "../types/inventory"
import { exportInventoryToExcel, exportInventoryToHTML } from "../lib/excel-export"
import { useToast } from "@/hooks/use-toast"

interface ProductListTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  onQuickSale: (product: Product) => void
  onQuickStock: (product: Product) => void
  getMovementsByProduct: (productId: string) => Movement[]
  getPriceHistoryByProduct: (productId: string) => PriceHistory[]
}

export function ProductListTable({
  products,
  onEdit,
  onDelete,
  onQuickSale,
  onQuickStock,
  getMovementsByProduct,
  getPriceHistoryByProduct,
}: ProductListTableProps) {
  const { theme, resolvedTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Categorías únicas
  const categories = [...new Set(products.map(p => p.category))]

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    })
  }

  const getStockStatus = (product: Product) => {
    if (product.quantity <= 0) {
      return { label: "Sin Stock", variant: "destructive" as const, icon: AlertTriangle }
    }
    if (product.quantity <= product.minStock) {
      return { label: "Stock Bajo", variant: "secondary" as const, icon: AlertTriangle }
    }
    return { label: "En Stock", variant: "default" as const, icon: Package }
  }

  const getMarginColor = (margin: number) => {
    if (margin > 50) return isDark ? "text-green-400" : "text-green-600"
    if (margin > 20) return isDark ? "text-yellow-400" : "text-yellow-600"
    return isDark ? "text-red-400" : "text-red-600"
  }

  // No renderizar hasta que esté montado
  if (!mounted) {
    return <div>Cargando...</div>
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground text-center">
            Comienza agregando tu primer producto al inventario.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 border rounded-md text-sm ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  exportInventoryToExcel(filteredProducts)
                  toast({
                    title: "📊 Inventario exportado a Excel",
                    description: "El archivo .csv se descargó correctamente.",
                    duration: 3000,
                  })
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar a Excel (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  exportInventoryToHTML(filteredProducts)
                  toast({
                    title: "📄 Inventario exportado a HTML",
                    description: "El reporte se descargó como archivo HTML.",
                    duration: 3000,
                  })
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar a HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabla responsive */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className={isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
              <TableHead className="font-semibold">Producto</TableHead>
              <TableHead className="font-semibold">Categoría</TableHead>
              <TableHead className="font-semibold text-right">Precio</TableHead>
              <TableHead className="font-semibold text-right">Costo</TableHead>
              <TableHead className="font-semibold text-right">Stock</TableHead>
              <TableHead className="font-semibold text-right">Margen</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product)
              const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0
              const movements = getMovementsByProduct(product.id)
              const priceHistory = getPriceHistoryByProduct(product.id)

              return (
                <TableRow
                  key={product.id}
                  className={`transition-colors duration-200 ${
                    isDark 
                      ? 'hover:bg-gray-800/50 hover:text-gray-100' 
                      : 'hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {product.name}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {product.code}
                      </div>
                      {product.description && (
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} max-w-xs truncate`}>
                          {product.description}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(product.price)}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatCurrency(product.cost)}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className={`font-medium ${
                        product.quantity <= 0 
                          ? (isDark ? 'text-red-400' : 'text-red-600')
                          : product.quantity <= product.minStock
                          ? (isDark ? 'text-yellow-400' : 'text-yellow-600')
                          : (isDark ? 'text-gray-100' : 'text-gray-900')
                      }`}>
                        {product.quantity}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Mín: {product.minStock}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className={`font-medium ${getMarginColor(margin)}`}>
                      {margin.toFixed(1)}%
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatCurrency(product.price - product.cost)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={stockStatus.variant} className="text-xs">
                      <stockStatus.icon className="w-3 h-3 mr-1" />
                      {stockStatus.label}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {/* Botones de acción rápida */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuickSale(product)}
                        disabled={product.quantity <= 0}
                        className={`h-8 w-8 p-0 ${
                          isDark 
                            ? 'hover:bg-green-800 hover:text-green-300' 
                            : 'hover:bg-green-100 hover:text-green-700'
                        }`}
                        title="Venta rápida"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuickStock(product)}
                        className={`h-8 w-8 p-0 ${
                          isDark 
                            ? 'hover:bg-blue-800 hover:text-blue-300' 
                            : 'hover:bg-blue-100 hover:text-blue-700'
                        }`}
                        title="Agregar stock"
                      >
                        <Package className="h-3 w-3" />
                      </Button>

                      {/* Menú de opciones */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 w-8 p-0 ${
                              isDark 
                                ? 'hover:bg-gray-700 hover:text-gray-200' 
                                : 'hover:bg-gray-100 hover:text-gray-700'
                            }`}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar producto
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          
                          {movements.length > 0 && (
                            <DropdownMenuItem>
                              <History className="h-4 w-4 mr-2" />
                              Historial ({movements.length})
                            </DropdownMenuItem>
                          )}
                          
                          {priceHistory.length > 0 && (
                            <DropdownMenuItem>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Precios ({priceHistory.length})
                            </DropdownMenuItem>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente
                                  el producto "{product.name}" del inventario.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(product.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Información adicional */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-muted-foreground">
        <div>
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
        <div className="flex gap-4">
          <span>
            Valor total: {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0))}
          </span>
          <span>
            Stock total: {filteredProducts.reduce((sum, p) => sum + p.quantity, 0)} unidades
          </span>
        </div>
      </div>
    </div>
  )
}

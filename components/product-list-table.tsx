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
  Grid3X3,
  List,
  ChevronDown,
  Tag,
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
  const [selectedSubcategory, setSelectedSubcategory] = useState("all")
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isMobile, setIsMobile] = useState(false)

  // Evitar hidratación incorrecta y detectar móvil
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // En móvil, usar vista de grid por defecto
      if (window.innerWidth < 768) {
        setViewMode('grid')
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  // Categorías y subcategorías únicas
  const categories = [...new Set(products.map(p => p.category))]
  const allSubcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))]
  
  // Filtrar subcategorías por categoría seleccionada
  const filteredSubcategories = selectedCategory === "all" 
    ? allSubcategories 
    : [...new Set(products
        .filter(p => p.category === selectedCategory)
        .map(p => p.subcategory)
        .filter(Boolean)
      )]

  // Resetear subcategoría cuando cambia la categoría
  useEffect(() => {
    if (selectedCategory !== "all" && selectedSubcategory !== "all") {
      const isSubcategoryValid = filteredSubcategories.includes(selectedSubcategory)
      if (!isSubcategoryValid) {
        setSelectedSubcategory("all")
      }
    }
  }, [selectedCategory, filteredSubcategories, selectedSubcategory])

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.subcategory && product.subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSubcategory = selectedSubcategory === "all" || product.subcategory === selectedSubcategory
    
    return matchesSearch && matchesCategory && matchesSubcategory
  })

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    })
  }

  const getStockStatus = (product: Product) => {
    if (product.quantity <= 0) {
      return { 
        label: "Sin Stock", 
        variant: "destructive" as const, 
        icon: AlertTriangle,
        color: isDark ? "text-red-400" : "text-red-600"
      }
    }
    if (product.quantity <= product.minStock) {
      return { 
        label: "Stock Bajo", 
        variant: "secondary" as const, 
        icon: AlertTriangle,
        color: isDark ? "text-yellow-400" : "text-yellow-600"
      }
    }
    return { 
      label: "En Stock", 
      variant: "default" as const, 
      icon: Package,
      color: isDark ? "text-green-400" : "text-green-600"
    }
  }

  const getMarginColor = (margin: number) => {
    if (margin > 50) return isDark ? "text-green-400" : "text-green-600"
    if (margin > 20) return isDark ? "text-yellow-400" : "text-yellow-600"
    return isDark ? "text-red-400" : "text-red-600"
  }

  // Componente de Card para vista móvil
  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product)
    const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0
    const movements = getMovementsByProduct(product.id)
    const priceHistory = getPriceHistoryByProduct(product.id)

    return (
      <Card className={`transition-all duration-200 hover:shadow-lg ${
        isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
      }`}>
        <CardContent className="p-4">
          {/* Header del producto */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className={`font-semibold text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {product.name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {product.code}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                {product.subcategory && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {product.subcategory}
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant={stockStatus.variant} className="text-xs">
              <stockStatus.icon className="w-3 h-3 mr-1" />
              {stockStatus.label}
            </Badge>
          </div>

          {/* Información de precios y stock */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Precio</p>
              <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {formatCurrency(product.price)}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Stock</p>
              <p className={`font-semibold ${stockStatus.color}`}>
                {product.quantity}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Costo</p>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatCurrency(product.cost)}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Margen</p>
              <p className={`font-semibold ${getMarginColor(margin)}`}>
                {margin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Descripción si existe */}
          {product.description && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-2`}>
              {product.description}
            </p>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickSale(product)}
              disabled={product.quantity <= 0}
              className={`flex-1 ${
                isDark 
                  ? 'hover:bg-green-800 hover:text-green-300 hover:border-green-600' 
                  : 'hover:bg-green-100 hover:text-green-700 hover:border-green-300'
              }`}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Vender
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickStock(product)}
              className={`flex-1 ${
                isDark 
                  ? 'hover:bg-blue-800 hover:text-blue-300 hover:border-blue-600' 
                  : 'hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300'
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Stock
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`${
                    isDark 
                      ? 'hover:bg-gray-700 hover:text-gray-200 hover:border-gray-600' 
                      : 'hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => onEdit(product)}
                  className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar producto
                </DropdownMenuItem>
                
                <DropdownMenuItem className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                
                {movements.length > 0 && (
                  <DropdownMenuItem className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}>
                    <History className="h-4 w-4 mr-2" />
                    Historial ({movements.length})
                  </DropdownMenuItem>
                )}
                
                {priceHistory.length > 0 && (
                  <DropdownMenuItem className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Precios ({priceHistory.length})
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No renderizar hasta que esté montado
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
      {/* Header con filtros y controles responsive */}
      <div className="flex flex-col space-y-4">
        {/* Búsqueda y selector de vista */}
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
          
          {/* Controles de vista - Solo en desktop */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Tabla
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </Button>
            </div>
          )}
        </div>

        {/* Filtros y exportación */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Selector de categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              }`}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Selector de subcategoría */}
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={selectedCategory === "all" || filteredSubcategories.length === 0}
              className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                selectedCategory === "all" || filteredSubcategories.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              }`}
            >
              <option value="all">
                {selectedCategory === "all" 
                  ? "Selecciona categoría primero" 
                  : "Todas las subcategorías"
                }
              </option>
              {filteredSubcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>

            {/* Indicador de filtros activos */}
            {(selectedCategory !== "all" || selectedSubcategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all")
                  setSelectedSubcategory("all")
                }}
                className="text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown className="h-4 w-4" />
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
                className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}
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
                className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar a HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Vista condicional: Grid para móvil, tabla para desktop */}
      {viewMode === 'grid' || isMobile ? (
        /* Vista de Grid/Cards responsive */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Vista de Tabla - Solo desktop */
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={`${
                  isDark ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
                }`}>
                  <TableHead className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Producto
                  </TableHead>
                  <TableHead className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Categoría
                  </TableHead>
                  <TableHead className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Subcategoría
                  </TableHead>
                  <TableHead className={`font-semibold text-right ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Precio
                  </TableHead>
                  <TableHead className={`font-semibold text-right ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Costo
                  </TableHead>
                  <TableHead className={`font-semibold text-right ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Stock
                  </TableHead>
                  <TableHead className={`font-semibold text-right ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Margen
                  </TableHead>
                  <TableHead className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Estado
                  </TableHead>
                  <TableHead className={`font-semibold text-center ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Acciones
                  </TableHead>
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
                      className={`transition-colors duration-200 border-b-2 mb-1 ${
                        isDark 
                          ? 'hover:bg-gray-800/50 border-gray-600' 
                          : 'hover:bg-gray-50 border-gray-300'
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

                      <TableCell>
                        {product.subcategory ? (
                          <Badge variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {product.subcategory}
                          </Badge>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Sin subcategoría
                          </span>
                        )}
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
                              <DropdownMenuItem 
                                onClick={() => onEdit(product)}
                                className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar producto
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              
                              {movements.length > 0 && (
                                <DropdownMenuItem className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}>
                                  <History className="h-4 w-4 mr-2" />
                                  Historial ({movements.length})
                                </DropdownMenuItem>
                              )}
                              
                              {priceHistory.length > 0 && (
                                <DropdownMenuItem className={isDark ? 'hover:bg-gray-700 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900'}>
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Precios ({priceHistory.length})
                                </DropdownMenuItem>
                              )}
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
        </div>
      )}

      {/* Información adicional responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-muted-foreground">
        <div>
          Mostrando {filteredProducts.length} de {products.length} productos
          {(selectedCategory !== "all" || selectedSubcategory !== "all") && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              (filtrado)
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
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

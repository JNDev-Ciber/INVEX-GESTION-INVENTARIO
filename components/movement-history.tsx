"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveTable } from "./responsive-table"
import type { Movement, Product } from "../types/inventory"
import { exportMovementsReport } from "../lib/export-utils"
import { 
  ArrowUp, 
  ArrowDown, 
  History, 
  FileSpreadsheet, 
  Calendar, 
  Package, 
  TrendingUp,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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

interface MovementHistoryProps {
  movements: Movement[]
  products: Product[]
  onClearMovements?: () => Promise<void> // Nueva prop para limpiar movimientos
}

export function MovementHistory({ movements, products, onClearMovements }: MovementHistoryProps) {
  const { theme, resolvedTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [typeFilter, setTypeFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all") // Nuevo filtro por mes
  const [isMobile, setIsMobile] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Evitar hidratación incorrecta y detectar móvil
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  // Obtener meses únicos de los movimientos
  const getAvailableMonths = () => {
    const months = movements.map(movement => {
      const date = new Date(movement.date)
      return {
        value: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        label: date.toLocaleDateString("es-ES", { year: 'numeric', month: 'long' })
      }
    })
    
    // Eliminar duplicados y ordenar
    const uniqueMonths = months.filter((month, index, self) => 
      index === self.findIndex(m => m.value === month.value)
    ).sort((a, b) => b.value.localeCompare(a.value))
    
    return uniqueMonths
  }

  const availableMonths = getAvailableMonths()

  const filteredMovements = movements
    .filter((movement) => {
      const typeMatch = typeFilter === "all" || movement.type === typeFilter
      
      if (monthFilter === "all") return typeMatch
      
      const movementMonth = new Date(movement.date)
      const filterMonth = `${movementMonth.getFullYear()}-${(movementMonth.getMonth() + 1).toString().padStart(2, '0')}`
      
      return typeMatch && filterMonth === monthFilter
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Función para limpiar movimientos
  const handleClearMovements = async () => {
    if (!onClearMovements) {
      toast({
        title: "❌ Función no disponible",
        description: "La función de limpiar movimientos no está implementada.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      setIsClearing(true)
      await onClearMovements()
      
      toast({
        title: "🗑️ Movimientos eliminados",
        description: "Todos los movimientos han sido eliminados exitosamente.",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "❌ Error al limpiar movimientos",
        description: "No se pudieron eliminar los movimientos. Intenta nuevamente.",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setIsClearing(false)
    }
  }

  // Calcular estadísticas
  const totalEntradas = filteredMovements.filter((m) => m.type === "entrada").length
  const totalSalidas = filteredMovements.filter((m) => m.type === "salida").length
  const valorTotalEntradas = filteredMovements
    .filter((m) => m.type === "entrada")
    .reduce((sum, m) => {
      const product = products.find((p) => p.id === m.productId)
      return sum + ((product?.price || 0) * m.quantity)
    }, 0)
  const valorTotalSalidas = filteredMovements
    .filter((m) => m.type === "salida")
    .reduce((sum, m) => {
      const product = products.find((p) => p.id === m.productId)
      return sum + ((product?.price || 0) * m.quantity)
    }, 0)

  const columns = [
    {
      key: "date",
      label: "Fecha",
      render: (value: string) => (
        <div className="space-y-1">
          <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
            {new Date(value).toLocaleDateString("es-ES")}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {new Date(value).toLocaleTimeString("es-ES", { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      ),
    },
    {
      key: "product",
      label: "Producto",
      render: (_: any, movement: Movement) => {
        const product = products.find((p) => p.id === movement.productId)
        return (
          <div className="space-y-1">
            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {product?.name || "Producto eliminado"}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {product?.code}
            </div>
          </div>
        )
      },
    },
    {
      key: "type",
      label: "Tipo",
      render: (value: "entrada" | "salida") => (
        <Badge 
          variant={value === "entrada" ? "default" : "secondary"} 
          className={`flex items-center gap-1 w-fit ${
            value === "entrada" 
              ? (isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
              : (isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800')
          }`}
        >
          {value === "entrada" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {value === "entrada" ? "Entrada" : "Salida"}
        </Badge>
      ),
    },
    {
      key: "quantity",
      label: "Cantidad",
      render: (value: number) => (
        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
          {value.toString()}
        </span>
      ),
    },
    {
      key: "reason",
      label: "Motivo",
      render: (value: string) => (
        <span 
          className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`} 
          title={value}
        >
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </span>
      ),
    },
    {
      key: "stockChange",
      label: "Cambio de Stock",
      render: (_: any, movement: Movement) => (
        <span className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {movement.previousQuantity} → {movement.newQuantity}
        </span>
      ),
    },
    {
      key: "value",
      label: "Valor",
      render: (_: any, movement: Movement) => {
        const product = products.find((p) => p.id === movement.productId)
        const value = (product?.price || 0) * movement.quantity
        return (
          <span className={`font-medium ${
            movement.type === "entrada" 
              ? (isDark ? "text-green-400" : "text-green-600")
              : (isDark ? "text-red-400" : "text-red-600")
          }`}>
            ${value.toLocaleString("es-ES")}
          </span>
        )
      },
    },
  ]

  // Componente de Card para vista móvil
  const MovementCard = ({ movement }: { movement: Movement }) => {
    const product = products.find((p) => p.id === movement.productId)
    const value = (product?.price || 0) * movement.quantity

    return (
      <Card className={`transition-all duration-200 hover:shadow-lg ${
        isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
      }`}>
        <CardContent className="p-4">
          {/* Header del movimiento */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {product?.name || "Producto eliminado"}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {product?.code}
              </p>
            </div>
            <Badge 
              variant={movement.type === "entrada" ? "default" : "secondary"}
              className={`${
                movement.type === "entrada" 
                  ? (isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
                  : (isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800')
              }`}
            >
              {movement.type === "entrada" ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {movement.type === "entrada" ? "Entrada" : "Salida"}
            </Badge>
          </div>

          {/* Información del movimiento */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cantidad</p>
              <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {movement.quantity}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Valor</p>
              <p className={`font-semibold ${
                movement.type === "entrada" 
                  ? (isDark ? "text-green-400" : "text-green-600")
                  : (isDark ? "text-red-400" : "text-red-600")
              }`}>
                ${value.toLocaleString("es-ES")}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Stock</p>
              <p className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {movement.previousQuantity} → {movement.newQuantity}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fecha</p>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {new Date(movement.date).toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Motivo</p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {movement.reason}
            </p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Movimientos
        </CardTitle>
        <CardDescription>Registro completo de entradas y salidas de stock</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controles responsive mejorados */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Primera fila: Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los movimientos</SelectItem>
                <SelectItem value="entrada">Solo entradas</SelectItem>
                <SelectItem value="salida">Solo salidas</SelectItem>
              </SelectContent>
            </Select>

            {/* Nuevo filtro por mes */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {month.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Segunda fila: Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
          <Button
  onClick={() => {
    // Preparar datos para exportar con información completa
    const movementsWithProductInfo = filteredMovements.map(movement => {
      const product = products.find(p => p.id === movement.productId)
      return {
        ...movement,
        productName: product?.name || "Producto eliminado",
        productCode: product?.code || "N/A",
        value: (product?.price || 0) * movement.quantity
      }
    })
    
    exportMovementsReport(movementsWithProductInfo, products)
    toast({
      title: "📊 Movimientos exportados a CSV",
      description: "El archivo se descargó correctamente para Excel.",
      duration: 3000,
    })
  }}
              variant="outline"
              className={`flex items-center gap-2 ${
                isDark 
                  ? 'bg-green-700 hover:bg-green-600 text-white border-green-600' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar a Excel</span>
              <span className="sm:hidden">Exportar</span>
            </Button>

            {/* Botón para limpiar movimientos */}
            {onClearMovements && movements.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isClearing}
                    className={`flex items-center gap-2 ${
                      isDark 
                        ? 'border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300' 
                        : 'border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Limpiar Movimientos</span>
                    <span className="sm:hidden">Limpiar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      ¿Eliminar todos los movimientos?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente todos los movimientos del historial.
                      <br /><br />
                      <strong>⚠️ ADVERTENCIA:</strong> Esta acción no se puede deshacer y eliminará:
                      <br />• {movements.length} movimientos registrados
                      <br />• Todo el historial de entradas y salidas
                      <br />• Los datos de trazabilidad del inventario
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearMovements}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sí, eliminar todos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Resumen de movimientos responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg border transition-colors ${
            isDark 
              ? 'bg-green-900/20 border-green-800' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                Entradas
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {totalEntradas}
            </p>
            <p className={`text-xs ${isDark ? 'text-green-500' : 'text-green-700'}`}>
              ${valorTotalEntradas.toLocaleString("es-ES")}
            </p>
          </div>

          <div className={`p-4 rounded-lg border transition-colors ${
            isDark 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                Salidas
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {totalSalidas}
            </p>
            <p className={`text-xs ${isDark ? 'text-red-500' : 'text-red-700'}`}>
              ${valorTotalSalidas.toLocaleString("es-ES")}
            </p>
          </div>

          <div className={`p-4 rounded-lg border transition-colors ${
            isDark 
              ? 'bg-blue-900/20 border-blue-800' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <History className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                Total
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {filteredMovements.length}
            </p>
          </div>

          <div className={`p-4 rounded-lg border transition-colors ${
            isDark 
              ? 'bg-purple-900/20 border-purple-800' 
              : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                Balance
              </span>
            </div>
            <p className={`text-2xl font-bold ${
              (valorTotalEntradas - valorTotalSalidas) >= 0 
                ? (isDark ? 'text-green-400' : 'text-green-600')
                : (isDark ? 'text-red-400' : 'text-red-600')
            }`}>
              ${(valorTotalEntradas - valorTotalSalidas).toLocaleString("es-ES")}
            </p>
          </div>
        </div>

        {/* Vista condicional: Cards para móvil, tabla para desktop */}
        {filteredMovements.length > 0 ? (
          isMobile ? (
            /* Vista de Cards para móvil */
            <div className="space-y-4">
              {filteredMovements.map((movement, index) => (
                <MovementCard key={`${movement.productId}-${movement.date}-${index}`} movement={movement} />
              ))}
            </div>
          ) : (
            /* Vista de Tabla para desktop */
            <ResponsiveTable data={filteredMovements} columns={columns} />
          )
        ) : (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay movimientos registrados.</p>
            {(typeFilter !== "all" || monthFilter !== "all") && (
              <p className="text-sm mt-2">
                Intenta cambiar los filtros para ver más movimientos.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

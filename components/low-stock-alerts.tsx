"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveTable } from "./responsive-table"
import type { StockAlert } from "../types/inventory"
import { AlertTriangle, Plus, Package, CheckCircle, TrendingDown, RefreshCw } from "lucide-react"

interface LowStockAlertsProps {
  alerts: StockAlert[]
  onAddStock: (productId: string) => void
}

export function LowStockAlerts({ alerts, onAddStock }: LowStockAlertsProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

  // Ordenar alertas por urgencia (menor stock primero)
  const sortedAlerts = [...alerts].sort((a, b) => a.currentStock - b.currentStock)

  const columns = [
    {
      key: "product",
      label: "Producto",
      render: (product: any) => (
        <div className="space-y-1">
          <div className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {product.name}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {product.code}
          </div>
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "currentStock",
      label: "Stock Actual",
      render: (value: number, alert: StockAlert) => (
        <div className="space-y-1">
          <Badge 
            variant={value === 0 ? "destructive" : "secondary"}
            className={`${
              value === 0 
                ? (isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                : (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
            }`}
          >
            {value === 0 ? "SIN STOCK" : `${value} unidades`}
          </Badge>
          {value === 0 && (
            <div className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              ¡Crítico!
            </div>
          )}
        </div>
      ),
    },
    {
      key: "minStock",
      label: "Stock Mínimo",
      render: (value: number) => (
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {value} unidades
        </span>
      ),
    },
    {
      key: "difference",
      label: "Faltante",
      render: (value: number) => (
        <span className={`font-medium ${
          value > 10 
            ? (isDark ? 'text-red-400' : 'text-red-600')
            : (isDark ? 'text-yellow-400' : 'text-yellow-600')
        }`}>
          {value} unidades
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_: any, alert: StockAlert) => (
        <Button 
          size="sm" 
          onClick={() => onAddStock(alert.product.id)} 
          className={`${
            isDark 
              ? 'bg-blue-700 hover:bg-blue-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Reponer</span>
          <span className="sm:hidden">+</span>
        </Button>
      ),
    },
  ]

  // Componente de Card para vista móvil
  const AlertCard = ({ alert }: { alert: StockAlert }) => {
    const isOutOfStock = alert.currentStock === 0
    const isUrgent = alert.difference > 10

    return (
      <Card className={`transition-all duration-200 hover:shadow-lg ${
        isOutOfStock 
          ? (isDark ? 'border-red-800 bg-red-900/10' : 'border-red-200 bg-red-50')
          : (isDark ? 'border-yellow-800 bg-yellow-900/10' : 'border-yellow-200 bg-yellow-50')
      }`}>
        <CardContent className="p-4">
          {/* Header del producto */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {alert.product.name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {alert.product.code}
              </p>
              {alert.product.category && (
                <Badge variant="outline" className="text-xs mt-1">
                  {alert.product.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${
                isOutOfStock 
                  ? (isDark ? 'text-red-400' : 'text-red-600')
                  : (isDark ? 'text-yellow-400' : 'text-yellow-600')
              }`} />
              {isUrgent && (
                <Badge variant="destructive" className="text-xs">
                  URGENTE
                </Badge>
              )}
            </div>
          </div>

          {/* Información del stock */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Stock Actual</p>
              <Badge 
                variant={isOutOfStock ? "destructive" : "secondary"}
                className={`${
                  isOutOfStock 
                    ? (isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                    : (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                }`}
              >
                {isOutOfStock ? "SIN STOCK" : `${alert.currentStock}`}
              </Badge>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Stock Mínimo</p>
              <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {alert.minStock}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Faltante</p>
              <p className={`font-semibold ${
                isUrgent 
                  ? (isDark ? 'text-red-400' : 'text-red-600')
                  : (isDark ? 'text-yellow-400' : 'text-yellow-600')
              }`}>
                {alert.difference} unidades
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Prioridad</p>
              <p className={`text-sm font-medium ${
                isOutOfStock 
                  ? (isDark ? 'text-red-400' : 'text-red-600')
                  : isUrgent
                  ? (isDark ? 'text-orange-400' : 'text-orange-600')
                  : (isDark ? 'text-yellow-400' : 'text-yellow-600')
              }`}>
                {isOutOfStock ? "Crítica" : isUrgent ? "Alta" : "Media"}
              </p>
            </div>
          </div>

          {/* Botón de acción */}
          <Button 
            onClick={() => onAddStock(alert.product.id)}
            className={`w-full ${
              isDark 
                ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Reponer Stock
          </Button>
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

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            Alertas de Stock Bajo
          </CardTitle>
          <CardDescription>Estado del inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-center py-8 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">✅ Todos los productos tienen stock suficiente</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No hay productos que requieran reposición inmediata
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estadísticas
  const outOfStockCount = alerts.filter(alert => alert.currentStock === 0).length
  const urgentCount = alerts.filter(alert => alert.difference > 10).length
  const totalFaltante = alerts.reduce((sum, alert) => sum + alert.difference, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          Alertas de Stock Bajo
          <Badge 
            variant="destructive"
            className={isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}
          >
            {alerts.length}
          </Badge>
        </CardTitle>
        <CardDescription>Productos que necesitan reposición urgente</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Estadísticas rápidas responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg border transition-colors ${
            isDark 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                Sin Stock
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {outOfStockCount}
            </p>
            <p className={`text-xs ${isDark ? 'text-red-500' : 'text-red-700'}`}>
              Productos críticos
            </p>
          </div>

          <div className={`p-4 rounded-lg border transition-colors ${
            isDark 
              ? 'bg-orange-900/20 border-orange-800' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
                Urgentes
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              {urgentCount}
            </p>
            <p className={`text-xs ${isDark ? 'text-orange-500' : 'text-orange-700'}`}>
              Prioridad alta
            </p>
          </div>

          <div className={`p-4 rounded-lg border transition-colors ${
            isDark 
              ? 'bg-blue-900/20 border-blue-800' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                Total Faltante
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {totalFaltante}
            </p>
            <p className={`text-xs ${isDark ? 'text-blue-500' : 'text-blue-700'}`}>
              Unidades necesarias
            </p>
          </div>
        </div>

        {/* Vista condicional: Cards para móvil, tabla para desktop */}
        {isMobile ? (
          /* Vista de Cards para móvil */
          <div className="space-y-4">
            {sortedAlerts.map((alert, index) => (
              <AlertCard key={`${alert.product.id}-${index}`} alert={alert} />
            ))}
          </div>
        ) : (
          /* Vista de Tabla para desktop */
          <ResponsiveTable data={sortedAlerts} columns={columns} />
        )}

        {/* Información adicional */}
        <div className={`mt-6 p-4 rounded-lg border ${
          isDark 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Recomendaciones
            </span>
          </div>
          <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <li>• Prioriza la reposición de productos sin stock (críticos)</li>
            <li>• Considera aumentar el stock mínimo para productos de alta rotación</li>
            <li>• Revisa los proveedores para optimizar tiempos de entrega</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

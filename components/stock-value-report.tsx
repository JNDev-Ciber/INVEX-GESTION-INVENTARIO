"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveTable } from "./responsive-table"
import type { Product } from "../types/inventory"
import { exportInventoryReport, exportInventoryToExcel, exportCategoriesToExcel } from "../lib/excel-export"
import { Download, DollarSign, Package, TrendingUp, Info, FileSpreadsheet, BarChart3, PieChart, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

interface StockValueReportProps {
  products: Product[]
  totalInventoryValue: number
  totalInventoryCost: number
}

export function StockValueReport({ products, totalInventoryValue, totalInventoryCost }: StockValueReportProps) {
  const { toast } = useToast()
  const { theme, resolvedTheme } = useTheme()
  const [selectedChart, setSelectedChart] = useState<'categories' | 'margins' | 'stock'>('categories')
  const [mounted, setMounted] = useState(false)
  
  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')
  
  const totalMargin = totalInventoryValue - totalInventoryCost
  const marginPercentage = totalInventoryCost > 0 ? (totalMargin / totalInventoryCost) * 100 : 0

  const categoryStats = products.reduce(
    (acc, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = {
          category,
          products: 0,
          totalValue: 0,
          totalCost: 0,
          totalQuantity: 0,
        }
      }

      acc[category].products += 1
      acc[category].totalValue += product.price * product.quantity
      acc[category].totalCost += product.cost * product.quantity
      acc[category].totalQuantity += product.quantity

      return acc
    },
    {} as Record<string, any>,
  )

  const categoryData = Object.values(categoryStats).map((stat: any) => ({
    ...stat,
    margin: stat.totalValue - stat.totalCost,
    marginPercentage: stat.totalCost > 0 ? ((stat.totalValue - stat.totalCost) / stat.totalCost) * 100 : 0,
  }))

  // Colores adaptativos para modo oscuro/claro
  const chartColors = isDark ? [
    '#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA', 
    '#F472B6', '#22D3EE', '#A3E635', '#FB923C', '#818CF8'
  ] : [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  // Gráfico de barras adaptativo
  const CategoryBarChart = () => {
    const maxValue = Math.max(...categoryData.map(cat => cat.totalValue))
    
    return (
      <div className="space-y-3">
        {categoryData.map((category, index) => (
          <div key={category.category} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {category.category}
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                ${category.totalValue.toLocaleString()}
              </span>
            </div>
            <div className={`w-full rounded-full h-3 relative overflow-hidden ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className="h-3 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(category.totalValue / maxValue) * 100}%`,
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Gráfico circular adaptativo
  const MarginPieChart = () => {
    const total = categoryData.reduce((sum, cat) => sum + cat.totalValue, 0)
    let accumulatedPercentage = 0

    return (
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Círculo visual con fondo adaptativo */}
        <div className="relative w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={isDark ? '#374151' : '#e5e7eb'}
              strokeWidth="8"
            />
            {categoryData.map((category, index) => {
              const percentage = (category.totalValue / total) * 100
              const strokeDasharray = `${percentage * 2.51} 251.2`
              const strokeDashoffset = -accumulatedPercentage * 2.51
              accumulatedPercentage += percentage
              
              return (
                <circle
                  key={category.category}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {marginPercentage.toFixed(1)}%
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Margen Total
              </div>
            </div>
          </div>
        </div>

        {/* Leyenda adaptativa */}
        <div className="space-y-2 flex-1">
          {categoryData.map((category, index) => {
            const percentage = ((category.totalValue / total) * 100).toFixed(1)
            return (
              <div key={category.category} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <div className="flex-1 flex justify-between items-center">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {category.category}
                  </span>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {percentage}%
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      ${category.totalValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Gráfico de stock adaptativo
  const StockChart = () => {
    const maxStock = Math.max(...categoryData.map(cat => cat.totalQuantity))
    
    return (
      <div className="space-y-4">
        {categoryData.map((category, index) => {
          const stockPercentage = (category.totalQuantity / maxStock) * 100
          const isLowStock = category.totalQuantity < 50
          
          return (
            <div key={category.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {category.category}
                  </span>
                  {isLowStock && (
                    <Badge variant="destructive" className="text-xs">
                      Stock Bajo
                    </Badge>
                  )}
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {category.totalQuantity} unidades
                </span>
              </div>
              <div className={`w-full rounded-full h-4 relative overflow-hidden ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                    isLowStock 
                      ? (isDark ? 'bg-red-400' : 'bg-red-500')
                      : (isDark ? 'bg-blue-400' : 'bg-blue-500')
                  }`}
                  style={{ width: `${stockPercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {category.products} productos
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const columns = [
    {
      key: "category",
      label: "Categoría",
    },
    {
      key: "products",
      label: "Productos",
      render: (value: number) => value.toString(),
    },
    {
      key: "totalQuantity",
      label: "Cantidad Total",
      render: (value: number) => value.toString(),
    },
    {
      key: "totalCost",
      label: "Costo Total",
      render: (value: number) => `$${value.toLocaleString("es-ES")}`,
    },
    {
      key: "totalValue",
      label: "Valor Total",
      render: (value: number) => `$${value.toLocaleString("es-ES")}`,
    },
    {
      key: "margin",
      label: "Margen",
      render: (value: number) => (
        <span className={value > 0 ? "text-green-600" : "text-red-600"}>${value.toLocaleString("es-ES")}</span>
      ),
    },
    {
      key: "marginPercentage",
      label: "Margen %",
      render: (value: number) => <Badge variant={value > 0 ? "default" : "destructive"}>{value.toFixed(1)}%</Badge>,
    },
  ]

  // No renderizar hasta que esté montado para evitar problemas de hidratación
  if (!mounted) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total del Inventario</p>
                <p className="text-2xl font-bold text-blue-600">${totalInventoryValue.toLocaleString("es-ES")}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Costo Total del Inventario</p>
                <p className="text-2xl font-bold text-orange-600">${totalInventoryCost.toLocaleString("es-ES")}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margen Total</p>
                <p className={`text-2xl font-bold ${totalMargin > 0 ? "text-green-600" : "text-red-600"}`}>
                  ${totalMargin.toLocaleString("es-ES")}
                </p>
                <p className="text-sm text-muted-foreground">{marginPercentage.toFixed(1)}%</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${totalMargin > 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos en Tiempo Real con fondo adaptativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Análisis Visual en Tiempo Real
          </CardTitle>
          <CardDescription>
            Visualización interactiva de datos del inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Selector de gráficos */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedChart === 'categories' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChart('categories')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Valor por Categoría
            </Button>
            <Button
              variant={selectedChart === 'margins' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChart('margins')}
              className="flex items-center gap-2"
            >
              <PieChart className="h-4 w-4" />
              Distribución de Márgenes
            </Button>
            <Button
              variant={selectedChart === 'stock' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChart('stock')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Niveles de Stock
            </Button>
          </div>

          {/* Contenedor de gráficos con fondo adaptativo */}
          <div className={`min-h-[300px] p-4 rounded-lg transition-colors duration-200 ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            {selectedChart === 'categories' && (
              <div>
                <h4 className={`text-lg font-semibold mb-4 text-center ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Valor del Inventario por Categoría
                </h4>
                <CategoryBarChart />
              </div>
            )}
            
            {selectedChart === 'margins' && (
              <div>
                <h4 className={`text-lg font-semibold mb-4 text-center ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Distribución de Valor y Márgenes
                </h4>
                <MarginPieChart />
              </div>
            )}
            
            {selectedChart === 'stock' && (
              <div>
                <h4 className={`text-lg font-semibold mb-4 text-center ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Niveles de Stock por Categoría
                </h4>
                <StockChart />
              </div>
            )}
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {categoryData.length}
              </div>
              <div className="text-sm text-muted-foreground">Categorías</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {categoryData.filter(cat => cat.marginPercentage > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Con Ganancia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {categoryData.reduce((sum, cat) => sum + cat.totalQuantity, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Unidades Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(...categoryData.map(cat => cat.marginPercentage)).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Mejor Margen</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reporte por Categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Valor por Categorías</CardTitle>
          <CardDescription>Análisis detallado del valor del inventario por categoría de productos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-end mb-4">
            <Button
              onClick={() => {
                exportInventoryToExcel(products)
                toast({
                  title: "📊 Inventario exportado a Excel",
                  description: "El archivo .xlsx se descargó correctamente sin problemas de codificación.",
                  duration: 3000,
                })
              }}
              variant="outline"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Inventario (Excel)
            </Button>

            <Button
              onClick={() => {
                exportCategoriesToExcel(categoryData)
                toast({
                  title: "📊 Categorías exportadas a Excel",
                  description: "El archivo .xlsx se descargó correctamente.",
                  duration: 3000,
                })
              }}
              variant="outline"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Categorías (Excel)
            </Button>

            <Button
              onClick={() => {
                exportInventoryReport(products)
                toast({
                  title: "📄 Inventario exportado a PDF",
                  description: "El reporte se descargó como HTML para imprimir como PDF.",
                  duration: 3000,
                })
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDF (HTML)
            </Button>
          </div>

          <ResponsiveTable data={categoryData} columns={columns} />
        </CardContent>
      </Card>
    </div>
  )
}

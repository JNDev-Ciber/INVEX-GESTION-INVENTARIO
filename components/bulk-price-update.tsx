"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import type { Product } from "../types/inventory"
import { TrendingUp, Calculator, Package, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BulkPriceUpdateProps {
  products: Product[]
  onUpdatePrices: (category: string, percentage: number, isSubcategory?: boolean) => void
}

export function BulkPriceUpdate({ products, onUpdatePrices }: BulkPriceUpdateProps) {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [percentage, setPercentage] = useState("")
  const [updateType, setUpdateType] = useState<"category" | "subcategory">("category")

  // Obtener categorías únicas
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean)
  
  // ✅ Obtener subcategorías únicas - CORREGIDO
  const subcategories = Array.from(new Set(
    products
      .filter(p => p.subcategory)
      .map((p) => p.subcategory)
  )).filter(Boolean) as string[] // ✅ Asegurar que son strings

  // Productos afectados según el tipo de actualización
  const affectedProducts = (() => {
    if (updateType === "category" && selectedCategory) {
      return products.filter((p) => p.category === selectedCategory)
    } else if (updateType === "subcategory" && selectedSubcategory) {
      return products.filter((p) => p.subcategory === selectedSubcategory)
    }
    return []
  })()

  // Función para manejar cambios en el porcentaje
  const handlePercentageChange = (value: string) => {
    // Permitir vacío, números positivos y negativos, con decimales
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      setPercentage(value)
    }
  }

  // Obtener el valor numérico del porcentaje
  const getPercentageValue = () => {
    const num = parseFloat(percentage)
    return isNaN(num) ? 0 : num
  }

  const handleUpdate = () => {
    const target = updateType === "category" ? selectedCategory : selectedSubcategory
    const percentageValue = getPercentageValue()
    
    if (target && percentageValue !== 0) {
      onUpdatePrices(target, percentageValue, updateType === "subcategory")

      // Notificación de éxito
      const actionText = percentageValue > 0 ? "aumentaron" : "redujeron"
      const emoji = percentageValue > 0 ? "📈" : "📉"
      const typeText = updateType === "category" ? "categoría" : "subcategoría"

      toast({
        title: `${emoji} Precios actualizados`,
        description: `Los precios de la ${typeText} "${target}" se ${actionText} ${Math.abs(percentageValue)}%.`,
        duration: 3000,
      })

      // Limpiar formulario
      setSelectedCategory("")
      setSelectedSubcategory("")
      setPercentage("")
    }
  }

  const previewPrices = affectedProducts.map((product) => ({
    ...product,
    newPrice: Math.round(product.price * (1 + getPercentageValue() / 100)),
  }))

  // ✅ Resetear selecciones cuando cambia el tipo - CORREGIDO
  const handleUpdateTypeChange = (type: string) => {
    if (type === 'category' || type === 'subcategory') {
      setUpdateType(type as 'category' | 'subcategory')
      setSelectedCategory("")
      setSelectedSubcategory("")
      setPercentage("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Actualización Masiva de Precios
        </CardTitle>
        <CardDescription>
          Actualiza los precios de todos los productos de una categoría o subcategoría específica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs para elegir tipo de actualización */}
        <Tabs 
          value={updateType} 
          onValueChange={handleUpdateTypeChange} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="category" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Por Categoría
            </TabsTrigger>
            <TabsTrigger value="subcategory" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Por Subcategoría
            </TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const categoryProducts = products.filter(p => p.category === category)
                      return (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center justify-between w-full">
                            <span>{category}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({categoryProducts.length} productos)
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <p className="text-xs text-muted-foreground">
                    📦 {affectedProducts.length} productos en esta categoría
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Porcentaje de Cambio (%)</Label>
                <Input
                  id="percentage"
                  value={percentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  placeholder="10 para aumentar 10%, -5 para reducir 5%"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Usa números positivos para aumentar, negativos para reducir
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subcategory" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoría</Label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.length > 0 ? (
                      subcategories.map((subcategory) => {
                        const subcategoryProducts = products.filter(p => p.subcategory === subcategory)
                        const parentCategory = subcategoryProducts[0]?.category || "Sin categoría"
                        return (
                          <SelectItem key={subcategory} value={subcategory}>
                            <div className="flex flex-col items-start">
                              <span>{subcategory}</span>
                              <span className="text-xs text-muted-foreground">
                                {parentCategory} • {subcategoryProducts.length} productos
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="no-subcategories" disabled>
                        No hay subcategorías disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedSubcategory && (
                  <p className="text-xs text-muted-foreground">
                    🏷️ {affectedProducts.length} productos en esta subcategoría
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage-sub">Porcentaje de Cambio (%)</Label>
                <Input
                  id="percentage-sub"
                  value={percentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  placeholder="10 para aumentar 10%, -5 para reducir 5%"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Usa números positivos para aumentar, negativos para reducir
                </p>
              </div>
            </div>

            {subcategories.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>ℹ️ No hay subcategorías disponibles</strong><br />
                  Para usar esta función, primero agrega subcategorías a tus productos.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Vista previa de productos afectados */}
        {affectedProducts.length > 0 && getPercentageValue() !== 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Vista Previa - {affectedProducts.length} productos afectados:
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {previewPrices.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{product.name}</span>
                    <div className="text-xs text-muted-foreground">
                      {product.category}{product.subcategory && ` • ${product.subcategory}`}
                    </div>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">${product.price.toLocaleString()}</span>
                    <TrendingUp className={`h-3 w-3 ${getPercentageValue() > 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`font-medium ${getPercentageValue() > 0 ? "text-green-600" : "text-red-600"}`}>
                      ${product.newPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Resumen de cambios */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Productos:</span>
                  <p>{affectedProducts.length}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Cambio:</span>
                  <p>{getPercentageValue() > 0 ? '+' : ''}{getPercentageValue()}%</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Valor actual:</span>
                  <p>${affectedProducts.reduce((sum, p) => sum + p.price, 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Valor nuevo:</span>
                  <p>${previewPrices.reduce((sum, p) => sum + p.newPrice, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de actualización con confirmación */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={
                (updateType === "category" && (!selectedCategory || getPercentageValue() === 0)) ||
                (updateType === "subcategory" && (!selectedSubcategory || getPercentageValue() === 0)) ||
                affectedProducts.length === 0
              }
            >
              <Calculator className="h-4 w-4 mr-2" />
              Actualizar Precios {updateType === "category" ? "por Categoría" : "por Subcategoría"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar actualización de precios?</AlertDialogTitle>
              <AlertDialogDescription>
                Se actualizarán los precios de <strong>{affectedProducts.length} productos</strong> en la{" "}
                {updateType === "category" ? "categoría" : "subcategoría"}{" "}
                "<strong>{updateType === "category" ? selectedCategory : selectedSubcategory}</strong>"
                con un cambio del <strong>{getPercentageValue() > 0 ? "+" : ""}{getPercentageValue()}%</strong>.
                <br /><br />
                <span className="text-red-600">⚠️ Esta acción no se puede deshacer.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                Confirmar Actualización
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

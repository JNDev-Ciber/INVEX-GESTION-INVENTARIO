"use client";

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, X, CheckCircle, Download } from "lucide-react"
import type { Product } from "../types/inventory"
import { useToast } from "@/hooks/use-toast"

interface QuickSaleItem {
  product: Product
  quantity: number
  subtotal: number
}

interface QuickSaleFormProps {
  products: Product[]
  onSaleComplete: (items: QuickSaleItem[]) => Promise<void>
}

export function QuickSaleForm({ products, onSaleComplete }: QuickSaleFormProps) {
  const { toast } = useToast()
  const [barcodeInput, setBarcodeInput] = useState("")
  const [cartItems, setCartItems] = useState<QuickSaleItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastBarcodeTimeRef = useRef<number>(0)

  // ✅ DEBUG: Ver qué productos tienen barcode
  useEffect(() => {
    const withBarcode = products.filter(p => p.barcode && p.barcode.trim() !== "")
    console.log(`📦 Productos en memoria: ${products.length}`)
    console.log(`📊 Con barcode: ${withBarcode.length}`)
    if (withBarcode.length > 0) {
      console.log("Barcodes encontrados:", withBarcode.map(p => ({ name: p.name, barcode: p.barcode })))
    }
  }, [products])

  const validateBarcode = (barcode: string): boolean => {
    const cleaned = barcode.trim().replace(/\s+/g, '')
    
    if (!cleaned) return false
    if (!/^\d{5,}$/.test(cleaned)) return false
    if (cleaned.length < 5 || cleaned.length > 128) return false
    
    return true
  }

  const findProductByBarcode = (barcode: string): Product | undefined => {
    const cleaned = barcode.trim().replace(/\s+/g, '')
    
    console.log(`🔍 Buscando barcode: ${cleaned}`)
    console.log(`📋 Total de productos: ${products.length}`)
    
    // Búsqueda EXACTA primero
    let product = products.find(p => {
      const productBarcode = p.barcode ? p.barcode.trim().replace(/\s+/g, '') : ''
      const matches = productBarcode === cleaned
      if (matches) {
        console.log(`✅ ENCONTRADO por búsqueda exacta: ${p.name}`)
      }
      return matches
    })
    
    if (product) return product

    // Si no encuentra, logear todos los barcodes para debugging
    console.log("❌ No encontrado en búsqueda exacta. Barcodes disponibles:")
    products.forEach(p => {
      if (p.barcode) {
        console.log(`   - ${p.name}: ${p.barcode}`)
      }
    })

    return undefined
  }

  useEffect(() => {
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current)
    }

    if (!barcodeInput.trim()) {
      return
    }

    if (barcodeInput.length < 5) {
      return
    }

    const now = Date.now()
    const timeSinceLastScan = now - lastBarcodeTimeRef.current
    const delay = timeSinceLastScan < 100 ? 150 : 100

    barcodeTimeoutRef.current = setTimeout(() => {
      if (!validateBarcode(barcodeInput)) {
        console.error(`❌ Código inválido: ${barcodeInput}`)
        toast({
          title: "⚠️ Código inválido",
          description: `"${barcodeInput}" no es válido`,
          variant: "destructive",
          duration: 800,
        })
        setBarcodeInput("")
        lastBarcodeTimeRef.current = Date.now()
        return
      }

      const product = findProductByBarcode(barcodeInput)

      if (!product) {
        console.error(`❌ Producto no encontrado para barcode: ${barcodeInput}`)
        toast({
          title: "❌ No encontrado",
          description: `${barcodeInput}`,
          variant: "destructive",
          duration: 800,
        })
        setBarcodeInput("")
        lastBarcodeTimeRef.current = Date.now()
        return
      }

      if (product.quantity <= 0) {
        console.warn(`⚠️ Sin stock: ${product.name}`)
        toast({
          title: "❌ Sin stock",
          description: product.name,
          variant: "destructive",
          duration: 800,
        })
        setBarcodeInput("")
        lastBarcodeTimeRef.current = Date.now()
        return
      }

      // ✅ Agregar al carrito
      setCartItems(prev => {
        const existingItem = prev.find(item => item.product.id === product.id)
        
        if (existingItem) {
          if (existingItem.quantity >= product.quantity) {
            toast({
              title: "⚠️ Stock limitado",
              description: `Máx: ${product.quantity}`,
              duration: 800,
            })
            return prev
          }
          console.log(`🔄 Aumentando cantidad de: ${product.name}`)
          return prev.map(item =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * product.price,
                }
              : item
          )
        }

        console.log(`✅ Agregando nuevo: ${product.name}`)
        return [...prev, {
          product,
          quantity: 1,
          subtotal: product.price,
        }]
      })

      toast({
        title: "✓",
        description: product.name,
        duration: 500,
      })

      setBarcodeInput("")
      lastBarcodeTimeRef.current = Date.now()
    }, delay)
  }, [barcodeInput, products, toast])

  useEffect(() => {
    return () => {
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current)
      }
    }
  }, [])

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId))
  }

  const handleChangeQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (!product || newQuantity > product.quantity) return

    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * product.price,
            }
          : item
      )
    )
  }

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) return

    setIsProcessing(true)
    try {
      await onSaleComplete(cartItems)
      
      toast({
        title: "✅ Venta registrada",
        description: `${cartItems.length} artículos`,
      })
      
      setCartItems([])
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo registrar",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-green-600 mb-1">Venta Rápida</h2>
            <p className="text-sm text-muted-foreground">Escanea productos para vender</p>
          </div>

          <div className="p-4 border-2 border-green-500 rounded-lg sticky top-4 z-10 bg-green-50/80 backdrop-blur dark:bg-green-950/80">
            <Input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Escanea código..."
              autoFocus
              className="text-lg font-bold text-center border-0 bg-transparent text-green-700 dark:text-green-300 placeholder:text-green-400 focus:ring-0"
            />
            <div className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
              {products.filter(p => p.barcode?.trim()).length} productos con código
            </div>
          </div>

          {cartItems.length === 0 ? (
            <Alert className="border-dashed border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-sm ml-2">
                Acerca el lector para empezar
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-xl overflow-hidden shadow-lg border dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="max-h-96 overflow-y-auto space-y-1 p-2">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-lg flex items-center justify-between gap-3 transition-colors hover:bg-gray-100 bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          ${item.product.price.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-green-600">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ${item.subtotal.toLocaleString()}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t space-y-3 dark:bg-gray-800 dark:border-gray-700 bg-gray-50 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">TOTAL:</span>
                  <span className="text-3xl font-black text-green-600">
                    ${total.toLocaleString()}
                  </span>
                </div>
                <Button
                  onClick={handleCompleteSale}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg font-bold py-6 rounded-lg transition-all shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-6 w-6 mr-2" />
                      VENDER
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

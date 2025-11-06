"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
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
  const { theme, resolvedTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [cartItems, setCartItems] = useState<QuickSaleItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  useEffect(() => {
    if (!barcodeInput.trim() || barcodeInput.length < 5) return

    const product = products.find(p => p.barcode === barcodeInput.trim())

    if (!product) {
      toast({
        title: "❌ No encontrado",
        description: `${barcodeInput}`,
        variant: "destructive",
        duration: 800,
      })
      setBarcodeInput("")
      return
    }

    if (product.quantity <= 0) {
      toast({
        title: "❌ Sin stock",
        description: product.name,
        variant: "destructive",
        duration: 800,
      })
      setBarcodeInput("")
      return
    }

    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      
      if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
          toast({
            title: "⚠️ Stock limitado",
            description: `Max: ${product.quantity}`,
            duration: 800,
          })
          return prev
        }
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
  }, [barcodeInput, products, toast])

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

  const generateReceiptHTML = (items: QuickSaleItem[], total: number) => {
    const now = new Date()
    const fecha = now.toLocaleDateString('es-AR')
    const hora = now.toLocaleTimeString('es-AR')

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RECIBO - INVEX</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .receipt-container {
            background: white;
            width: 100%;
            max-width: 500px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .receipt-header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .receipt-header h1 {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 2px;
        }
        
        .receipt-header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .receipt-meta {
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 2px solid #e0e0e0;
            font-size: 13px;
            color: #666;
        }
        
        .receipt-meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            line-height: 1.6;
        }
        
        .receipt-meta-row:last-child {
            margin-bottom: 0;
        }
        
        .receipt-meta-label {
            font-weight: 600;
            color: #333;
        }
        
        .receipt-items {
            padding: 20px;
        }
        
        .receipt-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .receipt-item:last-child {
            border-bottom: 2px solid #16a34a;
            padding-bottom: 15px;
            margin-bottom: 15px;
        }
        
        .item-info {
            flex: 1;
        }
        
        .item-name {
            font-weight: 600;
            color: #333;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .item-details {
            font-size: 12px;
            color: #999;
            display: flex;
            gap: 10px;
        }
        
        .item-price {
            text-align: right;
            min-width: 80px;
        }
        
        .item-unit-price {
            font-size: 12px;
            color: #999;
            margin-bottom: 4px;
        }
        
        .item-subtotal {
            font-weight: 600;
            color: #16a34a;
            font-size: 14px;
        }
        
        .receipt-total {
            padding: 20px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%);
            border-top: 2px solid #16a34a;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .total-label {
            font-size: 16px;
            color: #333;
            font-weight: 600;
        }
        
        .total-value {
            font-size: 28px;
            font-weight: bold;
            color: #16a34a;
        }
        
        .item-count {
            font-size: 12px;
            color: #999;
            margin-top: 10px;
        }
        
        .receipt-footer {
            padding: 20px;
            text-align: center;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
        
        .receipt-footer p {
            margin-bottom: 8px;
        }
        
        .receipt-footer p:last-child {
            margin-bottom: 0;
        }
        
        .print-note {
            text-align: center;
            padding: 15px;
            background: #fff3cd;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #856404;
        }
        
        @media print {
            body {
                background: white;
            }
            .receipt-container {
                box-shadow: none;
                border-radius: 0;
                max-width: 100%;
            }
            .print-note {
                display: none;
            }
        }
        
        @media (max-width: 600px) {
            .receipt-header h1 {
                font-size: 28px;
            }
            
            .total-value {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- HEADER -->
        <div class="receipt-header">
            <h1>✓ RECIBO</h1>
            <p>INVEX - Sistema de Inventario</p>
        </div>
        
        <!-- META -->
        <div class="receipt-meta">
            <div class="receipt-meta-row">
                <span class="receipt-meta-label">Fecha:</span>
                <span>${fecha}</span>
            </div>
            <div class="receipt-meta-row">
                <span class="receipt-meta-label">Hora:</span>
                <span>${hora}</span>
            </div>
            <div class="receipt-meta-row">
                <span class="receipt-meta-label">Artículos:</span>
                <span>${items.length}</span>
            </div>
        </div>
        
        <!-- ITEMS -->
        <div class="receipt-items">
            ${items.map(item => `
            <div class="receipt-item">
                <div class="item-info">
                    <div class="item-name">${item.product.name}</div>
                    <div class="item-details">
                        <span>x${item.quantity}</span>
                        <span>@$${item.product.price.toLocaleString()}</span>
                    </div>
                </div>
                <div class="item-price">
                    <div class="item-unit-price">$${item.product.price.toLocaleString()}</div>
                    <div class="item-subtotal">$${item.subtotal.toLocaleString()}</div>
                </div>
            </div>
            `).join('')}
        </div>
        
        <!-- TOTAL -->
        <div class="receipt-total">
            <div class="total-row">
                <span class="total-label">TOTAL:</span>
                <span class="total-value">$${total.toLocaleString()}</span>
            </div>
            <div class="item-count">
                ${items.length} producto${items.length > 1 ? 's' : ''} vendido${items.length > 1 ? 's' : ''}
            </div>
        </div>
        
        <!-- FOOTER -->
        <div class="receipt-footer">
            <p>Gracias por su compra</p>
            <p>INVEX © 2025</p>
        </div>
        
        <!-- PRINT NOTE -->
        <div class="print-note">
            Presiona Ctrl+P para imprimir o guardar como PDF
        </div>
    </div>
</body>
</html>
    `
  }

  const handleDownloadReceipt = () => {
    if (cartItems.length === 0) return

    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
    const htmlContent = generateReceiptHTML(cartItems, total)
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `recibo-${new Date().getTime()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) return

    setIsProcessing(true)
    try {
      await onSaleComplete(cartItems)
      
      // Descargar recibo automáticamente
      setTimeout(() => {
        handleDownloadReceipt()
      }, 500)
      
      toast({
        title: "✅ Venta registrada",
        description: `${cartItems.length} artículos - Recibo descargado`,
      })
      
      setCartItems([])
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se registró",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  if (!mounted) return null

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="space-y-4">
          {/* HEADER */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-green-600 mb-1">Venta Rápida</h2>
            <p className="text-sm text-muted-foreground">Escanea productos para vender</p>
          </div>

          {/* INPUT SCANNER */}
          <div className={`p-4 border-2 border-green-500 rounded-lg sticky top-4 z-10 ${isDark ? 'bg-green-950/80 backdrop-blur' : 'bg-green-50/80 backdrop-blur'}`}>
            <Input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Escanea código..."
              autoFocus
              className="text-lg font-bold text-center border-0 bg-transparent text-green-700 dark:text-green-300 placeholder:text-green-400 focus:ring-0"
            />
          </div>

          {/* CARRITO */}
          {cartItems.length === 0 ? (
            <Alert className="border-dashed border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-sm ml-2">
                Acerca el lector para empezar
              </AlertDescription>
            </Alert>
          ) : (
            <div className={`rounded-xl overflow-hidden shadow-lg border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              {/* ITEMS */}
              <div className="max-h-96 overflow-y-auto space-y-1 p-2">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className={`p-3 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                      isDark ? 'hover:bg-gray-800 bg-gray-800/50' : 'hover:bg-gray-100 bg-gray-50'
                    }`}
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

              {/* TOTAL */}
              <div className={`p-4 border-t space-y-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">TOTAL:</span>
                  <span className="text-3xl font-black text-green-600">
                    ${total.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCompleteSale}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg font-bold py-6 rounded-lg transition-all shadow-lg"
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
                  
                  <Button
                    onClick={handleDownloadReceipt}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2 px-4"
                    title="Descargar recibo"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

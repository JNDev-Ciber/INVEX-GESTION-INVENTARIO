"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Download, 
  User, 
  Calendar,
  Package,
  Eye,
  ShoppingCart,
  RefreshCw,
  Search,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Printer
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer'
import { FacturaCompraPDF } from './factura-compra-pdf'
import type { Product } from "../types/inventory"
import { ProductFormForPurchase } from "./product-form-purchase"

interface FacturaCompraItem {
  id: string
  producto: Product
  cantidad: number
  costoUnitario: number
  precioVentaUnitario: number
  subtotal: number
}

interface DatosProveedor {
  nombre: string
  cuit: string
  direccion?: string
  telefono?: string
  email?: string
}

interface FacturaCompra {
  id: string
  numero: string
  fecha: string
  proveedor: DatosProveedor
  items: FacturaCompraItem[]
  subtotal: number
  iva: number
  total: number
  observaciones: string
}

interface Props {
  products?: Product[]
  onUpdateProductCost: (productId: string, newCost: number) => Promise<void>
  onUpdateProductPrice: (productId: string, newPrice: number) => Promise<void>
  onAddMovement: (productId: string, quantity: number, reason: string) => Promise<void>
  onCreateProduct: (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<Product>  // ✅ NUEVA FUNCIÓN
}

export default function FacturaCompraForm({ 
  products = [], 
  onUpdateProductCost,
  onUpdateProductPrice,
  onAddMovement,
  onCreateProduct  // ✅ NUEVA PROP
}: Props) {
  const { toast } = useToast()
  
  // Estados principales
  const [facturaActual, setFacturaActual] = useState<FacturaCompra>({
    id: '',
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: {
      nombre: '',
      cuit: '',
      direccion: '',
      telefono: '',
      email: ''
    },
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0,
    observaciones: ''
  })

  

  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)
  const [mostrarSelectorProducto, setMostrarSelectorProducto] = useState(false)
  const [mostrarCrearProducto, setMostrarCrearProducto] = useState(false)  // ✅ NUEVO ESTADO
  
  // Estados para agregar items
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null)
  const [nuevoItem, setNuevoItem] = useState({
    cantidad: '',
    costoUnitario: '',
    precioVentaUnitario: ''
  })

  const [porcentajeIva, setPorcentajeIva] = useState(21)
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generar número de factura automáticamente al cargar
  useEffect(() => {
    if (!facturaActual.numero) {
      const numeroGenerado = generarNumeroFactura()
      setFacturaActual(prev => ({
        ...prev,
        numero: numeroGenerado
      }))
    }
  }, [facturaActual.numero])

  // Filtrar productos por búsqueda - CON PROTECCIÓN
  const productosFiltrados = (products || []).filter(product =>
    product?.name?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    product?.code?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    product?.category?.toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  // Generar número de factura
  const generarNumeroFactura = () => {
    const fecha = new Date()
    const año = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    const hora = String(fecha.getHours()).padStart(2, '0')
    const minuto = String(fecha.getMinutes()).padStart(2, '0')
    const segundo = String(fecha.getSeconds()).padStart(2, '0')
    
    return `COMP-${año}${mes}${dia}-${hora}${minuto}${segundo}`
  }

  // Función para generar nuevo número
  const generarNuevoNumero = () => {
    const numeroGenerado = generarNumeroFactura()
    setFacturaActual(prev => ({
      ...prev,
      numero: numeroGenerado
    }))
    toast({
      title: "🔄 Número generado",
      description: `Nuevo número: ${numeroGenerado}`,
      duration: 2000
    })
  }

  // Calcular totales
  useEffect(() => {
    const subtotal = facturaActual.items.reduce((sum, item) => sum + item.subtotal, 0)
    const iva = (subtotal * porcentajeIva) / 100
    const total = subtotal + iva

    setFacturaActual(prev => ({
      ...prev,
      subtotal,
      iva,
      total
    }))
  }, [facturaActual.items, porcentajeIva])

  // Manejar cambios en campos numéricos
  const handleNumericChange = (value: string, field: 'cantidad' | 'costoUnitario' | 'precioVentaUnitario') => {
    if (value === '') {
      setNuevoItem(prev => ({ ...prev, [field]: '' }))
      return
    }
    
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setNuevoItem(prev => ({ ...prev, [field]: value }))
    }
  }

  // ✅ NUEVA FUNCIÓN: Crear producto rápido desde la factura
  const handleCrearProducto = async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      const nuevoProducto = await onCreateProduct(productData)
      setProductoSeleccionado(nuevoProducto)
      setNuevoItem({
        cantidad: '',
        costoUnitario: nuevoProducto.cost.toString(),
        precioVentaUnitario: nuevoProducto.price.toString()
      })
      setMostrarCrearProducto(false)
      setMostrarSelectorProducto(false)
      setBusquedaProducto('')
      
      toast({
        title: "✅ Producto creado y seleccionado",
        description: `${nuevoProducto.name} se creó correctamente y está listo para la factura`,
        duration: 3000
      })
    } catch (error) {
      toast({
        title: "❌ Error al crear producto",
        description: "No se pudo crear el producto",
        variant: "destructive"
      })
    }
  }

  // Seleccionar producto del modal
  const seleccionarProducto = (product: Product) => {
    setProductoSeleccionado(product)
    setNuevoItem({
      cantidad: '',
      costoUnitario: product.cost.toString(),
      precioVentaUnitario: product.price.toString()
    })
    setMostrarSelectorProducto(false)
    setBusquedaProducto('')
    
    toast({
      title: "✅ Producto seleccionado",
      description: `${product.name} agregado para compra`,
      duration: 2000
    })
  }

  // Agregar item a la factura
  const agregarItem = () => {
    if (!productoSeleccionado) {
      toast({
        title: "❌ Error",
        description: "Selecciona un producto primero",
        variant: "destructive"
      })
      return
    }

    const cantidad = parseFloat(nuevoItem.cantidad) || 0
    const costoUnitario = parseFloat(nuevoItem.costoUnitario) || 0
    const precioVentaUnitario = parseFloat(nuevoItem.precioVentaUnitario) || 0
    
    if (cantidad <= 0 || costoUnitario <= 0 || precioVentaUnitario <= 0) {
      toast({
        title: "❌ Error",
        description: "La cantidad, costo y precio de venta deben ser mayores a 0",
        variant: "destructive"
      })
      return
    }

    const item: FacturaCompraItem = {
      id: Date.now().toString(),
      producto: productoSeleccionado,
      cantidad: cantidad,
      costoUnitario: costoUnitario,
      precioVentaUnitario: precioVentaUnitario,
      subtotal: cantidad * costoUnitario
    }

    setFacturaActual(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))

    // Limpiar selección
    setProductoSeleccionado(null)
    setNuevoItem({
      cantidad: '',
      costoUnitario: '',
      precioVentaUnitario: ''
    })

    toast({
      title: "✅ Producto agregado",
      description: `${item.producto.name} agregado a la factura de compra`,
      duration: 2000
    })
  }

  // Eliminar item
  const eliminarItem = (itemId: string) => {
    setFacturaActual(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
    
    toast({
      title: "🗑️ Producto eliminado",
      description: "El producto fue removido de la factura",
      duration: 2000
    })
  }
  const procesarFacturaCompra = async () => {
    if (!facturaActual.proveedor.nombre.trim()) {
      toast({
        title: "❌ Error",
        description: "El nombre del proveedor es obligatorio",
        variant: "destructive"
      })
      return
    }
  
    if (facturaActual.items.length === 0) {
      toast({
        title: "❌ Error", 
        description: "Agrega al menos un producto a la factura",
        variant: "destructive"
      })
      return
    }
  
    try {
      // ✅ ACTUALIZAR COSTOS, PRECIOS Y REGISTRAR MOVIMIENTOS DE ENTRADA
      for (const item of facturaActual.items) {
        // 1. Actualizar costo del producto
        await onUpdateProductCost(item.producto.id, item.costoUnitario)
        
        // 2. Actualizar precio de venta del producto
        await onUpdateProductPrice(item.producto.id, item.precioVentaUnitario)
        
        // 3. Registrar movimiento de entrada de stock (SUMA AL INVENTARIO)
        await onAddMovement(
          item.producto.id, 
          item.cantidad, 
          `Compra - Factura ${facturaActual.numero} - Proveedor: ${facturaActual.proveedor.nombre}`
        )
      }
  
      const factura: FacturaCompra = {
        ...facturaActual,
        id: facturaActual.id || Date.now().toString()
      }
  
      setMostrarVistaPrevia(true)
  
      toast({
        title: "📦 Factura de compra procesada",
        description: `Factura ${factura.numero} registrada, stock agregado y precios actualizados`,
        duration: 4000
      })
  
    } catch (error) {
      toast({
        title: "❌ Error al procesar",
        description: "No se pudieron actualizar los datos del producto",
        variant: "destructive"
      })
    }
  }
  

  // Vista previa de factura de compra
  const VistaPrevia = ({ factura }: { factura: FacturaCompra }) => (
    <div className="max-w-4xl mx-auto p-6 bg-white text-black">
      {/* Header de la factura */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-600">ELECTROLUXSTORE</h1>
              <p className="text-sm text-gray-600">Sistema de Gestión de Inventarios</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Dirección: Calle Hector Varas 670</p>
            <p>Teléfono: +54 9 3573 41-4552</p>
            <p>Email: electrolux.vdr@gmail.com</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-green-600 mb-2">FACTURA DE COMPRA</h2>
          <div className="text-sm space-y-1">
            <div><strong>Número:</strong> {factura.numero}</div>
            <div><strong>Fecha:</strong> {new Date(factura.fecha).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Datos del proveedor */}
      <div className="mb-8 p-4 bg-green-50 rounded-lg">
        <h3 className="font-bold text-green-600 mb-3">DATOS DEL PROVEEDOR</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Nombre:</strong> {factura.proveedor.nombre}</p>
            <p><strong>CUIT/DNI:</strong> {factura.proveedor.cuit}</p>
            <p><strong>Dirección:</strong> {factura.proveedor.direccion}</p>
          </div>
          <div>
            <p><strong>Teléfono:</strong> {factura.proveedor.telefono}</p>
            <p><strong>Email:</strong> {factura.proveedor.email}</p>
          </div>
        </div>
      </div>

      {/* Items de la factura */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-gray-300 p-3 text-left text-green-600">Código</th>
              <th className="border border-gray-300 p-3 text-left text-green-600">Producto</th>
              <th className="border border-gray-300 p-3 text-center text-green-600">Cantidad</th>
              <th className="border border-gray-300 p-3 text-right text-green-600">Costo Unit.</th>
              <th className="border border-gray-300 p-3 text-right text-green-600">Precio Venta</th>
              <th className="border border-gray-300 p-3 text-right text-green-600">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.items.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-3 text-sm">{item.producto.code}</td>
                <td className="border border-gray-300 p-3">{item.producto.name}</td>
                <td className="border border-gray-300 p-3 text-center">{item.cantidad}</td>
                <td className="border border-gray-300 p-3 text-right">${item.costoUnitario.toLocaleString()}</td>
                <td className="border border-gray-300 p-3 text-right">${item.precioVentaUnitario.toLocaleString()}</td>
                <td className="border border-gray-300 p-3 text-right font-medium">${item.subtotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${factura.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>IVA ({porcentajeIva}%):</span>
            <span>${factura.iva.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between py-3 text-lg font-bold text-green-600">
            <span>TOTAL:</span>
            <span>${factura.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      {factura.observaciones && (
        <div className="mb-8">
          <h3 className="font-bold text-green-600 mb-2">OBSERVACIONES</h3>
          <p className="text-sm bg-gray-50 p-3 rounded">{factura.observaciones}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>ELECTROLUXSTORE - Sistema de Gestión de Inventarios</p>
        <p>Factura de compra generada electrónicamente</p>
      </div>
    </div>
  )

  // Mostrar mensaje si no hay productos
  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Sistema de Facturas de Compra
          </h2>
          <p className="text-muted-foreground">Registra compras a proveedores y actualiza costos/precios automáticamente</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay productos disponibles</h3>
            <p className="text-muted-foreground text-center">
              Primero agrega productos a tu inventario para poder crear facturas de compra.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div>
        <h2 className="text-2xl font-bold text-green-600 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Sistema de Facturas de Compra
        </h2>
        <p className="text-muted-foreground">Registra compras a proveedores y actualiza costos/precios automáticamente</p>
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información de la Factura de Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="numero">Número de Factura</Label>
              <div className="flex gap-2">
                <Input
                  id="numero"
                  value={facturaActual.numero}
                  onChange={(e) => setFacturaActual(prev => ({ ...prev, numero: e.target.value }))}
                  placeholder="Se genera automáticamente"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generarNuevoNumero}
                  className="px-3"
                  title="Generar nuevo número"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={facturaActual.fecha}
                onChange={(e) => setFacturaActual(prev => ({ ...prev, fecha: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="iva">IVA (%)</Label>
              <Select value={porcentajeIva.toString()} onValueChange={(value) => setPorcentajeIva(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Exento)</SelectItem>
                  <SelectItem value="10.5">10.5%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="27">27%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del proveedor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Datos del Proveedor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proveedorNombre">Nombre / Razón Social *</Label>
              <Input
                id="proveedorNombre"
                value={facturaActual.proveedor.nombre}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  proveedor: { ...prev.proveedor, nombre: e.target.value }
                }))}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div>
              <Label htmlFor="proveedorCuit">CUIT/DNI</Label>
              <Input
                id="proveedorCuit"
                value={facturaActual.proveedor.cuit}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  proveedor: { ...prev.proveedor, cuit: e.target.value }
                }))}
                placeholder="CUIT del proveedor"
              />
            </div>
            <div>
              <Label htmlFor="proveedorDireccion">Dirección (Opcional)</Label>
              <Input
                id="proveedorDireccion"
                value={facturaActual.proveedor.direccion}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  proveedor: { ...prev.proveedor, direccion: e.target.value }
                }))}
                placeholder="Dirección del proveedor"
              />
            </div>
            <div>
              <Label htmlFor="proveedorTelefono">Teléfono (Opcional)</Label>
              <Input
                id="proveedorTelefono"
                value={facturaActual.proveedor.telefono}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  proveedor: { ...prev.proveedor, telefono: e.target.value }
                }))}
                placeholder="Teléfono del proveedor"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="proveedorEmail">Email (Opcional)</Label>
              <Input
                id="proveedorEmail"
                type="email"
                value={facturaActual.proveedor.email}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  proveedor: { ...prev.proveedor, email: e.target.value }
                }))}
                placeholder="email@proveedor.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agregar productos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Agregar Productos Comprados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Producto seleccionado */}
          {productoSeleccionado ? (
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-green-700">{productoSeleccionado.name}</h4>
                  <p className="text-sm text-green-600">Código: {productoSeleccionado.code}</p>
                  <Badge variant="outline" className="mt-1">{productoSeleccionado.category}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductoSeleccionado(null)}
                >
                  Cambiar
                </Button>
              </div>
              
              {/* Grid con 4 columnas - AGREGADO PRECIO DE VENTA */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="cantidad">Cantidad Comprada *</Label>
                  <Input
                    id="cantidad"
                    type="text"
                    inputMode="decimal"
                    value={nuevoItem.cantidad}
                    onChange={(e) => handleNumericChange(e.target.value, 'cantidad')}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="costoUnitario">Costo Unitario *</Label>
                  <Input
                    id="costoUnitario"
                    type="text"
                    inputMode="decimal"
                    value={nuevoItem.costoUnitario}
                    onChange={(e) => handleNumericChange(e.target.value, 'costoUnitario')}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="precioVentaUnitario">Precio de Venta *</Label>
                  <Input
                    id="precioVentaUnitario"
                    type="text"
                    inputMode="decimal"
                    value={nuevoItem.precioVentaUnitario}
                    onChange={(e) => handleNumericChange(e.target.value, 'precioVentaUnitario')}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={agregarItem}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
              
              {/* Mostrar información actualizada */}
              {nuevoItem.cantidad && nuevoItem.costoUnitario && nuevoItem.precioVentaUnitario && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal compra:</span>
                      <span className="font-medium text-green-600">
                        ${((parseFloat(nuevoItem.cantidad) || 0) * (parseFloat(nuevoItem.costoUnitario) || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Margen estimado:</span>
                      <span className="font-medium text-blue-600">
                        {((parseFloat(nuevoItem.precioVentaUnitario) - parseFloat(nuevoItem.costoUnitario)) / parseFloat(nuevoItem.precioVentaUnitario) * 100 || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Costo actual en sistema:</span>
                      <span>${productoSeleccionado.cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio actual en sistema:</span>
                      <span>${productoSeleccionado.price.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Indicadores de cambios */}
                  <div className="mt-2 space-y-1">
                    {parseFloat(nuevoItem.costoUnitario) !== productoSeleccionado.cost && (
                      <div className="p-2 bg-yellow-50 rounded text-xs">
                        <div className="flex items-center gap-1 text-yellow-700">
                          <TrendingUp className="h-3 w-3" />
                          <span>Costo se actualizará: ${productoSeleccionado.cost.toLocaleString()} → ${parseFloat(nuevoItem.costoUnitario).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {parseFloat(nuevoItem.precioVentaUnitario) !== productoSeleccionado.price && (
                      <div className="p-2 bg-blue-50 rounded text-xs">
                        <div className="flex items-center gap-1 text-blue-700">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>Precio se actualizará: ${productoSeleccionado.price.toLocaleString()} → ${parseFloat(nuevoItem.precioVentaUnitario).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Selecciona un producto de tu inventario</p>
              <Button
                onClick={() => setMostrarSelectorProducto(true)}
                variant="outline"
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar Producto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de productos agregados */}
      {facturaActual.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos en la Factura de Compra ({facturaActual.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Lista de items */}
              <div className="space-y-2">
                {facturaActual.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{item.producto.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Código: {item.producto.code} | Cantidad: {item.cantidad} | Costo: ${item.costoUnitario.toLocaleString()} | Precio Venta: ${item.precioVentaUnitario.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{item.producto.category}</Badge>
                        {(item.costoUnitario !== item.producto.cost || item.precioVentaUnitario !== item.producto.price) && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Precios actualizados
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-green-600">${item.subtotal.toLocaleString()}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totales */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${facturaActual.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({porcentajeIva}%):</span>
                    <span>${facturaActual.iva.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-green-600">
                    <span>TOTAL:</span>
                    <span>${facturaActual.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={facturaActual.observaciones}
            onChange={(e) => setFacturaActual(prev => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Observaciones adicionales sobre la compra (opcional)"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Botón para procesar */}
      <div className="flex justify-center">
        <Button
          onClick={procesarFacturaCompra}
          disabled={facturaActual.items.length === 0 || !facturaActual.proveedor.nombre.trim()}
          className="bg-green-600 hover:bg-green-700 px-8 py-3"
          size="lg"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          Procesar Factura de Compra
        </Button>
      </div>

{/* ✅ MODAL SELECTOR DE PRODUCTOS MEJORADO */}
<Dialog open={mostrarSelectorProducto} onOpenChange={setMostrarSelectorProducto}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-green-600 flex items-center justify-between">
        <span>Seleccionar Producto del Inventario</span>
        {/* ✅ MENSAJE PERMANENTE ARRIBA A LA DERECHA */}
        <div className="flex items-center gap-2 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <Plus className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">
              ¿No encuentra su producto?
            </span>
            <Button
              onClick={() => setMostrarCrearProducto(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
            >
              Crear Producto
            </Button>
          </div>
        </div>
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, código o categoría..."
          value={busquedaProducto}
          onChange={(e) => setBusquedaProducto(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ✅ MENSAJE ADICIONAL CUANDO NO HAY RESULTADOS */}
      {busquedaProducto && productosFiltrados.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
          <Package className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            No se encontró "{busquedaProducto}"
          </h3>
          <p className="text-green-600 mb-4">
            El producto no existe en su inventario
          </p>
          <Button
            onClick={() => setMostrarCrearProducto(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Producto "{busquedaProducto}"
          </Button>
        </div>
      )}

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {productosFiltrados.map((product) => (
          <div
            key={product.id}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => seleccionarProducto(product)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-gray-500">Código: {product.code}</p>
              </div>
              <Badge variant="outline" className="text-xs">{product.category}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Costo actual:</span>
                <p className="font-medium">${product.cost.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Precio actual:</span>
                <p className="font-medium">${product.price.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Stock:</span>
                <p className="font-medium">{product.quantity} unidades</p>
              </div>
              <div>
                <span className="text-gray-500">Margen:</span>
                <p className="font-medium">{((product.price - product.cost) / product.price * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            {product.description && (
              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{product.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay búsqueda */}
      {productosFiltrados.length === 0 && !busquedaProducto && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">Escribe para buscar productos en tu inventario</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-700 text-sm">
              💡 <strong>Tip:</strong> Si no encuentra el producto que necesita, puede crearlo directamente desde aquí usando el botón "Crear Producto" de arriba.
            </p>
          </div>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>


      {/* ✅ NUEVO MODAL: CREAR PRODUCTO RÁPIDO */}
{/* ✅ MODAL CORREGIDO CON DialogTitle */}
<Dialog open={mostrarCrearProducto} onOpenChange={setMostrarCrearProducto}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-green-600">Crear Nuevo Producto</DialogTitle>
    </DialogHeader>
    <ProductFormForPurchase
      onSubmit={handleCrearProducto}
      initialData={{ 
        name: busquedaProducto || "",
      }}
      onCancel={() => setMostrarCrearProducto(false)}
      existingCodes={products.map(p => p.code)}
      products={products}
    />
  </DialogContent>
</Dialog>



      {/* Modal de vista previa */}
      <Dialog open={mostrarVistaPrevia} onOpenChange={setMostrarVistaPrevia}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-green-600">Factura de Compra Procesada</span>
              <div className="flex gap-2">
                {/* Botón de descarga PDF */}
                <PDFDownloadLink
                  document={<FacturaCompraPDF factura={facturaActual} porcentajeIva={porcentajeIva} />}
                  fileName={`factura-compra-${facturaActual.numero}.pdf`}
                >
                  {({ loading }: { loading: boolean }) => (
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {loading ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>

                {/* Botón de impresión */}
                <BlobProvider document={<FacturaCompraPDF factura={facturaActual} porcentajeIva={porcentajeIva} />}>
                  {({ url, loading }: { url: string | null; loading: boolean }) => (
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={loading || !url}
                      onClick={() => url && window.open(url, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      {loading ? 'Generando...' : 'Imprimir'}
                    </Button>
                  )}
                </BlobProvider>
              </div>
            </DialogTitle>
          </DialogHeader>
          <VistaPrevia factura={facturaActual} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

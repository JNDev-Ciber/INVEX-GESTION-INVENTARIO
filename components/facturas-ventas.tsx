"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import  FacturaVentaPDF  from './factura-venta-pdf'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer'
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Download,
  Printer, 
  User, 
  Calendar,
  Package,
  Eye,
  ShoppingCart,
  RefreshCw,
  Search,
  Building2,
  DollarSign,
  TrendingDown,
  Minus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import type { Product } from "../types/inventory"

interface FacturaVentaItem {
  id: string
  producto: Product
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface DatosCliente {
  nombre: string
  cuit: string
  direccion?: string
  telefono?: string
  email?: string
}

interface FacturaVenta {
  id: string
  numero: string
  fecha: string
  cliente: DatosCliente
  items: FacturaVentaItem[]
  subtotal: number
  iva: number
  total: number
  observaciones: string
}

interface Props {
  products?: Product[]
  onSaleProduct: (productId: string, quantity: number, reason: string) => Promise<void>
}

export default function FacturaVentaForm({ 
  products = [], 
  onSaleProduct 
}: Props) {
  const { toast } = useToast()
  
  // Estados principales
  const [facturaActual, setFacturaActual] = useState<FacturaVenta>({
    id: '',
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente: {
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
  
  // Estados para agregar items
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null)
  const [nuevoItem, setNuevoItem] = useState({
    cantidad: '',
    precioUnitario: ''
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

  // ✅ Filtrar productos por búsqueda - CON PROTECCIÓN
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
    
    return `VENTA-${año}${mes}${dia}-${hora}${minuto}${segundo}`
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
  const handleNumericChange = (value: string, field: 'cantidad' | 'precioUnitario') => {
    if (value === '') {
      setNuevoItem(prev => ({ ...prev, [field]: '' }))
      return
    }
    
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setNuevoItem(prev => ({ ...prev, [field]: value }))
    }
  }

  // Seleccionar producto del modal
  const seleccionarProducto = (product: Product) => {
    setProductoSeleccionado(product)
    setNuevoItem({
      cantidad: '',
      precioUnitario: product.price.toString()
    })
    setMostrarSelectorProducto(false)
    setBusquedaProducto('')
    
    toast({
      title: "✅ Producto seleccionado",
      description: `${product.name} agregado para venta`,
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
    const precioUnitario = parseFloat(nuevoItem.precioUnitario) || 0
    
    if (cantidad <= 0 || precioUnitario <= 0) {
      toast({
        title: "❌ Error",
        description: "La cantidad y el precio deben ser mayores a 0",
        variant: "destructive"
      })
      return
    }

    // ✅ VALIDAR STOCK DISPONIBLE
    if (cantidad > productoSeleccionado.quantity) {
      toast({
        title: "❌ Stock insuficiente",
        description: `Solo hay ${productoSeleccionado.quantity} unidades disponibles`,
        variant: "destructive"
      })
      return
    }

    const item: FacturaVentaItem = {
      id: Date.now().toString(),
      producto: productoSeleccionado,
      cantidad: cantidad,
      precioUnitario: precioUnitario,
      subtotal: cantidad * precioUnitario
    }

    setFacturaActual(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))

    // Limpiar selección
    setProductoSeleccionado(null)
    setNuevoItem({
      cantidad: '',
      precioUnitario: ''
    })

    toast({
      title: "✅ Producto agregado",
      description: `${item.producto.name} agregado a la factura de venta`,
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

  const procesarFacturaVenta = async () => {
    if (!facturaActual.cliente.nombre.trim()) {
      toast({
        title: "❌ Error",
        description: "El nombre del cliente es obligatorio",
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
      // ✅ DESCONTAR STOCK Y REGISTRAR MOVIMIENTOS DE SALIDA
      for (const item of facturaActual.items) {
        await onSaleProduct(
          item.producto.id, 
          item.cantidad, 
          `Venta - Factura ${facturaActual.numero}`
        )
      }
  
      const factura: FacturaVenta = {
        ...facturaActual,
        id: facturaActual.id || Date.now().toString()
      }
  
      setMostrarVistaPrevia(true)
  
      toast({
        title: "💰 Factura de venta procesada",
        description: `Factura ${factura.numero} registrada y stock actualizado`,
        duration: 3000
      })
  
    } catch (error) {
      toast({
        title: "❌ Error al procesar",
        description: "No se pudo procesar la venta",
        variant: "destructive"
      })
    }
  }
  

  // Vista previa de factura de venta
  const VistaPrevia = ({ factura }: { factura: FacturaVenta }) => (
    <div className="max-w-4xl mx-auto p-6 bg-white text-black">
      {/* Header de la factura */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">ELECTROLUXSTORE</h1>
              <p className="text-sm text-gray-600">Sistema de Gestión de Inventarios</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Dirección: Calle Hector Varas 670</p>
            <p>Teléfono: +54 9 3573 41-4552</p>
            <p>Email: emi-carrerra16@hotmail.com</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">FACTURA DE VENTA</h2>
          <div className="text-sm space-y-1">
            <div><strong>Número:</strong> {factura.numero}</div>
            <div><strong>Fecha:</strong> {new Date(factura.fecha).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-600 mb-3">DATOS DEL CLIENTE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Nombre:</strong> {factura.cliente.nombre}</p>
            <p><strong>CUIT/DNI:</strong> {factura.cliente.cuit}</p>
            <p><strong>Dirección:</strong> {factura.cliente.direccion}</p>
          </div>
          <div>
            <p><strong>Teléfono:</strong> {factura.cliente.telefono}</p>
            <p><strong>Email:</strong> {factura.cliente.email}</p>
          </div>
        </div>
      </div>

      {/* Items de la factura */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-300 p-3 text-left text-blue-600">Código</th>
              <th className="border border-gray-300 p-3 text-left text-blue-600">Producto</th>
              <th className="border border-gray-300 p-3 text-center text-blue-600">Cantidad</th>
              <th className="border border-gray-300 p-3 text-right text-blue-600">Precio Unit.</th>
              <th className="border border-gray-300 p-3 text-right text-blue-600">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.items.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-3 text-sm">{item.producto.code}</td>
                <td className="border border-gray-300 p-3">{item.producto.name}</td>
                <td className="border border-gray-300 p-3 text-center">{item.cantidad}</td>
                <td className="border border-gray-300 p-3 text-right">${item.precioUnitario.toLocaleString()}</td>
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
          <div className="flex justify-between py-3 text-lg font-bold text-blue-600">
            <span>TOTAL:</span>
            <span>${factura.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

            {/* Footer */}
      <div className="border-t pt-4 flex justify-between items-start">
        <div className="text-xs text-gray-500 max-w-md">
          <h4 className="font-bold mb-2 text-gray-700">TÉRMINOS DE GARANTÍA</h4>
          <p className="mb-1">• La garantía cubre defectos de fabricación y materiales.</p>
          <p className="mb-1">• La garantía no cubre daños causados por uso indebido, negligencia o accidentes.</p>
          <p className="mb-1">• Para hacer efectiva la garantía, el cliente debe presentar este recibo y el producto defectuoso.</p>
          <p>• El cliente debe devolver el producto defectuoso con su caja y accesorios en condiciones admisibles.</p>
        </div>
        <div className="text-center text-xs text-gray-500">
          <p>ELECTROLUXSTORE - Sistema de Gestión de Inventarios</p>
          <p>Factura de venta generada electrónicamente</p>
        </div>
      </div>
      </div>
  )

  // ✅ Mostrar mensaje si no hay productos
  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Sistema de Facturas de Venta
          </h2>
          <p className="text-muted-foreground">Genera facturas de venta y controla el stock automáticamente</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay productos disponibles</h3>
            <p className="text-muted-foreground text-center">
              Primero agrega productos a tu inventario para poder crear facturas de venta.
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
        <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Sistema de Facturas de Venta
        </h2>
        <p className="text-muted-foreground">Genera facturas de venta y descuenta stock automáticamente</p>
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información de la Factura de Venta
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

      {/* Datos del cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600 flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clienteNombre">Nombre / Razón Social *</Label>
              <Input
                id="clienteNombre"
                value={facturaActual.cliente.nombre}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  cliente: { ...prev.cliente, nombre: e.target.value }
                }))}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <Label htmlFor="clienteCuit">CUIT/DNI *</Label>
              <Input
                id="clienteCuit"
                value={facturaActual.cliente.cuit}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  cliente: { ...prev.cliente, cuit: e.target.value }
                }))}
                placeholder="CUIT del cliente"
              />
            </div>
            <div>
              <Label htmlFor="clienteDireccion">Dirección (Opcional)</Label>
              <Input
                id="clienteDireccion"
                value={facturaActual.cliente.direccion}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  cliente: { ...prev.cliente, direccion: e.target.value }
                }))}
                placeholder="Dirección del cliente"
              />
            </div>
            <div>
              <Label htmlFor="clienteTelefono">Teléfono (Opcional)</Label>
              <Input
                id="clienteTelefono"
                value={facturaActual.cliente.telefono}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  cliente: { ...prev.cliente, telefono: e.target.value }
                }))}
                placeholder="Teléfono del cliente"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="clienteEmail">Email (Opcional)</Label>
              <Input
                id="clienteEmail"
                type="email"
                value={facturaActual.cliente.email}
                onChange={(e) => setFacturaActual(prev => ({
                  ...prev,
                  cliente: { ...prev.cliente, email: e.target.value }
                }))}
                placeholder="email@cliente.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agregar productos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Agregar Productos a Vender
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Producto seleccionado */}
          {productoSeleccionado ? (
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-blue-700">{productoSeleccionado.name}</h4>
                  <p className="text-sm text-blue-600">Código: {productoSeleccionado.code}</p>
                  <Badge variant="outline" className="mt-1">{productoSeleccionado.category}</Badge>
                  <p className="text-sm text-blue-600 mt-1">
                    <strong>Stock disponible:</strong> {productoSeleccionado.quantity} unidades
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductoSeleccionado(null)}
                >
                  Cambiar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cantidad">Cantidad a Vender *</Label>
                  <Input
                    id="cantidad"
                    type="text"
                    inputMode="decimal"
                    value={nuevoItem.cantidad}
                    onChange={(e) => handleNumericChange(e.target.value, 'cantidad')}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {productoSeleccionado.quantity} unidades
                  </p>
                </div>
                <div>
                  <Label htmlFor="precioUnitario">Precio Unitario *</Label>
                  <Input
                    id="precioUnitario"
                    type="text"
                    inputMode="decimal"
                    value={nuevoItem.precioUnitario}
                    onChange={(e) => handleNumericChange(e.target.value, 'precioUnitario')}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={agregarItem}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
              
              {/* Mostrar subtotal del producto actual */}
              {nuevoItem.cantidad && nuevoItem.precioUnitario && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-medium text-blue-600">
                      ${((parseFloat(nuevoItem.cantidad) || 0) * (parseFloat(nuevoItem.precioUnitario) || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>Stock después de venta:</span>
                    <span>{productoSeleccionado.quantity - (parseFloat(nuevoItem.cantidad) || 0)} unidades</span>
                  </div>
                  {(parseFloat(nuevoItem.cantidad) || 0) > productoSeleccionado.quantity && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                      <div className="flex items-center gap-1 text-red-700">
                        <Minus className="h-3 w-3" />
                        <span>⚠️ Cantidad excede el stock disponible</span>
                      </div>
                    </div>
                  )}
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
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
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
            <CardTitle className="text-blue-600 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos en la Factura de Venta ({facturaActual.items.length})
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
                        Código: {item.producto.code} | Cantidad: {item.cantidad} | Precio: ${item.precioUnitario.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{item.producto.category}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Stock: -{item.cantidad}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600">${item.subtotal.toLocaleString()}</span>
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
              <div className="bg-blue-50 p-4 rounded-lg">
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
                  <div className="flex justify-between text-lg font-bold text-blue-600">
                    <span>TOTAL:</span>
                    <span>${facturaActual.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón para procesar */}
      <div className="flex justify-center">
        <Button
          onClick={procesarFacturaVenta}
          disabled={facturaActual.items.length === 0 || !facturaActual.cliente.nombre.trim()}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          size="lg"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          Procesar Factura de Venta
        </Button>
      </div>

      {/* Modal selector de productos */}
      <Dialog open={mostrarSelectorProducto} onOpenChange={setMostrarSelectorProducto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Seleccionar Producto del Inventario</DialogTitle>
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

            {/* Lista de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {productosFiltrados.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    product.quantity > 0 
                      ? 'hover:bg-gray-50 border-gray-200' 
                      : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => product.quantity > 0 && seleccionarProducto(product)}
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
                      <span className="text-gray-500">Precio:</span>
                      <p className="font-medium">${product.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <p className={`font-medium ${
                        product.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.quantity} unidades
                      </p>
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{product.description}</p>
                  )}

                  {product.quantity === 0 && (
                    <div className="mt-2 text-xs text-red-600 font-medium">
                      ⚠️ Sin stock disponible
                    </div>
                  )}
                </div>
              ))}
            </div>

            {productosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de vista previa */}
      <Dialog open={mostrarVistaPrevia} onOpenChange={setMostrarVistaPrevia}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <span className="text-blue-600">Factura de Venta Procesada</span>
        <div className="flex gap-2">
          {/* Botón de descarga PDF */}
          <PDFDownloadLink
            document={<FacturaVentaPDF factura={facturaActual} porcentajeIva={porcentajeIva} />}
            fileName={`factura-venta-${facturaActual.numero}.pdf`}
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
          <BlobProvider document={<FacturaVentaPDF factura={facturaActual} porcentajeIva={porcentajeIva} />}>
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

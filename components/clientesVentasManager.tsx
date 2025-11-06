"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  AlertCircle,
  Check,
  DollarSign,
  Plus,
  User,
  X,
} from "lucide-react";
import type { ClienteVenta, VentaFiado, Product } from "../types/inventory";

interface ClientesVentasManagerProps {
  clientes: ClienteVenta[];
  ventasFiado: VentaFiado[];
  products: Product[];
  onAddCliente?: (nombre: string, cuit: string, telefono: string) => Promise<boolean>;
  onAddVentaFiado: (clienteId: number, productos: any[]) => Promise<{ success: boolean; ventaId: any; total: number }>;
  onMarcarPagados: (detalleIds: number[], ventaId: number) => Promise<boolean>;
}

export function ClientesVentasManager({
  clientes,
  ventasFiado,
  products,
  onAddCliente,
  onAddVentaFiado,
  onMarcarPagados,
}: ClientesVentasManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDeuda, setFilterDeuda] = useState<"todos" | "debe" | "pagado">("todos");
  const [selectedCliente, setSelectedCliente] = useState<ClienteVenta | null>(null);
  const [showAddClienteForm, setShowAddClienteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagoState, setPagoState] = useState<{ [detalleId: number]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"pagar" | "historial">("pagar");
  
  // Formulario nueva venta
  const [productosVenta, setProductosVenta] = useState<Array<{ productoId: string; cantidad: number }>>([]);
  
  // Formulario agregar cliente
  const [formCliente, setFormCliente] = useState({ nombre: "", cuit: "", telefono: "" });

  const filteredClientes = clientes
    .filter((c) => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.cuit?.includes(searchTerm))
    .filter((c) => {
      if (filterDeuda === "debe") return c.saldoPendiente > 0;
      if (filterDeuda === "pagado") return c.saldoPendiente === 0;
      return true;
    });

  const clienteVentasAbiertas = (clienteId: number) =>
    ventasFiado.filter((v) => v.clienteId === clienteId && v.saldoPendiente > 0);

  const clienteHistorialCompleto = (clienteId: number) =>
    ventasFiado.filter((v) => v.clienteId === clienteId);

  const handleAddCliente = async () => {
    if (!formCliente.nombre || !formCliente.cuit) return;
    if (!onAddCliente) return;
    setIsLoading(true);
    try {
      await onAddCliente(formCliente.nombre, formCliente.cuit, formCliente.telefono);
      setShowAddClienteForm(false);
      setFormCliente({ nombre: "", cuit: "", telefono: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrarVenta = async () => {
    if (!selectedCliente || productosVenta.length === 0) return;
    const productosValidos = productosVenta.every((p) => p.productoId && p.cantidad > 0);
    if (!productosValidos) {
      alert("⚠️ Todos los productos deben estar seleccionados");
      return;
    }
    setIsLoading(true);
    try {
      await onAddVentaFiado(selectedCliente.id, productosVenta);
      setProductosVenta([]);
      setActiveTab("pagar");
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarcarPagados = async (ventaId: number) => {
    const detallesSeleccionados = Object.entries(pagoState)
      .filter(([_, pagado]) => pagado)
      .map(([detalleId]) => parseInt(detalleId));
    if (detallesSeleccionados.length === 0) {
      alert("⚠️ Selecciona al menos un producto");
      return;
    }
    setIsLoading(true);
    try {
      await onMarcarPagados(detallesSeleccionados, ventaId);
      setPagoState({});
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // VISTA CON CLIENTE SELECCIONADO
  if (selectedCliente) {
    const ventasAb = clienteVentasAbiertas(selectedCliente.id);
    const todasVentas = clienteHistorialCompleto(selectedCliente.id);
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h2 className="text-2xl font-bold">{selectedCliente.nombre}</h2>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCliente(null)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Contenido principal: 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* COLUMNA IZQUIERDA: Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Info */}
            <Card className="p-3 bg-blue-50">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-semibold text-sm">{selectedCliente.telefono || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-2">CUIT</p>
              <p className="font-semibold text-sm">{selectedCliente.cuit}</p>
            </Card>

            {/* Deuda */}
            {selectedCliente.saldoPendiente > 0 ? (
              <Alert className="bg-red-50 border-red-300">
                <DollarSign className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  <div className="text-xs font-medium">DEBE</div>
                  <div className="text-xl font-bold">${selectedCliente.saldoPendiente.toLocaleString()}</div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  <div className="text-xs font-medium">AL DÍA</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Nueva Venta */}
            <Button onClick={() => { setProductosVenta([{ productoId: "", cantidad: 1 }]); setActiveTab("pagar"); }} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>

          {/* COLUMNA DERECHA: Tabs */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <Button
                variant={activeTab === "pagar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("pagar")}
                className="border-b-2 rounded-none"
              >
                A Pagar ({ventasAb.length})
              </Button>
              <Button
                variant={activeTab === "historial" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("historial")}
                className="border-b-2 rounded-none"
              >
                📋 Historial ({todasVentas.length})
              </Button>
            </div>

            {/* TAB: A PAGAR */}
            {activeTab === "pagar" && (
              <div className="space-y-3">
                {/* Si hay formulario abierto */}
                {productosVenta.length > 0 && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold mb-3">Agregar Productos</h4>
                    <div className="space-y-2 mb-3">
                      {productosVenta.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <select
                            value={item.productoId}
                            onChange={(e) => {
                              const newItems = [...productosVenta];
                              newItems[idx].productoId = e.target.value;
                              setProductosVenta(newItems);
                            }}
                            className="flex-1 border rounded p-2 text-sm"
                          >
                            <option value="">Seleccionar producto...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.quantity})
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => {
                              const newItems = [...productosVenta];
                              newItems[idx].cantidad = parseInt(e.target.value) || 1;
                              setProductosVenta(newItems);
                            }}
                            className="w-20 text-center"
                            placeholder="0"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setProductosVenta(productosVenta.filter((_, i) => i !== idx))}
                          >
                            X
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductosVenta([...productosVenta, { productoId: "", cantidad: 1 }])}
                        className="flex-1"
                      >
                        + Producto
                      </Button>
                      <Button
                        onClick={handleRegistrarVenta}
                        disabled={productosVenta.some((p) => !p.productoId || p.cantidad <= 0) || isLoading}
                        className="flex-1"
                      >
                        Guardar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setProductosVenta([])}>
                        Cerrar
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Productos a pagar */}
                {ventasAb.length > 0 ? (
                  <div className="space-y-3">
                    {ventasAb.map((venta) => (
                      <Card key={venta.id} className="p-3">
                        <div className="flex justify-between mb-2 text-xs text-muted-foreground">
                          <span>{new Date(venta.fecha).toLocaleDateString('es-AR')}</span>
                          <span className="font-bold text-red-600">${venta.saldoPendiente.toLocaleString()}</span>
                        </div>
                        <div className="space-y-1">
                          {venta.detalles?.map((d) => (
                            <div
                              key={d.id}
                              className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer ${
                                pagoState[d.id]
                                  ? "bg-green-100 border border-green-300"
                                  : d.pagado
                                  ? "bg-gray-100 opacity-60"
                                  : "hover:bg-gray-50 border border-gray-200"
                              }`}
                              onClick={() => {
                                if (d.pagado) return;
                                setPagoState((p) => ({ ...p, [d.id]: !p[d.id] }));
                              }}
                            >
                              {!d.pagado && <input type="checkbox" checked={pagoState[d.id] || false} onChange={() => {}} className="w-3 h-3" />}
                              {d.pagado && <Check className="w-3 h-3 text-green-600" />}
                              <div className="flex-1">
                                <div className="font-medium">{d.productoNombre}</div>
                                <div className="text-xs text-muted-foreground">{d.cantidad} x ${d.precioUnitario.toLocaleString()}</div>
                              </div>
                              <div className="font-bold">${d.subtotal.toLocaleString()}</div>
                              {d.pagado && <Badge variant="outline" className="text-xs">✓</Badge>}
                            </div>
                          ))}
                        </div>
                        {venta.detalles?.some((d) => pagoState[d.id]) && (
                          <Button onClick={() => handleMarcarPagados(venta.id)} disabled={isLoading} className="w-full mt-2 text-xs" size="sm">
                            ✓ Marcar Pagados
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Sin deudas pendientes</p>
                )}
              </div>
            )}

            {/* TAB: HISTORIAL */}
            {activeTab === "historial" && (
              <div className="space-y-3">
                {todasVentas.length > 0 ? (
                  <div className="space-y-3">
                    {todasVentas.map((venta) => (
                      <Card key={venta.id} className={`p-3 ${venta.saldoPendiente > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                        <div className="flex justify-between mb-2 text-xs text-muted-foreground">
                          <span>{new Date(venta.fecha).toLocaleDateString('es-AR')}</span>
                          <span className="font-bold">
                            {venta.saldoPendiente > 0 ? (
                              <span className="text-red-600">Debe: ${venta.saldoPendiente.toLocaleString()}</span>
                            ) : (
                              <span className="text-green-600">✓ Pagado</span>
                            )}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {venta.detalles?.map((d) => (
                            <div key={d.id} className="flex items-center gap-2 p-2 rounded text-xs bg-white border border-gray-200">
                              {d.pagado && <Check className="w-3 h-3 text-green-600" />}
                              <div className="flex-1">
                                <div className="font-medium">{d.productoNombre}</div>
                                <div className="text-xs text-muted-foreground">{d.cantidad} x ${d.precioUnitario.toLocaleString()}</div>
                              </div>
                              <div className="font-bold">${d.subtotal.toLocaleString()}</div>
                              {d.pagado && <Badge variant="outline" className="text-xs">✓</Badge>}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t text-xs font-semibold">
                          Total venta: ${venta.total.toLocaleString()}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Sin historial</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA NORMAL: Lista de clientes (igual que antes)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Clientes</h3>
        <Button onClick={() => setShowAddClienteForm(!showAddClienteForm)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {showAddClienteForm && (
        <Card className="p-3 bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Nombre" value={formCliente.nombre} onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })} />
            <Input placeholder="CUIT" value={formCliente.cuit} onChange={(e) => setFormCliente({ ...formCliente, cuit: e.target.value })} />
            <Input placeholder="Teléfono" value={formCliente.telefono} onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })} />
            <div className="flex gap-1">
              <Button onClick={handleAddCliente} disabled={isLoading || !formCliente.nombre || !formCliente.cuit} className="flex-1" size="sm">
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowAddClienteForm(false)} size="sm">
                X
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <div className="flex gap-2">
        {(["todos", "debe", "pagado"] as const).map((f) => (
          <Button key={f} variant={filterDeuda === f ? "default" : "outline"} size="sm" onClick={() => setFilterDeuda(f)}>
            {f === "todos" && `Todos (${clientes.length})`}
            {f === "debe" && `Deben (${clientes.filter((c) => c.saldoPendiente > 0).length})`}
            {f === "pagado" && `Pagados (${clientes.filter((c) => c.saldoPendiente === 0).length})`}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredClientes.length === 0 ? (
          <p className="text-muted-foreground">No hay clientes</p>
        ) : (
          filteredClientes.map((c) => (
            <Card key={c.id} className={`p-3 cursor-pointer ${c.saldoPendiente > 0 ? "border-red-300 border-2" : ""}`} onClick={() => setSelectedCliente(c)}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-sm">{c.nombre}</h4>
                  <p className="text-xs text-muted-foreground">{c.telefono}</p>
                </div>
                {c.saldoPendiente > 0 && <Badge variant="destructive">DEBE</Badge>}
              </div>
              {c.saldoPendiente > 0 && <p className="text-sm font-bold text-red-600">${c.saldoPendiente.toLocaleString()}</p>}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import NotaVentaPDF from "./notaVentaPDF";
import {
  Search,
  Check,
  DollarSign,
  Plus,
  User,
  X,
  FileDown,
  Trash2,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";
import type { ClienteVenta, VentaFiado, Product } from "../types/inventory";

interface ClientesVentasManagerProps {
  clientes: ClienteVenta[];
  ventasFiado: VentaFiado[];
  products: Product[];
  onAddCliente?: (
    nombre: string,
    cuit: string,
    telefono: string
  ) => Promise<boolean>;
  onAddVentaFiado: (
    clienteId: number,
    productos: any[]
  ) => Promise<{ success: boolean; ventaId: any; total: number }>;
  onMarcarPagados: (detalleIds: number[], ventaId: number) => Promise<boolean>;
  onDeleteCliente?: (clienteId: number) => Promise<boolean>;
}

export function ClientesVentasManager({
  clientes,
  ventasFiado,
  products,
  onAddCliente,
  onAddVentaFiado,
  onMarcarPagados,
  onDeleteCliente,
}: ClientesVentasManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filterDeuda, setFilterDeuda] = useState<"todos" | "saldo" | "pagado">(
    "todos"
  );
  const [selectedCliente, setSelectedCliente] = useState<ClienteVenta | null>(
    null
  );
  const [showAddClienteForm, setShowAddClienteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagoState, setPagoState] = useState<{ [detalleId: number]: boolean }>(
    {}
  );
  const [activeTab, setActiveTab] = useState<"pagar" | "historial">("pagar");
  const [productosVenta, setProductosVenta] = useState<
    Array<{ productoId: string; cantidad: number }>
  >([]);
  const [formCliente, setFormCliente] = useState({
    nombre: "",
    cuit: "",
    telefono: "",
  });

  // ⬅️ NUEVO: Estados para el modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<ClienteVenta | null>(
    null
  );

  const filteredClientes = useMemo(() => {
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.cuit?.includes(searchTerm)
      )
      .filter((c) => {
        if (filterDeuda === "saldo") return c.saldoPendiente > 0;
        if (filterDeuda === "pagado") return c.saldoPendiente === 0;
        return true;
      });
  }, [clientes, searchTerm, filterDeuda]);

  const filteredProducts = useMemo(() => {
    const search = productSearchTerm.toLowerCase().trim();
    if (!search) return [];
    return products.filter(
      (p) =>
        p.quantity > 0 &&
        (p.name.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search) ||
          p.barcode?.toLowerCase().includes(search))
    );
  }, [products, productSearchTerm]);

  const clienteVentasAbiertas = (clienteId: number) =>
    ventasFiado.filter(
      (v) => v.clienteId === clienteId && v.saldoPendiente > 0
    );

  const clienteHistorialCompleto = (clienteId: number) =>
    ventasFiado.filter((v) => v.clienteId === clienteId);

  const handleAddCliente = async () => {
    if (!formCliente.nombre || !formCliente.cuit) return;
    if (!onAddCliente) return;
    setIsLoading(true);
    try {
      await onAddCliente(
        formCliente.nombre,
        formCliente.cuit,
        formCliente.telefono
      );
      setShowAddClienteForm(false);
      setFormCliente({ nombre: "", cuit: "", telefono: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotalVenta = () => {
    return productosVenta.reduce((total, item) => {
      const producto = products.find((p) => p.id === item.productoId);
      if (producto) {
        return total + producto.price * item.cantidad;
      }
      return total;
    }, 0);
  };

  const agregarProductoRapido = (productoId: string) => {
    const yaExiste = productosVenta.find((p) => p.productoId === productoId);
    if (yaExiste) {
      setProductosVenta(
        productosVenta.map((p) =>
          p.productoId === productoId ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      setProductosVenta([...productosVenta, { productoId, cantidad: 1 }]);
    }
  };

  const handleRegistrarVenta = async () => {
    if (!selectedCliente || productosVenta.length === 0) return;
    const productosValidos = productosVenta.every(
      (p) => p.productoId && p.cantidad > 0
    );
    if (!productosValidos) {
      alert("⚠️ Todos los productos deben estar seleccionados");
      return;
    }
    setIsLoading(true);
    try {
      await onAddVentaFiado(selectedCliente.id, productosVenta);
      setProductosVenta([]);
      setProductSearchTerm("");
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

  const handleGenerarPDF = async (venta: VentaFiado) => {
    if (!selectedCliente) return;
    try {
      setIsLoading(true);
      const blob = await pdf(
        <NotaVentaPDF cliente={selectedCliente} venta={venta} />
      ).toBlob();
      saveAs(
        blob,
        `nota-venta-${selectedCliente.nombre.replace(/\s+/g, "-")}-${
          venta.id
        }.pdf`
      );
    } catch (error) {
      alert(
        `Error al generar PDF: ${
          error instanceof Error ? error.message : "Error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ⬅️ NUEVO: Abrir modal de confirmación
  const openDeleteModal = (cliente: ClienteVenta, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setClienteToDelete(cliente);
    setShowDeleteModal(true);
  };

  // ⬅️ NUEVO: Confirmar eliminación
  const confirmDelete = async () => {
    if (!clienteToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/clientes/${clienteToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error en la operación");
      }

      setShowDeleteModal(false);
      setClienteToDelete(null);
      if (selectedCliente?.id === clienteToDelete.id) {
        setSelectedCliente(null);
      }
      window.location.reload();
    } catch (err) {
      alert(
        `No se pudo eliminar: ${err instanceof Error ? err.message : "Error"}`
      );
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
          <div>
            <h2 className="text-3xl font-bold">{selectedCliente.nombre}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCliente.cuit}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => openDeleteModal(selectedCliente, e)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCliente(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* COLUMNA IZQUIERDA: Info del Cliente */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Teléfono
                  </p>
                  <p className="font-semibold">
                    {selectedCliente.telefono || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    CUIT
                  </p>
                  <p className="font-semibold">{selectedCliente.cuit}</p>
                </div>
              </div>
            </Card>

            {/* Deuda */}
            {selectedCliente.saldoPendiente > 0 ? (
              <Alert className="bg-red-50 border-red-300">
                <DollarSign className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-700">
                  <div className="text-xs font-medium">SALDO</div>
                  <div className="text-2xl font-bold">
                    ${selectedCliente.saldoPendiente.toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 border-green-300">
                <Check className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-700">
                  <div className="text-sm font-semibold">Sin deudas</div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* COLUMNA DERECHA: Venta + Historial */}
          <div className="lg:col-span-4 space-y-4">
            {/* NUEVA VENTA */}
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Nueva Venta
              </h3>

              {/* Buscador rápido */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Buscar producto..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Productos sugeridos */}
              {productSearchTerm && filteredProducts.length > 0 && (
                <div className="mb-3 max-h-40 overflow-y-auto bg-white rounded border">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        agregarProductoRapido(p.id);
                        setProductSearchTerm("");
                      }}
                      className="w-full p-2 hover:bg-emerald-100 text-left border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Stock: {p.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-emerald-600">
                          ${p.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Productos en carrito */}
              {productosVenta.length > 0 && (
                <div className="space-y-2 mb-3">
                  {productosVenta.map((item, idx) => {
                    const producto = products.find(
                      (p) => p.id === item.productoId
                    );
                    return (
                      <div
                        key={idx}
                        className="flex gap-2 items-center bg-white p-2 rounded border"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {producto?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${producto?.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (item.cantidad > 1) {
                                const newItems = [...productosVenta];
                                newItems[idx].cantidad--;
                                setProductosVenta(newItems);
                              }
                            }}
                          >
                            −
                          </Button>
                          <span className="w-6 text-center font-semibold">
                            {item.cantidad}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (item.cantidad < (producto?.quantity || 999)) {
                                const newItems = [...productosVenta];
                                newItems[idx].cantidad++;
                                setProductosVenta(newItems);
                              }
                            }}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setProductosVenta(
                              productosVenta.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="bg-white p-3 rounded border-2 border-emerald-400 flex justify-between items-center">
                    <span className="font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ${calcularTotalVenta().toLocaleString()}
                    </span>
                  </div>

                  {/* Botones */}
                  <Button
                    onClick={handleRegistrarVenta}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Registrar Venta
                  </Button>
                </div>
              )}
            </Card>

            {/* Tabs de Deudas e Historial */}
            <div className="flex gap-2 border-b">
              <Button
                variant={activeTab === "pagar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("pagar")}
              >
                <DollarSign className="h-4 w-4 mr-1" />A Pagar (
                {ventasAb.length})
              </Button>
              <Button
                variant={activeTab === "historial" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("historial")}
              >
                <Package className="h-4 w-4 mr-1" />
                Historial ({todasVentas.length})
              </Button>
            </div>

            {/* TAB: A PAGAR */}
            {activeTab === "pagar" && (
              <div className="space-y-3">
                {ventasAb.length > 0 ? (
                  ventasAb.map((venta) => (
                    <Card
                      key={venta.id}
                      className="p-4 border-l-4 border-l-red-500"
                    >
                      <div className="flex justify-between mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(venta.fecha).toLocaleDateString("es-AR")}
                          </p>
                          <p className="text-xl font-bold text-red-600">
                            ${venta.saldoPendiente.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerarPDF(venta)}
                          disabled={isLoading}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {venta.detalles?.map((d) => (
                          <div
                            key={d.id}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                              pagoState[d.id]
                                ? "bg-green-100 border-2 border-green-400"
                                : d.pagado
                                ? "bg-gray-100 opacity-50"
                                : "hover:bg-blue-50 border-2 border-gray-200"
                            }`}
                            onClick={() => {
                              if (d.pagado) return;
                              setPagoState((p) => ({
                                ...p,
                                [d.id]: !p[d.id],
                              }));
                            }}
                          >
                            {!d.pagado && (
                              <input
                                type="checkbox"
                                checked={pagoState[d.id] || false}
                                onChange={() => {}}
                                className="w-4 h-4"
                              />
                            )}
                            {d.pagado && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                {d.productoNombre}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {d.cantidad} × $
                                {d.precioUnitario.toLocaleString()}
                              </p>
                            </div>
                            <p className="font-bold text-sm">
                              ${d.subtotal.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      {venta.detalles?.some((d) => pagoState[d.id]) && (
                        <Button
                          onClick={() => handleMarcarPagados(venta.id)}
                          disabled={isLoading}
                          className="w-full mt-3"
                        >
                          Marcar Pagados
                        </Button>
                      )}
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Sin deudas pendientes ✓
                  </p>
                )}
              </div>
            )}

            {/* TAB: HISTORIAL */}
            {activeTab === "historial" && (
              <div className="space-y-3">
                {todasVentas.length > 0 ? (
                  todasVentas.map((venta) => (
                    <Card
                      key={venta.id}
                      className={`p-4 border-l-4 ${
                        venta.saldoPendiente > 0
                          ? "border-l-red-500"
                          : "border-l-green-500"
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(venta.fecha).toLocaleDateString("es-AR")}
                          </p>
                          {venta.saldoPendiente > 0 ? (
                            <p className="text-red-600 font-bold">
                              Debe: ${venta.saldoPendiente.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-green-600 font-bold">✓ Pagado</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerarPDF(venta)}
                          disabled={isLoading}
                        >
                          <FileDown className="h-3 w-3" />
                        </Button>
                      </div>
                      {venta.detalles?.map((d) => (
                        <p key={d.id} className="text-xs text-muted-foreground">
                          {d.productoNombre}: {d.cantidad} × $
                          {d.precioUnitario.toLocaleString()}
                        </p>
                      ))}
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Sin historial
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ⬅️ MODAL DE ELIMINACIÓN - AQUÍ DENTRO */}
        {showDeleteModal && clienteToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-0 shadow-2xl">
              {/* Header del modal */}
              <div className="bg-red-50 border-b border-red-200 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-bold text-red-900">
                    Eliminar Cliente
                  </h3>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-4">
                <p className="text-base">
                  ¿Estás seguro de eliminar a{" "}
                  <span className="font-bold text-red-600">
                    {clienteToDelete.nombre}
                  </span>
                  ?
                </p>

                {clienteToDelete.saldoPendiente > 0 && (
                  <Alert className="bg-yellow-50 border-yellow-300">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Este cliente tiene una deuda de $
                      {clienteToDelete.saldoPendiente.toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-sm text-muted-foreground">
                  Esta acción no se puede deshacer. Se eliminarán todos los
                  datos asociados al cliente.
                </p>
              </div>

              {/* Botones */}
              <div className="bg-gray-50 border-t p-4 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setClienteToDelete(null);
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isLoading}
                >
                  {isLoading ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // VISTA NORMAL: Lista de clientes
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Clientes</h3>
        <Button
          onClick={() => setShowAddClienteForm(!showAddClienteForm)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {showAddClienteForm && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="Nombre"
              value={formCliente.nombre}
              onChange={(e) =>
                setFormCliente({ ...formCliente, nombre: e.target.value })
              }
            />
            <Input
              placeholder="CUIT"
              value={formCliente.cuit}
              onChange={(e) =>
                setFormCliente({ ...formCliente, cuit: e.target.value })
              }
            />
            <Input
              placeholder="Teléfono"
              value={formCliente.telefono}
              onChange={(e) =>
                setFormCliente({ ...formCliente, telefono: e.target.value })
              }
            />
            <div className="flex gap-1">
              <Button
                onClick={handleAddCliente}
                disabled={isLoading || !formCliente.nombre || !formCliente.cuit}
                className="flex-1"
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddClienteForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        {(["todos", "saldo", "pagado"] as const).map((f) => (
          <Button
            key={f}
            variant={filterDeuda === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterDeuda(f)}
          >
            {f === "todos" && `Todos (${clientes.length})`}
            {f === "saldo" &&
              `Deben (${clientes.filter((c) => c.saldoPendiente > 0).length})`}
            {f === "pagado" &&
              `Al día (${
                clientes.filter((c) => c.saldoPendiente === 0).length
              })`}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.length === 0 ? (
          <p className="text-muted-foreground">No hay clientes</p>
        ) : (
          filteredClientes.map((c) => (
            <Card
              key={c.id}
              className={`p-4 cursor-pointer relative transition-all hover:shadow-lg ${
                c.saldoPendiente > 0
                  ? "border-l-4 border-l-red-500 bg-red-50/30"
                  : "border-l-4 border-l-green-500"
              }`}
              onClick={() => setSelectedCliente(c)}
            >
              <button
                onClick={(e) => openDeleteModal(c, e)}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>

              <div className="pr-8">
                <h4 className="font-bold text-lg">{c.nombre}</h4>
                <p className="text-sm text-muted-foreground">{c.cuit}</p>
                {c.telefono && (
                  <p className="text-sm text-muted-foreground">
                    📞 {c.telefono}
                  </p>
                )}

                {c.saldoPendiente > 0 && (
                  <p className="text-lg font-bold text-red-600 mt-2">
                    ${c.saldoPendiente.toLocaleString()}
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ⬅️ MODAL DE ELIMINACIÓN */}
      {showDeleteModal && clienteToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-0 shadow-2xl">
            {/* Header del modal */}
            <div className="bg-red-50 border-b border-red-200 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-900">
                  Eliminar Cliente
                </h3>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              <p className="text-base">
                ¿Estás seguro de eliminar a{" "}
                <span className="font-bold text-red-600">
                  {clienteToDelete.nombre}
                </span>
                ?
              </p>

              {clienteToDelete.saldoPendiente > 0 && (
                <Alert className="bg-yellow-50 border-yellow-300">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Este cliente tiene una deuda de $
                    {clienteToDelete.saldoPendiente.toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer. Se eliminarán todos los datos
                asociados al cliente.
              </p>
            </div>

            {/* Botones */}
            <div className="bg-gray-50 border-t p-4 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setClienteToDelete(null);
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isLoading}
              >
                {isLoading ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientesVentasManager } from "../components/clientesVentasManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { QuickSaleForm } from "../components/quickSaleForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductForm } from "./product-form";
import { ProductListTable } from "./product-list-table";
import { LowStockAlerts } from "./low-stock-alerts";
import { MovementHistory } from "./movement-history";
import { BulkPriceUpdate } from "./bulk-price-update";
import { StockValueReport } from "./stock-value-report";
import FacturaCompraForm from "./facturas-form";
import FacturaVentaForm from "./facturas-ventas";
import { ThemeToggle } from "./theme-toggle";
import { Setup2FA } from "./auth/Setup2FA";
import { useInventoryNeon } from "../hooks/use-inventory-neon";
import type { Product } from "../types/inventory";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
  WifiOff,
  ArrowLeft,
  Plus,
  List,
  DollarSign as PriceIcon,
  BarChart3,
  Receipt,
  Package2,
  Menu,
  Building2,
  ChevronDown,
  CreditCard,
  Shield,
  User,
  LogOut,
  X,
  ShoppingCart,
  Settings,
} from "lucide-react";

interface User {
  username: string;
  has2FA: boolean;
  role?: string;
}

interface DashboardProps {
  onLogout?: () => void;
  currentUser?: User | null;
}

export function Dashboard({ onLogout, currentUser }: DashboardProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("products");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [is2FAReset, setIs2FAReset] = useState(false);
  const {
    products,
    movements,
    priceHistory,
    loading,
    error,
    connectionStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement,
    clearAllMovements,
    addMovementBulk,
    getLowStockAlerts,
    updateBarcode,
    getMovementsByProduct,
    getPriceHistoryByProduct,
    updatePricesByCategory,
    getTotalInventoryValue,
    getTotalInventoryCost,
    refreshData,
    retryConnection,
    clientesVentas,
    ventasFiado,
    addVentaFiado,
    addCliente,
    marcarProductosPagados,
  } = useInventoryNeon();

  // Estados existentes
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] =
    useState<Product | null>(null);
  const [movementType, setMovementType] = useState<"entrada" | "salida">(
    "entrada"
  );
  const [movementQuantity, setMovementQuantity] = useState("1");
  const [movementReason, setMovementReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [useCustomReason, setUseCustomReason] = useState(false);
  const [movementError, setMovementError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detectar dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const lowStockAlerts = getLowStockAlerts();
  const totalValue = getTotalInventoryValue();
  const totalCost = getTotalInventoryCost();

  const handleNavigation = (section: string) => {
    setActiveSection(section);
    setShowMobileMenu(false);
    if (section !== "add") {
      setEditingProduct(null);
      setShowAddProduct(false);
    }
    if (section === "add") {
      setShowAddProduct(true);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddProduct(true);
    setActiveSection("add");
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setShowAddProduct(false);
    setActiveSection("products");
  };

  // ✅ LOGOUT CORREGIDO - NO BORRA 2FA
  const handleLogout = () => {
    localStorage.removeItem("electrolux_user");
    localStorage.removeItem("electrolux_logged");
    localStorage.removeItem("electrolux_session_expiry");
    // ✅ MANTENER: electrolux_2fa_secret (no lo borres)

    if (onLogout) {
      onLogout();
    }

    toast({
      title: "👋 Sesión cerrada",
      description: "Has salido del sistema de forma segura",
      duration: 3000,
    });
  };

  const handle2FAReconfigure = () => {
    setShow2FASetup(true);
    setIs2FAReset(true);
    setShowResetModal(true);
  };

  const handle2FASetupComplete = (secret: string) => {
    setShow2FASetup(false);
    setIs2FAReset(false);
    toast({
      title: "✅ 2FA Reconfigurado",
      description: "Tu autenticación 2FA ha sido actualizada exitosamente.",
      duration: 5000,
    });
  };

  const handleAddProduct = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      setIsSubmitting(true);
      await addProduct(productData);
      setShowAddProduct(false);
      setEditingProduct(null);
      setActiveSection("products");

      toast({
        title: "✅ Producto agregado",
        description: `${productData.name} se agregó correctamente al inventario.`,
        duration: 3000,
      });
    } catch (err) {
      console.error("Error en handleAddProduct:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "❌ Error al agregar producto",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editingProduct) {
      try {
        setIsSubmitting(true);
        await updateProduct(editingProduct.id, productData);
        setEditingProduct(null);
        setShowAddProduct(false);
        setActiveSection("products");

        toast({
          title: "✅ Producto actualizado",
          description: `${productData.name} se actualizó correctamente.`,
          duration: 3000,
        });
      } catch (err) {
        console.error("Error en handleUpdateProduct:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        toast({
          title: "❌ Error al actualizar producto",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleQuickSale = (product: Product) => {
    if (product.quantity > 0) {
      setSelectedProductForMovement(product);
      setMovementType("salida");
      setMovementQuantity("1");
      setMovementReason("Venta a cliente");
      setCustomReason("");
      setUseCustomReason(false);
      setShowMovementModal(true);
    }
  };

  const handleQuickStock = (product: Product) => {
    setSelectedProductForMovement(product);
    setMovementType("entrada");
    setMovementQuantity("5");
    setMovementReason("Reposición de stock");
    setCustomReason("");
    setUseCustomReason(false);
    setShowMovementModal(true);
  };

  const handleMovementSubmit = async () => {
    setMovementError("");
    setIsSubmitting(true);

    try {
      const finalReason = useCustomReason
        ? customReason.trim()
        : movementReason;
      const quantity = Number(movementQuantity);

      if (!finalReason) {
        setMovementError("El motivo del movimiento es obligatorio");
        return;
      }

      if (quantity <= 0) {
        setMovementError("La cantidad debe ser mayor a 0");
        return;
      }

      if (selectedProductForMovement) {
        await addMovement(
          selectedProductForMovement.id,
          movementType,
          quantity,
          finalReason
        );
        setShowMovementModal(false);
        setSelectedProductForMovement(null);
        setMovementQuantity("1");
        setMovementReason("");
        setCustomReason("");
        setUseCustomReason(false);
        setMovementError("");

        const actionText =
          movementType === "entrada" ? "agregó stock" : "registró venta";
        const emoji = movementType === "entrada" ? "📦" : "💰";

        toast({
          title: `${emoji} ${
            movementType === "entrada" ? "Stock agregado" : "Venta registrada"
          }`,
          description: `Se ${actionText} de ${quantity} unidades para ${selectedProductForMovement.name}.`,
          duration: 3000,
        });
      }
    } catch (err) {
      setMovementError(
        err instanceof Error ? err.message : "Error al procesar el movimiento"
      );
      toast({
        title: "❌ Error en movimiento",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo procesar el movimiento.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedReasons = {
    entrada: [
      "Compra a proveedor",
      "Devolución de cliente",
      "Reposición de stock",
      "Ajuste de inventario (corrección)",
      "Transferencia desde otra sucursal",
      "Producto en consignación",
      "Recuperación de producto reparado",
    ],
    salida: [
      "Venta a cliente",
      "Venta online",
      "Producto defectuoso/dañado",
      "Muestra para cliente",
      "Transferencia a otra sucursal",
      "Devolución a proveedor",
      "Robo/pérdida",
      "Producto vencido/obsoleto",
      "Uso interno/demostración",
    ],
  };

  // Función para guardar código de barras
  const handleBarcodeSave = async (productId: string, barcode: string) => {
    try {
      await updateBarcode(productId, barcode);

      toast({
        title: "✅ Código de barras guardado",
        description: `Código: ${barcode}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "❌ Error al guardar código",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      throw error;
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "products":
        return (
          <div className="space-y-4">
            {!isMobile && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-red-600" />
                  Lista de Productos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gestiona tu inventario: editar, eliminar, y realizar
                  movimientos de stock
                </p>
              </div>
            )}
            <ProductListTable
              products={products}
              onEdit={handleEditProduct}
              onDelete={deleteProduct}
              onQuickSale={handleQuickSale}
              onQuickStock={handleQuickStock}
              onBarcodeSave={handleBarcodeSave}
              getMovementsByProduct={getMovementsByProduct}
              getPriceHistoryByProduct={getPriceHistoryByProduct}
            />
          </div>
        );

      case "add":
        return (
          <div className="space-y-4">
            {connectionStatus === "offline" ? (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  <strong>Funcionalidad no disponible sin conexión</strong>
                  <br />
                  Para agregar productos necesitas estar conectado a la base de
                  datos.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {!isMobile && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {editingProduct && (
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a la lista
                      </Button>
                    )}
                  </div>
                )}

                <ProductForm
                  onSubmit={
                    editingProduct ? handleUpdateProduct : handleAddProduct
                  }
                  initialData={editingProduct || undefined}
                  editing={!!editingProduct}
                  isEditing={!!editingProduct}
                  existingCodes={products.map((p) => p.code)}
                  products={products}
                  onCancel={handleCancelEdit}
                />
              </div>
            )}
          </div>
        );

      case "movements":
        return (
          <div className="space-y-4">
            <MovementHistory
              movements={movements}
              products={products}
              onClearMovements={clearAllMovements}
            />
          </div>
        );
      case "venta-rapida":
        return (
          <div className="space-y-4">
            {!isMobile && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Venta Rápida
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escanea códigos de barras para registrar ventas rápidamente
                </p>
              </div>
            )}
            {connectionStatus === "offline" ? (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  <strong>Funcionalidad no disponible sin conexión</strong>
                  <br />
                  Para registrar ventas necesitas estar conectado a la base de
                  datos.
                </AlertDescription>
              </Alert>
            ) : (
              <QuickSaleForm
                products={products}
                onSaleComplete={async (items) => {
                  try {
                    await addMovementBulk(
                      items.map((item) => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                      }))
                    );
                    toast({
                      title: "✅ Venta registrada",
                      description: `${items.length} producto(s) vendido(s)`,
                      duration: 3000,
                    });
                  } catch (error) {
                    toast({
                      title: "❌ Error al registrar venta",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Error desconocido",
                      variant: "destructive",
                    });
                    throw error;
                  }
                }}
              />
            )}
          </div>
        );
        case "clientes":
          return (
            <ClientesVentasManager
              clientes={clientesVentas}
              ventasFiado={ventasFiado}
              products={products}
              onAddCliente={addCliente}
              onAddVentaFiado={addVentaFiado}
              onMarcarPagados={marcarProductosPagados}
            />
          );
        

      case "alerts":
        return (
          <div className="space-y-4">
            <LowStockAlerts
              alerts={lowStockAlerts}
              onAddStock={(productId) => {
                const product = products.find((p) => p.id === productId);
                if (product) handleQuickStock(product);
              }}
            />
          </div>
        );

      case "prices":
        return (
          <div className="space-y-4">
            {connectionStatus === "offline" ? (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  <strong>Funcionalidad no disponible sin conexión</strong>
                  <br />
                  Para actualizar precios necesitas estar conectado a la base de
                  datos.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <BulkPriceUpdate
                  products={products}
                  onUpdatePrices={updatePricesByCategory}
                />
              </div>
            )}
          </div>
        );

      case "facturas-compra":
        return (
          <FacturaCompraForm
            products={products}
            onUpdateProductCost={async (productId: string, newCost: number) => {
              try {
                await updateProduct(productId, { cost: newCost });
                toast({
                  title: "💰 Costo actualizado",
                  description: `Costo actualizado a $${newCost.toLocaleString()}`,
                  duration: 3000,
                });
              } catch (error) {
                toast({
                  title: "❌ Error al actualizar costo",
                  description: "No se pudo actualizar el costo",
                  variant: "destructive",
                });
                throw error;
              }
            }}
            onUpdateProductPrice={async (
              productId: string,
              newPrice: number
            ) => {
              try {
                await updateProduct(productId, { price: newPrice });
                toast({
                  title: "💰 Precio actualizado",
                  description: `Precio de venta actualizado a $${newPrice.toLocaleString()}`,
                  duration: 3000,
                });
              } catch (error) {
                toast({
                  title: "❌ Error al actualizar precio",
                  description: "No se pudo actualizar el precio",
                  variant: "destructive",
                });
                throw error;
              }
            }}
            onAddMovement={async (
              productId: string,
              quantity: number,
              reason: string
            ) => {
              try {
                await addMovement(productId, "entrada", quantity, reason);
                toast({
                  title: "📦 Stock agregado",
                  description: `Se agregaron ${quantity} unidades al inventario`,
                  duration: 3000,
                });
              } catch (error) {
                toast({
                  title: "❌ Error al agregar stock",
                  description: "No se pudo registrar el movimiento",
                  variant: "destructive",
                });
                throw error;
              }
            }}
            onCreateProduct={async (productData) => {
              try {
                await addProduct(productData);
                await refreshData();
                toast({
                  title: "✅ Producto creado",
                  description: `${productData.name} se agregó al inventario`,
                  duration: 3000,
                });
                return {
                  ...productData,
                  id: Date.now().toString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as Product;
              } catch (error) {
                toast({
                  title: "❌ Error",
                  description: "No se pudo crear el producto",
                  variant: "destructive",
                });
                throw error;
              }
            }}
          />
        );

      case "facturas-venta":
        return (
          <FacturaVentaForm
            products={products}
            onSaleProduct={async (
              productId: string,
              quantity: number,
              reason: string
            ) => {
              try {
                await addMovement(productId, "salida", quantity, reason);
                toast({
                  title: "💰 Venta registrada",
                  description: `Se vendieron ${quantity} unidades correctamente`,
                  duration: 3000,
                });
              } catch (error) {
                toast({
                  title: "❌ Error en la venta",
                  description: "No se pudo procesar la venta",
                  variant: "destructive",
                });
                throw error;
              }
            }}
          />
        );

      case "reports":
        return (
          <div className="space-y-4">
            {!isMobile && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  Reportes y Análisis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Información detallada sobre el valor de tu inventario
                </p>
              </div>
            )}
            <StockValueReport
              products={products}
              totalInventoryValue={totalValue}
              totalInventoryCost={totalCost}
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Sección no encontrada</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-4 md:p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando inventario...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Conectando con la base de datos...
              </p>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* ✅ HEADER CON BOTÓN DE RESET 2FA SEGURO */}
        <div className="border-b bg-white dark:bg-gray-900 sticky top-0 z-40">
          <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              {/* Logo y info de usuario */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-extrabold text-xs sm:text-sm">
                    E
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-lg font-bold text-red-600 truncate">
                    ELECTROLUXSTORE
                  </h1>
                  {currentUser && (
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                      <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {currentUser.username}
                      </span>
                      {currentUser.has2FA && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4 sm:h-auto sm:px-2 sm:py-1"
                        >
                          <Shield className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">2FA</span>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ BOTONES DE ACCIÓN CON RESET 2FA SEGURO */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Botón de tema */}
                <ThemeToggle />

                {/* Menú móvil */}
                {isMobile && (
                  <DropdownMenu
                    open={showMobileMenu}
                    onOpenChange={setShowMobileMenu}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 focus:ring-0 focus:ring-offset-0"
                      >
                        {showMobileMenu ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Menu className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 bg-background border border-border shadow-lg mr-2"
                      sideOffset={5}
                    >
                      {/* Navegación principal */}
                      <div className="px-2 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
                          Navegación
                        </p>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavigation("products")}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "products"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                            `}
                          >
                            <List className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span>Ver Productos</span>
                          </button>
                          <button
                            onClick={() => handleNavigation("add")}
                            disabled={connectionStatus === "offline"}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "add"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                              ${
                                connectionStatus === "offline"
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            `}
                          >
                            <Plus className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span>Agregar Producto</span>
                          </button>
                          <button
                            onClick={() => handleNavigation("movements")}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "movements"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                            `}
                          >
                            <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span>Movimientos</span>
                          </button>
                          <button
                            onClick={() => handleNavigation("alerts")}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "alerts"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                            `}
                          >
                            <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <div className="flex items-center justify-between w-full">
                              <span>Alertas</span>
                              {lowStockAlerts.length > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs h-5 px-1.5"
                                >
                                  {lowStockAlerts.length}
                                </Badge>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => handleNavigation("prices")}
                            disabled={connectionStatus === "offline"}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "prices"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                              ${
                                connectionStatus === "offline"
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            `}
                          >
                            <PriceIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span>Actualizar Precios</span>
                          </button>
                          <button
                            onClick={() => handleNavigation("reports")}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "reports"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                            `}
                          >
                            <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span>Reportes</span>
                          </button>
                        </div>
                      </div>

                      <div className="px-2 py-1.5">
                        <div className="border-t border-border"></div>
                      </div>

                      {/* Sección de facturas */}
                      <div className="px-2 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
                          Facturación
                        </p>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavigation("facturas-compra")}
                            disabled={connectionStatus === "offline"}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "facturas-compra"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                              ${
                                connectionStatus === "offline"
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            `}
                          >
                            <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">
                                Facturas de Compra
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Proveedores
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleNavigation("facturas-venta")}
                            disabled={connectionStatus === "offline"}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                              hover:bg-accent hover:text-accent-foreground
                              focus:bg-accent focus:text-accent-foreground focus:outline-none
                              ${
                                activeSection === "facturas-venta"
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                              ${
                                connectionStatus === "offline"
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            `}
                          >
                            <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">
                                Facturas de Venta
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Clientes
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm focus:ring-0 focus:ring-offset-0"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="w-full px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mx-1 sm:mx-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    No se pudo conectar a la base de datos
                  </p>
                  <p className="text-sm">{error}</p>
                  <p className="text-xs mt-1">
                    Verifica tu conexión a internet y la configuración
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={retryConnection}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Cards de métricas - Solo en desktop */}
          {!isMobile && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Total Productos
                      </p>
                      <p className="text-lg sm:text-xl md:text-3xl font-bold text-red-600">
                        {products.length}
                      </p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {connectionStatus === "offline"
                          ? "Datos de ejemplo"
                          : "Productos en inventario"}
                      </p>
                    </div>
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Valor Inventario
                      </p>
                      <p className="text-lg sm:text-xl md:text-3xl font-bold text-green-600">
                        ${totalValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        Valor total en stock
                      </p>
                    </div>
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-blue-200"
                onClick={() => handleNavigation("movements")}
              >
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Movimientos
                      </p>
                      <p className="text-lg sm:text-xl md:text-3xl font-bold text-blue-600">
                        {movements.length}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        Click para ver historial
                      </p>
                    </div>
                    <div className="relative">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                      {movements.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                  lowStockAlerts.length > 0
                    ? "ring-2 ring-red-200 hover:ring-red-300"
                    : "hover:ring-2 hover:ring-gray-200"
                }`}
                onClick={() => handleNavigation("alerts")}
              >
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Alertas Stock
                      </p>
                      <p
                        className={`text-lg sm:text-xl md:text-3xl font-bold ${
                          lowStockAlerts.length > 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {lowStockAlerts.length}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {lowStockAlerts.length > 0 ? (
                          <>
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            Click para ver detalles
                          </>
                        ) : (
                          "Todo en stock"
                        )}
                      </p>
                    </div>
                    <div className="relative">
                      <AlertTriangle
                        className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 ${
                          lowStockAlerts.length > 0
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      />
                      {lowStockAlerts.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Título de sección para móviles */}
          {isMobile && (
            <div className="mb-3 px-1">
              <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                {activeSection === "products" && (
                  <>
                    <List className="h-5 w-5" />
                    Lista de Productos
                  </>
                )}
                {activeSection === "add" && (
                  <>
                    <Plus className="h-5 w-5" />
                    {editingProduct ? "Editar Producto" : "Agregar Producto"}
                  </>
                )}
                {activeSection === "movements" && (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    Movimientos
                  </>
                )}
                {activeSection === "alerts" && (
                  <>
                    <AlertTriangle className="h-5 w-5" />
                    Alertas de Stock
                  </>
                )}
                {activeSection === "facturas-compra" && (
                  <>
                    <Building2 className="h-5 w-5" />
                    Facturas de Compra
                  </>
                )}
                {activeSection === "facturas-venta" && (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Facturas de Venta
                  </>
                )}
                {activeSection === "reports" && (
                  <>
                    <BarChart3 className="h-5 w-5" />
                    Reportes
                  </>
                )}
                {activeSection === "prices" && (
                  <>
                    <PriceIcon className="h-5 w-5" />
                    Actualizar Precios
                  </>
                )}
              </h2>

              {/* Métricas rápidas en móvil */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Productos</p>
                  <p className="text-lg font-bold text-red-600">
                    {products.length}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">
                    Valor Total
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navegación Desktop */}
          {!isMobile && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-red-600">
                  Herramientas de Gestión INVEX
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Selecciona una opción para comenzar
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-1 p-1 bg-muted rounded-lg">
                  {/* Tab 1: Ver Productos */}
                  <button
                    onClick={() => handleNavigation("products")}
                    className={`
                      flex flex-col items-center gap-2 py-3 px-4 rounded-md transition-colors
                      ${
                        activeSection === "products"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:bg-background/50 hover:text-foreground"
                      }
                    `}
                  >
                    <List className="h-5 w-5 text-red-600" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Ver Productos</div>
                      <div className="text-xs text-muted-foreground">
                        Lista completa
                      </div>
                    </div>
                  </button>

                  {/* Tab 2: Agregar */}
                  <button
                    onClick={() => handleNavigation("add")}
                    disabled={connectionStatus === "offline"}
                    className={`
                      flex flex-col items-center gap-2 py-3 px-4 rounded-md transition-colors
                      ${
                        activeSection === "add"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:bg-background/50 hover:text-foreground"
                      }
                      ${
                        connectionStatus === "offline"
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    <Plus className="h-5 w-5 text-red-600" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Agregar</div>
                      <div className="text-xs text-muted-foreground">
                        Nuevo producto
                      </div>
                    </div>
                  </button>
                  {/* Tab: Clientes */}
                  <button
                    onClick={() => handleNavigation("clientes")}
                    disabled={connectionStatus === "offline"}
                    className={`
    flex flex-col items-center gap-2 py-3 px-4 rounded-md transition-colors
    ${
      activeSection === "clientes"
        ? "bg-background text-foreground shadow-sm"
        : "hover:bg-background/50 hover:text-foreground"
    }
    ${
      connectionStatus === "offline"
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer"
    }
  `}
                  >
                    <User className="h-5 w-5 text-purple-600" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Clientes</div>
                      <div className="text-xs text-muted-foreground">
                        Ventas a crédito
                      </div>
                    </div>
                  </button>

                  {/* Tab 3: Precios */}
                  <button
                    onClick={() => handleNavigation("prices")}
                    disabled={connectionStatus === "offline"}
                    className={`
                      flex flex-col items-center gap-2 py-3 px-4 rounded-md transition-colors
                      ${
                        activeSection === "prices"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:bg-background/50 hover:text-foreground"
                      }
                      ${
                        connectionStatus === "offline"
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    <PriceIcon className="h-5 w-5 text-blue-600" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Precios</div>
                      <div className="text-xs text-muted-foreground">
                        Actualizar masivo
                      </div>
                    </div>
                  </button>
                  {/* Tab 2.5: Venta Rápida */}
                  <button
                    onClick={() => handleNavigation("venta-rapida")}
                    disabled={connectionStatus === "offline"}
                    className={`
    flex flex-col items-center gap-2 py-3 px-4 rounded-md transition-colors
    ${
      activeSection === "venta-rapida"
        ? "bg-background text-foreground shadow-sm"
        : "hover:bg-background/50 hover:text-foreground"
    }
    ${
      connectionStatus === "offline"
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer"
    }
  `}
                  >
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Venta Rápida</div>
                      <div className="text-xs text-muted-foreground">
                        Con lector
                      </div>
                    </div>
                  </button>

                  {/* Tab 4: Reportes */}
                  <button
                    onClick={() => handleNavigation("reports")}
                    className={`
                      flex flex-col items-center gap-2 py-3 px-4 rounded-md transition-colors
                      ${
                        activeSection === "reports"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:bg-background/50 hover:text-foreground"
                      }
                    `}
                  >
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Reportes</div>
                      <div className="text-xs text-muted-foreground">
                        Análisis
                      </div>
                    </div>
                  </button>

                  {/* Tab 5: Dropdown de Facturas */}
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`
                            flex flex-col items-center gap-2 py-3 px-4 rounded-md transition-colors w-full
                            ${
                              activeSection === "facturas-compra" ||
                              activeSection === "facturas-venta"
                                ? "bg-background text-foreground shadow-sm"
                                : "hover:bg-background/50 hover:text-foreground"
                            }
                            ${
                              connectionStatus === "offline"
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }
                            focus:outline-none focus:ring-0
                            data-[state=open]:bg-background data-[state=open]:text-foreground data-[state=open]:shadow-sm
                          `}
                          disabled={connectionStatus === "offline"}
                        >
                          <div className="flex items-center gap-1">
                            <Receipt className="h-5 w-5 text-purple-600" />
                            <ChevronDown className="h-3 w-3 text-purple-600" />
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-sm">Facturas</div>
                            <div className="text-xs text-muted-foreground">
                              Compras y Ventas
                            </div>
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="center"
                        className="w-56 bg-background border border-border shadow-lg"
                        sideOffset={5}
                      >
                        <DropdownMenuItem
                          onClick={() => handleNavigation("facturas-compra")}
                          className={`
                            flex items-center gap-3 py-3 cursor-pointer
                            hover:bg-accent hover:text-accent-foreground
                            focus:bg-accent focus:text-accent-foreground focus:outline-none
                            ${
                              activeSection === "facturas-compra"
                                ? "bg-accent text-accent-foreground"
                                : ""
                            }
                          `}
                        >
                          <Building2 className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium">
                              Facturas de Compra
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Registrar compras a proveedores
                            </div>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleNavigation("facturas-venta")}
                          className={`
                            flex items-center gap-3 py-3 cursor-pointer
                            hover:bg-accent hover:text-accent-foreground
                            focus:bg-accent focus:text-accent-foreground focus:outline-none
                            ${
                              activeSection === "facturas-venta"
                                ? "bg-accent text-accent-foreground"
                                : ""
                            }
                          `}
                        >
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">Facturas de Venta</div>
                            <div className="text-xs text-muted-foreground">
                              Generar facturas a clientes
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contenido principal */}
          <div className="w-full">{renderContent()}</div>
        </div>

        {/* Modal para movimientos */}
        <Dialog open={showMovementModal} onOpenChange={setShowMovementModal}>
          <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                {movementType === "entrada"
                  ? "📦 Agregar Stock"
                  : "🛒 Registrar Venta"}
                {connectionStatus === "offline" && (
                  <Badge variant="outline" className="text-orange-600">
                    Offline
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {connectionStatus === "offline" && (
                <Alert>
                  <WifiOff className="h-4 w-4" />
                  <AlertDescription>
                    Sin conexión a la base de datos. Los movimientos no se
                    pueden registrar en modo offline.
                  </AlertDescription>
                </Alert>
              )}

              {selectedProductForMovement && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">
                    {selectedProductForMovement.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Stock actual:</span>{" "}
                    {selectedProductForMovement.quantity} unidades
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Precio:</span> $
                    {selectedProductForMovement.price.toLocaleString()}
                  </p>
                </div>
              )}

              {movementError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{movementError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="movementQuantity">Cantidad *</Label>
                  <Input
                    id="movementQuantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={movementQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setMovementQuantity(value);
                      }
                    }}
                    placeholder="1"
                    disabled={connectionStatus === "offline"}
                    className="h-10"
                  />
                  {movementType === "salida" && selectedProductForMovement && (
                    <p className="text-xs text-muted-foreground">
                      Máximo disponible: {selectedProductForMovement.quantity}{" "}
                      unidades
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Valor Total</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                    <span className="font-medium text-green-600 text-sm">
                      $
                      {(
                        (selectedProductForMovement?.price || 0) *
                        Number(movementQuantity || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">
                    Motivo del movimiento *
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="predefined"
                        checked={!useCustomReason}
                        onChange={() => setUseCustomReason(false)}
                        disabled={connectionStatus === "offline"}
                      />
                      <Label htmlFor="predefined" className="text-sm">
                        Seleccionar
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="custom"
                        checked={useCustomReason}
                        onChange={() => setUseCustomReason(true)}
                        disabled={connectionStatus === "offline"}
                      />
                      <Label htmlFor="custom" className="text-sm">
                        Escribir
                      </Label>
                    </div>
                  </div>
                </div>

                {!useCustomReason ? (
                  <div className="space-y-2">
                    <Select
                      value={movementReason}
                      onValueChange={setMovementReason}
                      disabled={connectionStatus === "offline"}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecciona un motivo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedReasons[movementType].map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Describe el motivo específico del movimiento..."
                      rows={3}
                      disabled={connectionStatus === "offline"}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={handleMovementSubmit}
                  disabled={
                    isSubmitting ||
                    connectionStatus === "offline" ||
                    (!useCustomReason && !movementReason.trim()) ||
                    (useCustomReason && !customReason.trim()) ||
                    !movementQuantity ||
                    Number(movementQuantity) <= 0
                  }
                  className="w-full h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {movementType === "entrada"
                        ? "📦 Agregar al Stock"
                        : "🛒 Registrar Venta"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowMovementModal(false)}
                  disabled={isSubmitting}
                  className="w-full h-10"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

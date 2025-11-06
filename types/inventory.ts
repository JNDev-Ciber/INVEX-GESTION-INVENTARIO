export interface Product {
  id: string
  code: string
  name: string
  category: string
  subcategory?: string   
  price: number
  cost: number
  quantity: number
  minStock: number
  description: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
  barcode?: string 
}


export interface Movement {
  id: string
  productId: string
  type: "entrada" | "salida"
  quantity: number
  reason: string
  date: string
  previousQuantity: number
  newQuantity: number
}

export interface VentaFiadoDetalle {
  id: number;
  ventaFiadoId: number;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  pagado: boolean;
  pagadoEn?: string;
}

export interface VentaFiado {
  id: number;
  clienteId: number;
  fecha: string;
  total: number;
  saldoPendiente: number;
  detalles?: VentaFiadoDetalle[];
  createdAt: string;
}

export interface ClienteVenta {
  id: number;
  nombre: string;
  telefono?: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  saldoPendiente: number;
}


export interface PriceHistory {
  id: string
  productId: string
  previousPrice: number
  newPrice: number
  date: string
  reason: string
}

export interface StockAlert {
  product: Product
  currentStock: number
  minStock: number
  difference: number
}

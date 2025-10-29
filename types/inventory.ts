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

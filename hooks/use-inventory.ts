"use client"

import { useState, useEffect } from "react"
import type { Product, Movement, PriceHistory, StockAlert } from "../types/inventory"

const STORAGE_KEYS = {
  PRODUCTS: "techstore-products",
  MOVEMENTS: "techstore-movements",
  PRICE_HISTORY: "techstore-price-history",
}

const initialProducts: Product[] = [
  {
    id: "1",
    code: "TECH-NB-001",
    name: "Notebook Dell Inspiron 15 3000",
    category: "Notebooks",
    price: 450000,
    cost: 350000,
    quantity: 12,
    minStock: 5,
    description: "Notebook Intel Core i5, 8GB RAM, 256GB SSD, Windows 11",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    code: "TECH-MON-001",
    name: 'Monitor Samsung 24" Full HD',
    category: "Monitores",
    price: 180000,
    cost: 140000,
    quantity: 8,
    minStock: 3,
    description: "Monitor LED 24 pulgadas, resolución 1920x1080, HDMI",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    code: "TECH-KB-001",
    name: "Teclado Mecánico Logitech G Pro",
    category: "Periféricos",
    price: 85000,
    cost: 65000,
    quantity: 2,
    minStock: 8,
    description: "Teclado mecánico gaming, switches táctiles, RGB",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    code: "TECH-MS-001",
    name: "Mouse Gaming Razer DeathAdder V3",
    category: "Periféricos",
    price: 65000,
    cost: 48000,
    quantity: 15,
    minStock: 10,
    description: "Mouse gaming óptico, 30000 DPI, ergonómico",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    code: "TECH-NB-002",
    name: "Notebook HP Pavilion Gaming",
    category: "Notebooks",
    price: 720000,
    cost: 580000,
    quantity: 1,
    minStock: 4,
    description: "Notebook gaming Intel Core i7, 16GB RAM, RTX 3050, 512GB SSD",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    code: "TECH-MON-002",
    name: 'Monitor LG 27" 4K UltraHD',
    category: "Monitores",
    price: 320000,
    cost: 250000,
    quantity: 6,
    minStock: 2,
    description: "Monitor 4K 27 pulgadas, IPS, USB-C, HDR10",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    code: "TECH-CPU-001",
    name: "Procesador AMD Ryzen 5 5600X",
    category: "Componentes",
    price: 180000,
    cost: 145000,
    quantity: 10,
    minStock: 5,
    description: "Procesador AMD Ryzen 5, 6 núcleos, 12 hilos, 3.7GHz",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    code: "TECH-GPU-001",
    name: "Placa de Video NVIDIA RTX 4060",
    category: "Componentes",
    price: 420000,
    cost: 340000,
    quantity: 3,
    minStock: 2,
    description: "Tarjeta gráfica NVIDIA GeForce RTX 4060, 8GB GDDR6",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])

  // Cargar datos del localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
    const savedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS)
    const savedPriceHistory = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORY)

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    } else {
      setProducts(initialProducts)
    }

    if (savedMovements) {
      setMovements(JSON.parse(savedMovements))
    }

    if (savedPriceHistory) {
      setPriceHistory(JSON.parse(savedPriceHistory))
    }
  }, [])

  // Guardar en localStorage cuando cambien los datos
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
    }
  }, [products])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements))
  }, [movements])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(priceHistory))
  }, [priceHistory])

  // Funciones CRUD para productos
  const addProduct = (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProducts((prev) => [...prev, newProduct])
    return newProduct
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id === id) {
          const updatedProduct = {
            ...product,
            ...updates,
            updatedAt: new Date().toISOString(),
          }

          // Si cambió el precio, registrar en historial
          if (updates.price && updates.price !== product.price) {
            const priceChange: PriceHistory = {
              id: Date.now().toString(),
              productId: id,
              previousPrice: product.price,
              newPrice: updates.price,
              date: new Date().toISOString(),
              reason: "Actualización manual",
            }
            setPriceHistory((prev) => [...prev, priceChange])
          }

          return updatedProduct
        }
        return product
      }),
    )
  }

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id))
    setMovements((prev) => prev.filter((movement) => movement.productId !== id))
    setPriceHistory((prev) => prev.filter((price) => price.productId !== id))
  }

  // Funciones para movimientos de stock con validación obligatoria de motivo
  const addMovement = (productId: string, type: "entrada" | "salida", quantity: number, reason: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return false

    // Validar que el motivo no esté vacío
    if (!reason.trim()) {
      throw new Error("El motivo del movimiento es obligatorio")
    }

    // Validar que no se pueda sacar más stock del disponible
    if (type === "salida" && product.quantity < quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${product.quantity}, Solicitado: ${quantity}`)
    }

    const movement: Movement = {
      id: Date.now().toString(),
      productId,
      type,
      quantity,
      reason: reason.trim(),
      date: new Date().toISOString(),
      previousQuantity: product.quantity,
      newQuantity: type === "entrada" ? product.quantity + quantity : product.quantity - quantity,
    }

    setMovements((prev) => [...prev, movement])
    updateProduct(productId, { quantity: movement.newQuantity })
    return true
  }

  // Obtener alertas de stock bajo
  const getLowStockAlerts = (): StockAlert[] => {
    return products
      .filter((product) => product.quantity <= product.minStock)
      .map((product) => ({
        product,
        currentStock: product.quantity,
        minStock: product.minStock,
        difference: product.minStock - product.quantity,
      }))
  }

  // Obtener movimientos por producto
  const getMovementsByProduct = (productId: string) => {
    return movements
      .filter((movement) => movement.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Obtener historial de precios por producto
  const getPriceHistoryByProduct = (productId: string) => {
    return priceHistory
      .filter((price) => price.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Actualización masiva de precios
  const updatePricesByCategory = (category: string, percentage: number) => {
    const categoryProducts = products.filter((p) => p.category === category)

    categoryProducts.forEach((product) => {
      const newPrice = Math.round(product.price * (1 + percentage / 100))
      updateProduct(product.id, { price: newPrice })
    })
  }

  // Calcular valor total del inventario
  const getTotalInventoryValue = () => {
    return products.reduce((total, product) => total + product.price * product.quantity, 0)
  }

  const getTotalInventoryCost = () => {
    return products.reduce((total, product) => total + product.cost * product.quantity, 0)
  }

  return {
    products,
    movements,
    priceHistory,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement,
    getLowStockAlerts,
    getMovementsByProduct,
    getPriceHistoryByProduct,
    updatePricesByCategory,
    getTotalInventoryValue,
    getTotalInventoryCost,
  }
}

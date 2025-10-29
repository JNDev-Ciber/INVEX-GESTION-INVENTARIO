"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/types/inventory"

export const runtime = 'edge'

// ✅ Carga el formulario dinámicamente
const ProductForm = dynamic(() => 
  import("@/components/product-form").then(mod => ({ default: mod.ProductForm })),
  { 
    loading: () => <div className="container mx-auto p-6">Cargando formulario...</div>,
    ssr: false 
  }
)

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: PageProps) {
  const [productId, setProductId] = useState<string>("")
  const [productData, setProductData] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [existingCodes, setExistingCodes] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()

  // ✅ Extraer el ID y cargar solo este producto
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const resolvedParams = await params
        setProductId(resolvedParams.id)
        
        // Cargar solo este producto
        const response = await fetch(`/api/products/${resolvedParams.id}`)
        if (!response.ok) throw new Error('Producto no encontrado')
        
        const product = await response.json()
        setProductData(product)
        
        // Opcionalmente, cargar solo los códigos existentes (mucho más liviano)
        const codesResponse = await fetch('/api/products/codes')
        if (codesResponse.ok) {
          const codes = await codesResponse.json()
          setExistingCodes(codes.filter((c: string) => c !== product.code))
        }
      } catch (error) {
        toast({
          title: "❌ Error",
          description: "No se pudo cargar el producto.",
          variant: "destructive"
        })
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params, router, toast])

  // ✅ Función para actualizar
  const handleUpdateProduct = async (updatedData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    if (!productData) return

    try {
      const response = await fetch(`/api/products/${productData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) throw new Error('Error al actualizar')
      
      toast({
        title: "✅ Producto actualizado",
        description: `${updatedData.name} se actualizó correctamente.`,
        duration: 3000
      })
      
      router.push("/")
    } catch (error) {
      toast({
        title: "❌ Error al actualizar",
        description: "No se pudo actualizar el producto.",
        variant: "destructive"
      })
    }
  }

  const handleCancel = () => {
    router.push("/")
  }

  if (loading || !productData) {
    return <div className="container mx-auto p-6">Cargando producto...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <ProductForm
        productId={productId}
        onSubmit={handleUpdateProduct}
        onCancel={handleCancel}
        editing={true}
        isEditing={true}
        initialData={productData}
        existingCodes={existingCodes}
        products={[]} 
      />
    </div>
  )
}
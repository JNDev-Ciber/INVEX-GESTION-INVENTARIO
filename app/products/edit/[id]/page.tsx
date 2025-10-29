"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic"; // ✅ Dejá este
import { useInventoryNeon } from "@/hooks/use-inventory-neon";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/inventory";

export const runtime = "edge";

// ✅ Solo el import dinámico
const ProductForm = dynamic(
  () =>
    import("@/components/product-form").then((mod) => ({
      default: mod.ProductForm,
    })),
  {
    loading: () => <div className="container mx-auto p-6">Cargando...</div>,
    ssr: false,
  }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const [productId, setProductId] = useState<string>("");
  const [productData, setProductData] = useState<Product | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const {
    products,
    updateProduct,
    loading: inventoryLoading,
  } = useInventoryNeon();

  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    };

    extractParams();
  }, [params]);

  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find((p) => p.id === productId);
      setProductData(product || null);
    }
  }, [productId, products]);

  const handleUpdateProduct = async (
    updatedData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!productData) return;

    try {
      await updateProduct(productData.id, updatedData);

      toast({
        title: "✅ Producto actualizado",
        description: `${updatedData.name} se actualizó correctamente.`,
        duration: 3000,
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "❌ Error al actualizar",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  if (inventoryLoading || !productData) {
    return <div className="container mx-auto p-6">Cargando producto...</div>;
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
        existingCodes={products
          .map((p) => p.code)
          .filter((code) => code !== productData.code)}
        products={products}
      />
    </div>
  );
}
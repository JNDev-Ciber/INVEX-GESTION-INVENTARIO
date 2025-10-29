"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useTheme } from "next-themes"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle,
  Package,
  Loader2,
  Save,
  RotateCcw,
  X,
  Plus,
  ChevronDown,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "../types/inventory"

interface ProductFormForPurchaseProps {
  onSubmit: (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onCancel: () => void
  initialData?: Partial<Product>
  existingCodes: string[]
  products?: Product[]
}

export function ProductFormForPurchase({
  onSubmit,
  onCancel,
  initialData,
  existingCodes,
  products = []
}: ProductFormForPurchaseProps) {
  const { toast } = useToast()
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Imagen
  const [dragActive, setDragActive] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Categoría y subcategoría
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [customCategory, setCustomCategory] = useState("")
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false)
  const [customSubcategory, setCustomSubcategory] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    imageUrl: initialData?.imageUrl || ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Memoizar categorías existentes
  const existingCategories = useMemo(() => 
    Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
    [products]
  )

  useEffect(() => {
    setMounted(true)
    if (initialData?.imageUrl) {
      setImagePreview(initialData.imageUrl)
    }
  }, [initialData])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setShowCustomInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Imagen
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleImageFile = useCallback((file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) handleImageFile(file)
    }
  }, [handleImageFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith('image/')) handleImageFile(file)
    }
  }, [handleImageFile])

  const removeImage = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, imageUrl: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  // ✅ CATEGORÍAS CON MAYÚSCULAS AUTOMÁTICAS
  const handleCategorySelect = useCallback((category: string) => {
    if (category === "__custom__") {
      setShowCustomInput(true)
      setCustomCategory("")
      setIsDropdownOpen(false)
    } else {
      setFormData(prev => ({ ...prev, category, subcategory: "" }))
      setIsDropdownOpen(false)
      setShowCustomInput(false)
    }
  }, [])

  const handleCustomCategorySubmit = useCallback(() => {
    if (customCategory.trim()) {
      setFormData(prev => ({ 
        ...prev, 
        category: customCategory.trim().toUpperCase(), 
        subcategory: "" 
      }))
      setShowCustomInput(false)
      setCustomCategory("")
    }
  }, [customCategory])

  const handleSubcategorySelect = useCallback((subcategory: string) => {
    if (subcategory === "__custom__") {
      setShowCustomSubcategory(true)
      setCustomSubcategory("")
    } else {
      setFormData(prev => ({ ...prev, subcategory }))
      setShowCustomSubcategory(false)
    }
  }, [])

  const handleCustomSubcategorySubmit = useCallback(() => {
    if (customSubcategory.trim()) {
      setFormData(prev => ({ ...prev, subcategory: customSubcategory.trim().toUpperCase() }))
      setShowCustomSubcategory(false)
      setCustomSubcategory("")
    }
  }, [customSubcategory])

  // ✅ MAYÚSCULAS AUTOMÁTICAS para nombre, categoría y subcategoría
  const handleUppercaseInput = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value.toUpperCase()
    }))
  }

  // ✅ CÓDIGO AUTOGENERADO CON ELECTRO (no PROD)
  const generateProductCode = useCallback(() => {
    const generateUniqueCode = () => {
      const categoryPrefix = formData.category 
        ? formData.category.substring(0, 7).toUpperCase()
        : "ELECTRO"
      const timestamp = Date.now().toString().slice(-6)
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0')
      return `${categoryPrefix}-${timestamp}${randomNum}`
    }
    
    let newCode = generateUniqueCode()
    let attempts = 0
    const maxAttempts = 100
    
    while (existingCodes.includes(newCode) && attempts < maxAttempts) {
      attempts++
      newCode = generateUniqueCode()
    }
    
    if (attempts >= maxAttempts) {
      const categoryPrefix = formData.category 
        ? formData.category.substring(0, 7).toUpperCase()
        : "ELECTRO"
      const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
      newCode = `${categoryPrefix}-${uuid}`
    }
    
    setFormData(prev => ({ ...prev, code: newCode }))
    setErrors(prev => {
      if (prev.code) {
        const { code, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [formData.category, existingCodes])

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.code.trim()) {
      newErrors.code = "El código es requerido"
    } else if (existingCodes.includes(formData.code)) {
      newErrors.code = "Este código ya existe"
    }
    
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.category) newErrors.category = "La categoría es requerida"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, existingCodes])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsSubmitting(true)
    try {
      let imageUrl = formData.imageUrl
      if (imageFile) {
        imageUrl = imagePreview || ""
      }
      
      const productData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        price: 0, // Se definirá en la factura
        cost: 0,  // Se definirá en la factura
        quantity: 0, // Se agregará con la factura
        minStock: 1,
        imageUrl: imageUrl || undefined,
      }
      
      await onSubmit(productData)
    } catch (error) {
      console.error("Error al crear producto:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [validate, formData, imageFile, imagePreview, onSubmit])

  const handleClear = useCallback(() => {
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "",
      subcategory: "",
      imageUrl: ""
    })
    setErrors({})
    setShowCustomInput(false)
    setShowCustomSubcategory(false)
    setIsDropdownOpen(false)
    removeImage()
  }, [removeImage])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
      <Card className="shadow-lg">
        <CardHeader className={`${
          isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-green-50 border-b border-green-200'
        } transition-colors p-3 sm:p-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="w-full sm:w-auto">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-green-600">
                <Package className="h-5 w-5" />
                Crear Producto para Factura de Compra
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Complete la información básica. Los precios y stock se definirán en la factura.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Mensaje informativo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                📦 Información importante
              </h4>
              <p className="text-sm text-blue-700">
                Este producto se creará con <strong>precios y stock inicial en 0</strong>. 
                Los precios se definirán en la factura de compra y el stock se agregará 
                automáticamente al procesar la factura.
              </p>
            </div>

            {/* Sección de imagen */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <ImageIcon className="h-4 w-4" />
                Imagen del Producto (Opcional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zona de drag & drop */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
                    ${dragActive 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`h-8 w-8 ${dragActive ? 'text-green-500' : 'text-gray-400'}`} />
                    <p className={`text-sm ${dragActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {dragActive 
                        ? 'Suelta la imagen aquí' 
                        : 'Arrastra una imagen o haz clic para seleccionar'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </div>
                </div>

                {/* Preview de imagen */}
                <div className="space-y-2">
                  <Label>Vista Previa</Label>
                  <div className={`
                    relative border-2 border-dashed rounded-lg p-4 min-h-[200px] flex items-center justify-center
                    ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}
                  `}>
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full max-h-[180px] object-contain rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No hay imagen seleccionada
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Información básica */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <Package className="h-4 w-4" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="flex items-center gap-2">
                    Código del Producto *
                    {errors.code && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {formData.code && !errors.code && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, code: e.target.value }))
                      }
                      className={`flex-1 ${errors.code ? "border-red-500" : ""}`}
                      placeholder="Ej: ELECTRO-001"
                    />
                    <Button 
                      type="button" 
                      onClick={generateProductCode}
                      variant="outline"
                      size="sm"
                      className="px-3 whitespace-nowrap"
                      disabled={isSubmitting}
                    >
                      AUTO
                    </Button>
                  </div>
                  {errors.code && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.code}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Nombre del Producto *
                    {errors.name && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {formData.name && !errors.name && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleUppercaseInput("name")}
                    className={errors.name ? "border-red-500" : ""}
                    placeholder="Ej: LAPTOP HP PAVILION"
                  />
                  {errors.name && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.name}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Categoría */}
                <div className="space-y-2" ref={dropdownRef}>
                  <Label className="flex items-center gap-2">
                    Categoría *
                    {errors.category && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {formData.category && !errors.category && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </Label>
                  
                  {existingCategories.length > 0 && !showCustomInput ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className={`
                            w-full flex items-center justify-between px-3 py-2 text-left
                            border rounded-md shadow-sm bg-background
                            hover:bg-accent hover:text-accent-foreground
                            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                            transition-colors duration-200
                            ${errors.category ? 'border-red-500' : 'border-input'}
                            ${isDark ? 'text-gray-200' : 'text-gray-900'}
                          `}
                        >
                          <span className={formData.category ? '' : 'text-muted-foreground'}>
                            {formData.category || "Seleccionar categoría..."}
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                          <div className={`
                            absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg
                            max-h-60 overflow-auto
                            ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
                          `}>
                            {existingCategories.map((category) => (
                              <button
                                key={category}
                                type="button"
                                onClick={() => handleCategorySelect(category)}
                                className={`
                                  w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground
                                  flex items-center gap-2 transition-colors duration-150
                                  ${formData.category === category ? 'bg-accent text-accent-foreground' : ''}
                                `}
                              >
                                <Package className="h-4 w-4 text-gray-500" />
                                {category}
                                {formData.category === category && <Check className="h-4 w-4 ml-auto" />}
                              </button>
                            ))}

                            <div className="px-2 py-1">
                              <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}></div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCategorySelect("__custom__")}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 font-medium text-green-600 transition-colors duration-150"
                            >
                              <Plus className="h-4 w-4" />
                              Crear nueva categoría
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {showCustomInput ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value.toUpperCase())}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleCustomCategorySubmit()
                                }
                                if (e.key === 'Escape') {
                                  setShowCustomInput(false)
                                  setCustomCategory("")
                                }
                              }}
                              placeholder="Escribir nueva categoría..."
                              className={errors.category ? "border-red-500" : "border-green-500"}
                              autoFocus
                            />
                            <Button
                              type="button"
                              onClick={handleCustomCategorySubmit}
                              size="sm"
                              className="px-3"
                              disabled={!customCategory.trim()}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                          {existingCategories.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowCustomInput(false)
                                setCustomCategory("")
                              }}
                              className="text-xs"
                            >
                              ← Volver a categorías existentes
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={handleUppercaseInput("category")}
                          className={errors.category ? "border-red-500" : ""}
                          placeholder="Ej: NOTEBOOKS, CELULARES, ACCESORIOS..."
                        />
                      )}
                    </div>
                  )}
                  
                  {errors.category && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.category}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Subcategoría */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Subcategoría
                    {formData.subcategory && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </Label>
                  
                  {formData.category && (
                    <>
                      {showCustomSubcategory ? (
                        <div className="flex gap-2">
                          <Input
                            value={customSubcategory}
                            onChange={(e) => setCustomSubcategory(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCustomSubcategorySubmit()
                              }
                              if (e.key === 'Escape') {
                                setShowCustomSubcategory(false)
                                setCustomSubcategory("")
                              }
                            }}
                            placeholder="Escribir nueva subcategoría..."
                            className="border-green-500"
                            autoFocus
                          />
                          <Button
                            type="button"
                            onClick={handleCustomSubcategorySubmit}
                            size="sm"
                            className="px-3"
                            disabled={!customSubcategory.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Input
                          value={formData.subcategory}
                          onChange={handleUppercaseInput("subcategory")}
                          placeholder="Ej: GAMING, ULTRABOOK..."
                        />
                      )}
                      
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        💡 Las subcategorías ayudan a organizar mejor tus productos
                      </p>
                    </>
                  )}
                  
                  {!formData.category && (
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Selecciona una categoría primero
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Producto (Opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                placeholder="Describe las características principales del producto..."
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.name.trim() || !formData.category}
                className="flex-1 sm:flex-none sm:min-w-[200px] bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Producto
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClear}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"
import { fileToWebpBase64 } from "@/lib/convert-to-webp-base64"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle,
  Calculator,
  Package,
  DollarSign,
  Loader2,
  ArrowLeft,
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
import type { Product } from "../types/inventory"

interface Producto {
  id?: string
  code: string
  name: string
  description: string
  category: string
  subcategory?: string
  price: number
  cost: number
  quantity: number
  minStock: number
  imageUrl?: string
}

interface ProductoForm {
  id?: string
  code: string
  name: string
  description: string
  category: string
  subcategory: string
  price: string
  cost: string
  quantity: string
  minStock: string
  imageUrl: string
}

interface Subcategory {
  id: string
  name: string
  categoryId: string
}

interface Props {
  onSubmit: (producto: Producto) => void
  initialData?: any
  editing?: boolean
  existingCodes?: string[]
  isEditing?: boolean
  productId?: string
  onCancel?: () => void
  products?: Product[]
  subcategories?: Subcategory[]
}

export function ProductForm({ 
  onSubmit, 
  initialData, 
  editing, 
  isEditing = false, 
  productId, 
  onCancel, 
  existingCodes,
  products = [],
  subcategories = []
}: Props) {
  const router = useRouter()
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

  // Control de inicialización
  const isInitialized = useRef(false)
  const initialDataProcessed = useRef(false)

  // Estado principal del formulario
  const [formData, setFormData] = useState<ProductoForm>({
    code: "",
    name: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    cost: "",
    quantity: "",
    minStock: "",
    imageUrl: "",
  })

  const [margin, setMargin] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Memoizar categorías existentes
  const existingCategories = useMemo(() => 
    Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
    [products]
  )

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  // Conversión de datos iniciales
  const convertToFormData = useCallback((data: any): ProductoForm => ({
    id: data?.id || "",
    code: String(data?.code || ""),
    name: String(data?.name || ""),
    description: String(data?.description || ""),
    category: String(data?.category || ""),
    subcategory: String(data?.subcategory || ""),
    price: String(data?.price || ""),
    cost: String(data?.cost || ""),
    quantity: String(data?.quantity || ""),
    minStock: String(data?.minStock || ""),
    imageUrl: String(data?.imageUrl || ""),
  }), [])

  // INICIALIZACIÓN CONTROLADA - Solo una vez
  useEffect(() => {
    if (initialData && !initialDataProcessed.current) {
      const data = convertToFormData(initialData)
      setFormData(data)
      if (data.imageUrl) setImagePreview(data.imageUrl)
      initialDataProcessed.current = true
      isInitialized.current = true
    }
  }, [initialData, convertToFormData])

  // Efecto para productId - Solo una vez
  useEffect(() => {
    if (productId && !initialData && !isInitialized.current) {
      const mockProduct = {
        id: productId,
        code: "ELECTRO-" + productId,
        name: "PRODUCT " + productId,
        category: "NOTEBOOKS",
        subcategory: "GAMING",
        price: 100,
        cost: 80,
        quantity: 10,
        minStock: 5,
        description: "Product description",
      }
      setFormData(convertToFormData(mockProduct))
      isInitialized.current = true
    }
  }, [productId, initialData, convertToFormData])

  // FILTRADO DE SUBCATEGORÍAS
  const filteredSubcategories = useMemo(() => {
    if (!formData.category) return []
    return subcategories.filter(sub => sub.categoryId === formData.category)
  }, [formData.category, subcategories])

  // Limpieza de subcategoría inválida
  useEffect(() => {
    if (
      formData.subcategory &&
      filteredSubcategories.length > 0 &&
      !filteredSubcategories.some(sub => sub.name === formData.subcategory)
    ) {
      setFormData(prev => {
        if (prev.subcategory !== "") {
          return { ...prev, subcategory: "" }
        }
        return prev
      })
    }
  }, [formData.subcategory, filteredSubcategories])

  // Cálculo de margen
  useEffect(() => {
    const price = parseFloat(formData.price)
    const cost = parseFloat(formData.cost)
    if (!isNaN(price) && !isNaN(cost) && price !== 0) {
      setMargin(((price - cost) / price) * 100)
    } else {
      setMargin(0)
    }
  }, [formData.price, formData.cost])

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

  const handleImageFile = useCallback(async (file: File) => {
    setImageFile(file)
    try {
      // Convierte a WebP base64 antes de guardar
      const webpBase64 = await fileToWebpBase64(file)
      setImagePreview(webpBase64)
      setFormData(prev => ({
        ...prev,
        imageUrl: webpBase64
      }))
    } catch (err) {
      setImagePreview(null)
      setFormData(prev => ({
        ...prev,
        imageUrl: ""
      }))
      setErrors(prev => ({
        ...prev,
        image: "No se pudo convertir la imagen a WebP"
      }))
    }
    setErrors(prev => {
      if (prev.image) {
        const { image, ...rest } = prev
        return rest
      }
      return prev
    })
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

  // Solo mayúsculas en categoría y subcategoría al crear nuevas
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
  const handleUppercaseInput = (field: keyof ProductoForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value.toUpperCase()
    }))
  }

  // ✅ CÓDIGO AUTOGENERADO CON ELECTRO (no TECH)
  const generateProductCode = useCallback(() => {
    const generateUniqueCode = () => {
      const categoryPrefix = formData.category 
        ? formData.category.substring(0, 7).toUpperCase()
        : "ELECTRO"
      const now = Date.now()
      const timestamp = now.toString().slice(-8)
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const performanceCounter = Math.floor(performance.now() * 1000) % 10000
      const counterSuffix = performanceCounter.toString().padStart(4, '0')
      return `${categoryPrefix}-${timestamp}-${randomSuffix}-${counterSuffix}`
    }
    let newCode = generateUniqueCode()
    let attempts = 0
    const maxAttempts = 100
    while (existingCodes && existingCodes.includes(newCode) && attempts < maxAttempts) {
      attempts++
      newCode = generateUniqueCode()
    }
    if (attempts >= maxAttempts) {
      const categoryPrefix = formData.category 
        ? formData.category.substring(0, 7).toUpperCase()
        : "ELECTRO"
      const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase()
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

  // Validación
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.code.trim()) {
      newErrors.code = "El código es requerido"
    } else if (existingCodes && existingCodes.includes(formData.code) && !editing && !isEditing) {
      newErrors.code = "Este código ya existe"
    }
    
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.category) newErrors.category = "La categoría es requerida"
    if (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) <= 0)
      newErrors.price = "Precio inválido"
    if (!formData.cost.trim() || isNaN(Number(formData.cost)) || Number(formData.cost) <= 0)
      newErrors.cost = "Costo inválido"
    if (!formData.quantity.trim() || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0)
      newErrors.quantity = "Cantidad inválida"
    if (!formData.minStock.trim() || isNaN(Number(formData.minStock)) || Number(formData.minStock) < 0)
      newErrors.minStock = "Stock mínimo inválido"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, existingCodes, editing, isEditing])

  const handleNumericChange = useCallback((field: keyof ProductoForm, value: string, decimal = false) => {
    if (value === "") {
      setFormData(prev => ({ ...prev, [field]: value }))
      return
    }
    const cleanValue = value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, "")
    if (decimal && (cleanValue.match(/\./g) || []).length <= 1) {
      setFormData(prev => ({ ...prev, [field]: cleanValue }))
    } else if (!decimal) {
      setFormData(prev => ({ ...prev, [field]: cleanValue }))
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      let imageUrl = formData.imageUrl
      if (imageFile) {
        imageUrl = imagePreview || ""
      }
      const productData: Producto = {
        id: formData.id,
        code: formData.code,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        quantity: parseInt(formData.quantity) || 0,
        minStock: parseInt(formData.minStock) || 0,
        imageUrl: imageUrl || undefined,
      }
      await onSubmit(productData)
    } catch (error) {
      console.error("Error al enviar formulario:", error)
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
      price: "",
      cost: "",
      quantity: "",
      minStock: "",
      imageUrl: "",
    })
    setErrors({})
    setMargin(0)
    setShowCustomInput(false)
    setShowCustomSubcategory(false)
    setIsDropdownOpen(false)
    removeImage()
    isInitialized.current = false
    initialDataProcessed.current = false
  }, [removeImage])

  const handleCancel = useCallback(() => {
    handleClear()
    if (onCancel) {
      onCancel()
    } else if (router) {
      router.push("/")
    }
  }, [handleClear, onCancel, router])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
      <Card className="shadow-lg">
        <CardHeader className={`${
          isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b'
        } transition-colors p-3 sm:p-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="w-full sm:w-auto">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {editing || isEditing ? (
                  <>
                    <Package className="h-5 w-5 text-orange-600" />
                    Editar Producto
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5 text-blue-600" />
                    Agregar Nuevo Producto
                  </>
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {editing || isEditing 
                  ? `Modificando: ${formData.name || 'Producto'}`
                  : "Completa la información del producto para agregarlo al inventario"
                }
              </CardDescription>
            </div>
            
            {(formData.price && formData.cost) && (
              <Badge 
                variant={margin > 0 ? "default" : "destructive"}
                className="text-sm px-3 py-1 mt-2 sm:mt-0"
              >
                <Calculator className="h-3 w-3 mr-1" />
                Margen: {margin.toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Sección de imagen */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <ImageIcon className="h-4 w-4" />
                Imagen del Producto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zona de drag & drop */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
                    ${dragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                    <Upload className={`h-8 w-8 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className={`text-sm ${dragActive ? 'text-blue-600' : 'text-gray-600'}`}>
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
                    {formData.code && !errors.code && <CheckCircle className="h-4 w-4 text-blue-500" />}
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
                    {formData.name && !errors.name && <CheckCircle className="h-4 w-4 text-blue-500" />}
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
                    {formData.category && !errors.category && <CheckCircle className="h-4 w-4 text-blue-500" />}
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
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 font-medium text-blue-600 transition-colors duration-150"
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
                              className={errors.category ? "border-red-500" : "border-blue-500"}
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
                    {formData.subcategory && <CheckCircle className="h-4 w-4 text-blue-500" />}
                  </Label>
                  
                  {formData.category && (
                    <>
                      {filteredSubcategories.length > 0 && !showCustomSubcategory ? (
                        <div className="space-y-2">
                          <select
                            value={formData.subcategory}
                            onChange={(e) => handleSubcategorySelect(e.target.value)}
                            className={`
                              w-full px-3 py-2 border rounded-md shadow-sm bg-background
                              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                              ${isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-900'}
                            `}
                          >
                            <option value="">Seleccionar subcategoría...</option>
                            {filteredSubcategories.map((sub) => (
                              <option key={sub.id} value={sub.name}>
                                {sub.name}
                              </option>
                            ))}
                            <option value="__custom__">+ Crear nueva subcategoría</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2">
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
                                className="border-blue-500"
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
                              placeholder="Ej: GAMING, ULTRABOOK, BÁSICO..."
                            />
                          )}
                          
                          {filteredSubcategories.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCustomSubcategory(false)}
                              className="text-xs"
                            >
                              ← Ver subcategorías existentes
                            </Button>
                          )}
                        </div>
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

            {/* Precios y costos */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <DollarSign className="h-4 w-4" />
                Precios y Costos
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost" className="flex items-center gap-2">
                    Costo Unitario *
                    {errors.cost && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="cost"
                      value={formData.cost}
                      onChange={(e) =>
                        handleNumericChange("cost", e.target.value, true)
                      }
                      className={`pl-8 ${errors.cost ? "border-red-500" : ""}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.cost && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.cost}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2">
                    Precio de Venta *
                    {errors.price && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) =>
                        handleNumericChange("price", e.target.value, true)
                      }
                      className={`pl-8 ${errors.price ? "border-red-500" : ""}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.price}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Indicador de margen */}
              {(formData.price && formData.cost) && (
                <div className={`p-4 rounded-lg border transition-colors ${
                  margin > 0 
                    ? (isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200')
                    : (isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className={`h-4 w-4 ${
                        margin > 0 
                          ? (isDark ? 'text-blue-400' : 'text-blue-600')
                          : (isDark ? 'text-red-400' : 'text-red-600')
                      }`} />
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        Análisis de Margen
                      </span>
                    </div>
                    <Badge variant={margin > 0 ? "default" : "destructive"}>
                      {margin.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Costo:</span>
                      <p className="font-medium">${parseFloat(formData.cost || "0").toLocaleString()}</p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Precio:</span>
                      <p className="font-medium">${parseFloat(formData.price || "0").toLocaleString()}</p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Ganancia:</span>
                      <p className={`font-medium ${
                        margin > 0 
                          ? (isDark ? 'text-blue-400' : 'text-blue-600')
                          : (isDark ? 'text-red-400' : 'text-red-600')
                      }`}>
                        ${(parseFloat(formData.price || "0") - parseFloat(formData.cost || "0")).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Margen:</span>
                      <p className={`font-medium ${
                        margin > 0 
                          ? (isDark ? 'text-blue-400' : 'text-blue-600')
                          : (isDark ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stock e inventario */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <Package className="h-4 w-4" />
                Stock e Inventario
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="flex items-center gap-2">
                    Cantidad Inicial *
                    {errors.quantity && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </Label>
                  <Input
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleNumericChange("quantity", e.target.value)
                    }
                    className={errors.quantity ? "border-red-500" : ""}
                    placeholder="0"
                  />
                  {errors.quantity && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.quantity}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock" className="flex items-center gap-2">
                    Stock Mínimo *
                    {errors.minStock && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </Label>
                  <Input
                    id="minStock"
                    value={formData.minStock}
                    onChange={(e) =>
                      handleNumericChange("minStock", e.target.value)
                    }
                    className={errors.minStock ? "border-red-500" : ""}
                    placeholder="0"
                  />
                  {errors.minStock && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.minStock}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Producto</Label>
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
                disabled={isSubmitting}
                className="flex-1 sm:flex-none sm:min-w-[200px] bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editing || isEditing ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editing || isEditing ? "Actualizar Producto" : "Guardar Producto"}
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

              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}

              {router && (editing || isEditing) && !onCancel && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => router.push("/")}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {isMobile ? "Volver" : "Volver a la lista"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

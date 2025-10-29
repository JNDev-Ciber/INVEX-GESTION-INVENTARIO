"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Download,
  Database,
  Calendar,
  Building2,
  Loader2,
  CheckCircle,
} from "lucide-react"

type ReportType = "ventas" | "stock" | "vendedores" | "categorias"

interface ReportConfig {
  tipo: ReportType
  fechaDesde: string
  fechaHasta: string
  sucursal: string
}

export default function ElectroluxReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>({
    tipo: "ventas",
    fechaDesde: "2024-01-01",
    fechaHasta: "2024-01-31",
    sucursal: "todas",
  })

  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const reportTypes = [
    { value: "ventas", label: "Reporte de Ventas Detallado", icon: TrendingUp },
    { value: "stock", label: "Stock Bajo Mínimo", icon: Package },
    { value: "vendedores", label: "Top Vendedores", icon: Users },
    { value: "categorias", label: "Análisis por Categorías", icon: BarChart3 },
  ]

  // Simular conexión a SQL Server (puedes reemplazar por tu lógica real)
  const connectToDatabase = async () => {
    setIsConnecting(true)
    setIsConnected(false)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsConnecting(false)
    setIsConnected(true)
  }

  // Aquí deberías poner tu propia lógica para obtener los datos del reporte
  const generateReportData = async () => {
    // Reemplaza este return por tu consulta real
    return []
  }

  const handleGenerateReport = async () => {
    if (!isConnected) {
      await connectToDatabase()
    }
    setIsGenerating(true)
    const data = await generateReportData()
    setReportData(data)
    setShowPreview(true)
    setIsGenerating(false)
  }

  const handleDownloadPDF = () => {
    // Simula descarga de PDF, reemplaza por tu lógica real si tienes generación de PDF
    const element = document.createElement("a")
    const file = new Blob(["Reporte PDF generado"], { type: "application/pdf" })
    element.href = URL.createObjectURL(file)
    element.download = `reporte_${config.tipo}_${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // NUEVA FUNCIÓN: Descargar HTML
  const handleDownloadHTML = () => {
    if (!reportData.length) return

    const columns = Object.keys(reportData[0])
    const tableRows = reportData.map(row =>
      `<tr>${columns.map(col => `<td>${row[col]}</td>`).join('')}</tr>`
    ).join('')
    const tableHeaders = columns.map(col => `<th>${col}</th>`).join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Reporte ${config.tipo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h2>Reporte: ${config.tipo}</h2>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_${config.tipo}_${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderPreviewTable = () => {
    if (!reportData.length) return null

    const columns = Object.keys(reportData[0])

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Vista Previa del Reporte</h3>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button onClick={handleDownloadHTML} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Descargar HTML
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold">
                    {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, " $1")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {(typeof row[column] === "number" && column.includes("total")) ||
                      column.includes("ventas") ||
                      column.includes("precio") ? (
                        `$${row[column].toLocaleString()}`
                      ) : column === "estado" && row[column] === "Crítico" ? (
                        <Badge variant="destructive">{row[column]}</Badge>
                      ) : column === "cumplimiento" ? (
                        <Badge variant={Number.parseFloat(row[column]) >= 100 ? "default" : "secondary"}>
                          {row[column]}%
                        </Badge>
                      ) : (
                        row[column]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  useEffect(() => {
    connectToDatabase()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Generador de Reportes</h1>
              <p className="text-gray-600">ElectroluxStore - Sistema de Reportes Empresariales</p>
            </div>
          </div>
          {/* Estado de conexión */}
          <div className="flex items-center gap-2 mt-4">
            <Database className="w-4 h-4 text-gray-500" />
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Conectando a SQL Server...</span>
              </div>
            ) : isConnected ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Conectado a SQL Server</span>
              </div>
            ) : (
              <span className="text-sm text-red-600">Desconectado</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Configuración del Reporte
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Selecciona los parámetros para generar tu reporte
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Tipo de Reporte */}
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-sm font-medium">
                    Tipo de Reporte
                  </Label>
                  <Select
                    value={config.tipo}
                    onValueChange={(value: ReportType) => setConfig({ ...config, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Filtros de Fecha */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <Label className="text-sm font-medium">Período</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="fechaDesde" className="text-xs text-gray-500">
                        Desde
                      </Label>
                      <Input
                        id="fechaDesde"
                        type="date"
                        value={config.fechaDesde}
                        onChange={(e) => setConfig({ ...config, fechaDesde: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaHasta" className="text-xs text-gray-500">
                        Hasta
                      </Label>
                      <Input
                        id="fechaHasta"
                        type="date"
                        value={config.fechaHasta}
                        onChange={(e) => setConfig({ ...config, fechaHasta: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Filtro de Sucursal */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <Label htmlFor="sucursal" className="text-sm font-medium">
                      Sucursal
                    </Label>
                  </div>
                  <Select value={config.sucursal} onValueChange={(value) => setConfig({ ...config, sucursal: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Aquí deberías cargar tus sucursales dinámicamente */}
                      <SelectItem value="todas">Todas las sucursales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />

                {/* Botón Generar */}
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando Reporte...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generar Reporte
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 min-h-[600px]">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Resultados del Reporte</CardTitle>
                <CardDescription>
                  {showPreview
                    ? `Mostrando ${reportData.length} registros del reporte de ${reportTypes.find((t) => t.value === config.tipo)?.label}`
                    : "Configura y genera un reporte para ver los resultados"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!showPreview ? (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <FileText className="w-16 h-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No hay datos para mostrar</h3>
                    <p className="text-center text-sm">
                      Selecciona los parámetros del reporte y haz clic en "Generar Reporte" para ver los resultados.
                    </p>
                  </div>
                ) : (
                  renderPreviewTable()
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

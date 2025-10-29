// export-utils.ts
import type { Product, Movement, PriceHistory } from "../types/inventory"
import { 
  exportMovementsToExcel, 
  exportInventoryToExcel, 
  exportInventoryReport,
  exportCategoriesReport,
  exportCategoriesToExcel 
} from "./excel-export"

// Generador de HTML mejorado
class HTMLToPDFGenerator {
  private content: string[] = []

  constructor() {
    this.content = []
  }

  addHeader(title: string) {
    this.content.push(`
      <div class="header">
        <h1>${title}</h1>
        <div class="system-info">
          <h2>Sistema de Inventario ELECTROLUXSTORE</h2>
          <p>Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}</p>
        </div>
      </div>
    `)
  }

  addSummary(summaryData: Record<string, any>) {
    let summaryHTML = '<div class="summary"><h3>Resumen</h3><div class="summary-grid">'
    
    Object.entries(summaryData).forEach(([key, value]) => {
      summaryHTML += `
        <div class="summary-item">
          <span class="summary-label">${key}:</span>
          <span class="summary-value">${value}</span>
        </div>
      `
    })
    
    summaryHTML += '</div></div>'
    this.content.push(summaryHTML)
  }

  addTable(headers: string[], rows: string[][]) {
    let tableHTML = '<div class="table-container"><table><thead><tr>'
    headers.forEach(header => {
      tableHTML += `<th>${header}</th>`
    })
    tableHTML += '</tr></thead><tbody>'
    
    rows.forEach(row => {
      tableHTML += '<tr>'
      row.forEach(cell => {
        tableHTML += `<td>${cell}</td>`
      })
      tableHTML += '</tr>'
    })
    tableHTML += '</tbody></table></div>'
    
    this.content.push(tableHTML)
  }

  addFooter() {
    this.content.push(`
      <div class="footer">
        <p>Generado por Sistema de Inventario ELECTROLUXSTORE</p>
        <p>Página 1 - ${new Date().toLocaleDateString("es-ES")}</p>
      </div>
    `)
  }

  generateHTML(filename: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte - ELECTROLUXSTORE</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background-color: #f8f9fa;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header h1 { 
              margin: 0 0 10px 0; 
              font-size: 2.5em;
              font-weight: 300;
            }
            .system-info h2 { 
              margin: 10px 0 5px 0; 
              font-size: 1.2em; 
              font-weight: 400;
            }
            .system-info p { 
              margin: 5px 0; 
              opacity: 0.9;
            }
            .summary {
              background: white;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .summary h3 {
              margin: 0 0 15px 0;
              color: #495057;
              border-bottom: 2px solid #e9ecef;
              padding-bottom: 10px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 5px;
              border-left: 4px solid #dc2626;
            }
            .summary-label {
              font-weight: 600;
              color: #495057;
            }
            .summary-value {
              font-weight: 700;
              color: #dc2626;
            }
            .table-container {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
              margin: 20px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            th, td { 
              padding: 12px 15px; 
              text-align: left; 
              border-bottom: 1px solid #e9ecef;
            }
            th { 
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.85em;
              letter-spacing: 0.5px;
            }
            tr:hover {
              background-color: #f8f9fa;
            }
            tr:nth-child(even) {
              background-color: #fafbfc;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              padding: 20px;
              background: #343a40;
              color: white;
              border-radius: 8px;
              font-size: 0.9em;
            }
            .footer p {
              margin: 5px 0;
            }
            @media print {
              body { background-color: white; }
              .header, .table-container, .summary { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${this.content.join('')}
        </body>
      </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.html') ? filename : `${filename}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// ✅ FUNCIÓN PARA EXPORTAR MOVIMIENTOS A CSV (COMPATIBLE CON EXCEL)
export function exportMovementsToCSV(movements: Movement[], products: Product[]): void {
  if (!movements || movements.length === 0) {
    console.warn('No hay movimientos para exportar')
    return
  }

  const csvData = [
    "Fecha;Tipo;Producto;Codigo;Cantidad;Motivo;Stock Anterior;Stock Nuevo;Valor",
    ...movements.map(movement => {
      const product = products.find(p => p.id === movement.productId)
      const valor = (product?.price || 0) * movement.quantity
      
      return [
        new Date(movement.date).toLocaleDateString("es-ES"),
        movement.type === "entrada" ? "Entrada" : "Salida",
        (product?.name || "Producto eliminado").replace(/;/g, ","),
        product?.code || "N/A",
        movement.quantity,
        (movement.reason || "").replace(/;/g, ","),
        movement.previousQuantity || 0,
        movement.newQuantity || 0,
        valor.toLocaleString("es-ES")
      ].join(";")
    })
  ]

  const csvContent = csvData.join("\r\n")
  const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const csvBytes = new TextEncoder().encode(csvContent);
  const finalContent = new Uint8Array(BOM.length + csvBytes.length);
  finalContent.set(BOM);
  finalContent.set(csvBytes, BOM.length);
  
  const blob = new Blob([finalContent], { 
    type: "text/csv;charset=utf-8;" 
  })
  
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `movimientos-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ✅ FUNCIÓN PARA EXPORTAR INVENTARIO A CSV (COMPATIBLE CON EXCEL)
export function exportInventoryToCSV(products: Product[]): void {
  if (!products || products.length === 0) {
    console.warn('No hay productos para exportar')
    return
  }

  const csvData = [
    "Código;Nombre;Categoría;Stock Actual;Stock Mínimo;Costo;Precio;Valor Total;Estado",
    ...products.map(product => {
      const valorTotal = product.price * (product.quantity || 0)
      const estado = (product.quantity || 0) <= (product.minStock || 0) ? "Stock Bajo" : "Normal"
      
      return [
        product.code || product.id,
        (product.name || "").replace(/;/g, ","),
        (product.category || "").replace(/;/g, ","),
        product.quantity || 0,
        product.minStock || 0,
        `$${(product.cost || 0).toLocaleString("es-ES")}`,
        `$${product.price.toLocaleString("es-ES")}`,
        `$${valorTotal.toLocaleString("es-ES")}`,
        estado
      ].join(";")
    })
  ]

  const csvContent = "sep=;\n" + csvData.join("\n")
  const BOM = "\uFEFF"
  
  const blob = new Blob([BOM + csvContent], { 
    type: "text/csv;charset=utf-8;" 
  })
  
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `inventario-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ✅ FUNCIÓN PARA EXPORTAR MOVIMIENTOS A HTML
export function exportMovementsToHTML(movements: Movement[], products: Product[]): void {
  if (!movements || movements.length === 0) {
    console.warn('No hay movimientos para exportar')
    return
  }

  const generator = new HTMLToPDFGenerator()
  
  generator.addHeader('Reporte de Movimientos de Inventario - ELECTROLUXSTORE')
  
  const totalMovements = movements.length
  const entradas = movements.filter(m => m.type === 'entrada').length
  const salidas = movements.filter(m => m.type === 'salida').length
  const valorTotal = movements.reduce((sum, mov) => {
    const product = products.find(p => p.id === mov.productId)
    return sum + ((product?.price || 0) * mov.quantity)
  }, 0)

  generator.addSummary({
    'Total Movimientos': totalMovements,
    'Entradas': entradas,
    'Salidas': salidas,
    'Valor Total': `$${valorTotal.toLocaleString()}`
  })

  const headers = ['Fecha', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Motivo', 'Valor']
  const rows = movements.map(movement => {
    const product = products.find(p => p.id === movement.productId)
    return [
      new Date(movement.date).toLocaleDateString("es-ES"),
      product?.name || "Producto eliminado",
      product?.code || "N/A",
      movement.type === "entrada" ? "Entrada" : "Salida",
      movement.quantity.toString(),
      movement.reason,
      `$${((product?.price || 0) * movement.quantity).toLocaleString()}`
    ]
  })

  generator.addTable(headers, rows)
  generator.addFooter()
  generator.generateHTML('movimientos-electroluxstore')
}

// ✅ FUNCIÓN PARA EXPORTAR INVENTARIO A HTML
export function exportInventoryToHTML(products: Product[]): void {
  if (!products || products.length === 0) {
    console.warn('No hay productos para exportar')
    return
  }

  const generator = new HTMLToPDFGenerator()
  
  generator.addHeader('Reporte de Inventario - ELECTROLUXSTORE')
  
  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + (p.price * (p.quantity || 0)), 0)
  const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.minStock || 0)).length

  generator.addSummary({
    'Total Productos': totalProducts,
    'Valor Total': `$${totalValue.toLocaleString()}`,
    'Productos con Stock Bajo': lowStockItems,
    'Fecha': new Date().toLocaleDateString("es-ES")
  })

  const headers = ['Código', 'Nombre', 'Categoría', 'Stock', 'Precio', 'Valor Total', 'Estado']
  const rows = products.map(product => [
    product.code || product.id,
    product.name,
    product.category,
    (product.quantity || 0).toString(),
    `$${product.price.toLocaleString()}`,
    `$${(product.price * (product.quantity || 0)).toLocaleString()}`,
    (product.quantity || 0) <= (product.minStock || 0) ? 'Stock Bajo' : 'Normal'
  ])

  generator.addTable(headers, rows)
  generator.addFooter()
  generator.generateHTML('inventario-electroluxstore')
}

// ✅ FUNCIÓN PARA EXPORTAR CATEGORÍAS A HTML
export function exportCategoriesReportHTML(categories: any[]): void {
  if (!categories || categories.length === 0) {
    console.warn('No hay categorías para exportar')
    return
  }

  const generator = new HTMLToPDFGenerator()
  
  generator.addHeader('Reporte por Categorías - ELECTROLUXSTORE')
  
  const totalCategories = categories.length
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.products || 0), 0)
  const totalValue = categories.reduce((sum, cat) => sum + (cat.totalValue || 0), 0)

  generator.addSummary({
    'Total Categorías': totalCategories,
    'Total Productos': totalProducts,
    'Valor Total': `$${totalValue.toLocaleString()}`,
    'Fecha': new Date().toLocaleDateString("es-ES")
  })

  const headers = ['Categoría', 'Productos', 'Cantidad Total', 'Valor Total', 'Margen %']
  const rows = categories.map(cat => [
    cat.category || cat.name,
    (cat.products || 0).toString(),
    (cat.totalQuantity || 0).toString(),
    `$${(cat.totalValue || 0).toLocaleString()}`,
    `${(cat.marginPercentage || 0).toFixed(1)}%`
  ])

  generator.addTable(headers, rows)
  generator.addFooter()
  generator.generateHTML('categorias-electroluxstore')
}

// ✅ FUNCIÓN FALTANTE QUE CAUSABA EL ERROR DE BUILD
export function exportCustomReport(
  data: any[], 
  type: 'movements' | 'inventory' | 'categories',
  title: string,
  format: 'html' | 'csv' | 'excel' = 'html'
): void {
  if (!data || data.length === 0) {
    console.warn(`No hay datos de ${type} para exportar`)
    return
  }

  const generator = new HTMLToPDFGenerator()
  
  generator.addHeader(`${title} - ELECTROLUXSTORE`)
  
  // Generar resumen dinámico basado en el tipo
  const summaryData: Record<string, any> = {
    'Total Registros': data.length,
    'Fecha de Generación': new Date().toLocaleDateString("es-ES"),
    'Tipo de Reporte': type.charAt(0).toUpperCase() + type.slice(1)
  }
  
  generator.addSummary(summaryData)
  
  // Generar tabla basada en el tipo de datos
  if (data.length > 0) {
    const headers = Object.keys(data[0])
    const rows = data.map(item => 
      headers.map(header => String(item[header] || ''))
    )
    
    generator.addTable(headers, rows)
  }
  
  generator.addFooter()
  generator.generateHTML(`${type}-custom-report`)
}

// ✅ FUNCIÓN PRINCIPAL PARA REPORTES DE MOVIMIENTOS
export function exportMovementsReport(movements: Movement[], products: Product[], format: 'excel' | 'html' | 'csv' = 'csv'): void {
  switch (format) {
    case 'html':
      exportMovementsToHTML(movements, products)
      break
    case 'csv':
      exportMovementsToCSV(movements, products)
      break
    case 'excel':
    default:
      exportMovementsToExcel(movements)
      break
  }
}

// ✅ EXPORTACIONES LIMPIAS (sin duplicados)
export { HTMLToPDFGenerator }

// Re-exportar funciones de excel-export
export {
  exportMovementsToExcel,
  exportInventoryToExcel,
  exportCategoriesToExcel,
  exportInventoryReport,
  exportCategoriesReport
}

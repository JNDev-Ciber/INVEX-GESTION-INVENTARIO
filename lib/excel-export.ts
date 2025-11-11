// excel-export.ts
import type { Product, Movement } from "../types/inventory"

// ✅ FUNCIÓN AUXILIAR OPTIMIZADA PARA LIMPIAR CARACTERES ESPECIALES
function cleanText(text: any): string {
  if (typeof text !== 'string') return String(text || '');
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, acentos)
    .replace(/[;]/g, ",")
    .replace(/["\n\r]/g, " ")
    .replace(/\s+/g, " ") // Múltiples espacios a uno solo
    .trim();
}

// ✅ FUNCIÓN AUXILIAR PARA EXPORTAR A CSV CON ENCODING CORRECTO
function exportToCSV(
  data: string[][],
  headers: string[],
  filename: string = "export-electroluxstore.csv"
): void {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Limpiar headers
  const cleanHeaders = headers.map(header => cleanText(header));
  
  // Limpiar datos
  const cleanData = data.map(row => 
    row.map(cell => cleanText(cell))
  );

  // Crear contenido CSV con separador de punto y coma para Excel
  const csvContent = [
    "sep=;", // Indica a Excel que use punto y coma como separador
    cleanHeaders.join(";"),
    ...cleanData.map(row => row.join(";"))
  ].join("\n");

  // Agregar BOM UTF-8 para compatibilidad con Excel
  const BOM = "\uFEFF";
  const finalContent = BOM + csvContent;

  // Crear y descargar archivo
  const blob = new Blob([finalContent], { 
    type: "text/csv;charset=utf-8;" 
  });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ✅ EXPORTAR INVENTARIO A EXCEL (CSV COMPATIBLE)
export function exportInventoryToExcel(products: Product[]): void {
  if (!products || products.length === 0) {
    console.warn('No hay productos para exportar');
    return;
  }

  const headers = [
    "Codigo",
    "Nombre",
    "Categoria", 
    "Subcategoria",
    "Stock Actual",
    "Stock Minimo",
    "Costo Unitario",
    "Precio Venta",
    "Margen",
    "Valor Total Stock",
    "Estado"
  ];

  const data = products.map(product => {
    const stockActual = product.quantity || 0;
    const stockMinimo = product.minStock || 0;
    const costo = product.cost || 0;
    const precio = product.price || 0;
    const margen = costo > 0 ? ((precio - costo) / costo * 100) : 0;
    const valorTotal = precio * stockActual;
    const estado = stockActual <= stockMinimo ? "Stock Bajo" : "Normal";

    return [
      product.code || product.id,
      product.name || "",
      product.category || "",
      product.subcategory || "",
      stockActual.toString(),
      stockMinimo.toString(),
      `$${costo.toLocaleString("es-ES")}`,
      `$${precio.toLocaleString("es-ES")}`,
      `${margen.toFixed(1)}%`,
      `$${valorTotal.toLocaleString("es-ES")}`,
      estado
    ];
  });

  exportToCSV(data, headers, `inventario-electroluxstore-${new Date().toISOString().split('T')[0]}.csv`);
}

// ✅ EXPORTAR INVENTARIO A HTML
export function exportInventoryToHTML(products: Product[]): void {
  if (!products || products.length === 0) {
    console.warn('No hay productos para exportar');
    return;
  }

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * (p.quantity || 0)), 0);
  const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.minStock || 0)).length;

  let tableRows = '';
  products.forEach(product => {
    const stockActual = product.quantity || 0;
    const stockMinimo = product.minStock || 0;
    const valorTotal = product.price * stockActual;
    const estado = stockActual <= stockMinimo ? 'Stock Bajo' : 'Normal';
    const estadoClass = stockActual <= stockMinimo ? 'low-stock' : 'normal-stock';

    tableRows += `
      <tr class="${estadoClass}">
        <td>${product.code || product.id}</td>
        <td>${product.name}</td>
        <td>${product.category || ''}</td>
        <td>${stockActual}</td>
        <td>${stockMinimo}</td>
        <td>$${product.price.toLocaleString()}</td>
        <td>$${valorTotal.toLocaleString()}</td>
        <td><span class="status ${estadoClass}">${estado}</span></td>
      </tr>
    `;
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inventario ELECTROLUXSTORE</title>
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
          .header h2 { 
            margin: 10px 0 5px 0; 
            font-size: 1.2em; 
            font-weight: 400;
          }
          .summary {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .summary-item {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #dc2626;
          }
          .summary-label {
            display: block;
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
          }
          .summary-value {
            display: block;
            font-size: 1.5em;
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
          .low-stock {
            background-color: #fff5f5 !important;
          }
          .low-stock:hover {
            background-color: #fed7d7 !important;
          }
          .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
          }
          .status.normal-stock {
            background-color: #d4edda;
            color: #155724;
          }
          .status.low-stock {
            background-color: #f8d7da;
            color: #721c24;
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
          @media print {
            body { background-color: white; }
            .header, .table-container, .summary { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Inventario</h1>
          <h2>Sistema ELECTROLUXSTORE</h2>
          <p>Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">Total Productos</span>
            <span class="summary-value">${totalProducts}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Valor Total</span>
            <span class="summary-value">$${totalValue.toLocaleString()}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Stock Bajo</span>
            <span class="summary-value">${lowStockItems}</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Stock</th>
                <th>Min Stock</th>
                <th>Precio</th>
                <th>Valor Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Generado por Sistema de Inventario ELECTROLUXSTORE</p>
          <p>Pagina 1 - ${new Date().toLocaleDateString("es-ES")}</p>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventario-electroluxstore-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


// ✅ EXPORTAR MOVIMIENTOS A EXCEL (CSV COMPATIBLE)
export function exportMovementsToExcel(movements: Movement[]): void {
  if (!movements || movements.length === 0) {
    console.warn('No hay movimientos para exportar');
    return;
  }

  const headers = [
    "Fecha",
    "Tipo",
    "Producto ID",
    "Cantidad",
    "Motivo",
    "Stock Anterior",
    "Stock Nuevo"
  ];

  const data = movements.map(movement => [
    new Date(movement.date).toLocaleDateString("es-ES"),
    movement.type === "entrada" ? "Entrada" : "Salida",
    movement.productId ?? "N/A",  // ⬅️ Cambiar esto para manejar null
    movement.quantity.toString(),
    movement.reason ?? "",         // ⬅️ Cambiar || por ?? para ser más explícito
    (movement.previousQuantity ?? 0).toString(),  // ⬅️ Cambiar || por ??
    (movement.newQuantity ?? 0).toString()        // ⬅️ Cambiar || por ??
  ]);

  exportToCSV(data, headers, `movimientos-electroluxstore-${new Date().toISOString().split('T')[0]}.csv`);
}


// ✅ EXPORTAR VENTAS A EXCEL
export function exportSalesToExcel(sales: any[]): void {
  if (!sales || sales.length === 0) {
    console.warn('No hay ventas para exportar');
    return;
  }

  const headers = [
    "Fecha",
    "Cliente",
    "Producto",
    "Cantidad",
    "Precio Unitario",
    "Total",
    "Metodo Pago"
  ];

  const data = sales.map(sale => [
    new Date(sale.date).toLocaleDateString("es-ES"),
    sale.customer || "Cliente General",
    sale.product || "",
    sale.quantity?.toString() || "1",
    `$${(sale.unitPrice || 0).toLocaleString("es-ES")}`,
    `$${(sale.total || 0).toLocaleString("es-ES")}`,
    sale.paymentMethod || "Efectivo"
  ]);

  exportToCSV(data, headers, `ventas-electroluxstore-${new Date().toISOString().split('T')[0]}.csv`);
}

// ✅ EXPORTAR REPORTE DE CATEGORIAS
export function exportCategoriesReport(categories: any[]): void {
  if (!categories || categories.length === 0) {
    console.warn('No hay categorías para exportar');
    return;
  }

  const headers = [
    "Categoria",
    "Total Productos",
    "Cantidad Total",
    "Valor Total",
    "Margen Promedio"
  ];

  const data = categories.map(category => [
    category.name || category.category || "",
    (category.products || 0).toString(),
    (category.totalQuantity || 0).toString(),
    `$${(category.totalValue || 0).toLocaleString("es-ES")}`,
    `${(category.averageMargin || 0).toFixed(1)}%`
  ]);

  exportToCSV(data, headers, `categorias-electroluxstore-${new Date().toISOString().split('T')[0]}.csv`);
}

// ✅ ALIAS PARA EXPORTAR CATEGORIAS A EXCEL
export function exportCategoriesToExcel(categories: any[]): void {
  exportCategoriesReport(categories);
}

// ✅ ALIAS PARA REPORTE DE INVENTARIO (COMPATIBILIDAD)
export function exportInventoryReport(products: Product[]): void {
  exportInventoryToHTML(products);
}

// ✅ EXPORTACIONES LIMPIAS
export default {
  exportInventoryToExcel,
  exportInventoryToHTML,
  exportMovementsToExcel,
  exportSalesToExcel,
  exportCategoriesReport,
  exportCategoriesToExcel,
  exportInventoryReport
};

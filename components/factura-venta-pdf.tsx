import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Interfaces que coinciden con las del formulario
interface Product {
  id: string
  name: string
  code: string
  category: string
  price: number
  quantity: number
  description?: string
}

interface FacturaVentaItem {
  id: string
  producto: Product
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface DatosCliente {
  nombre: string
  cuit: string
  direccion?: string
  telefono?: string
  email?: string
}

interface FacturaVenta {
  id: string
  numero: string
  fecha: string
  cliente: DatosCliente
  items: FacturaVentaItem[]
  subtotal: number
  iva: number
  total: number
  observaciones: string
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  companyInfo: {
    marginBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 3,
  },
  companySubtitle: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  invoiceDetails: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },
  clientSection: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  clientGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clientColumn: {
    flex: 1,
    marginRight: 20,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#333333',
  },
  boldText: {
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  colCodigo: { width: '12%' },
  colProducto: { width: '38%' },
  colCantidad: { width: '12%', textAlign: 'center' },
  colPrecio: { width: '19%', textAlign: 'right' },
  colSubtotal: { width: '19%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsContainer: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 5,
  },
  totalText: {
    fontSize: 10,
    color: '#374151',
  },
  totalTextFinal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  garantiaBox: {
    width: 280,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 8,
  },
  garantiaTitulo: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  garantiaTexto: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.3,
    marginBottom: 2,
  },
  footerRight: {
    textAlign: 'center',
    fontSize: 7,
    color: '#666666',
  },
})

interface FacturaVentaPDFProps {
  factura: FacturaVenta
  porcentajeIva: number
}

const FacturaVentaPDF: React.FC<FacturaVentaPDFProps> = ({ factura, porcentajeIva }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>ELECTROLUXSTORE</Text>
            <Text style={styles.companySubtitle}>Sistema de Gestión de Inventarios</Text>
            <View style={styles.companyDetails}>
              <Text>Dirección: Calle Hector Varas 670</Text>
              <Text>Teléfono: +54 9 3573 41-4552</Text>
              <Text>Email: emi-carrerra16@hotmail.com</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.title}>FACTURA DE VENTA</Text>
          <View style={styles.invoiceDetails}>
            <Text><Text style={styles.boldText}>Número:</Text> {factura.numero}</Text>
            <Text><Text style={styles.boldText}>Fecha:</Text> {new Date(factura.fecha).toLocaleDateString('es-AR')}</Text>
          </View>
        </View>
      </View>

      {/* Datos del cliente */}
      <View style={styles.clientSection}>
        <Text style={styles.sectionTitle}>Datos del Cliente</Text>
        <View style={styles.clientGrid}>
          <View style={styles.clientColumn}>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Nombre:</Text> {factura.cliente.nombre}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>CUIT/DNI:</Text> {factura.cliente.cuit || 'N/A'}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Dirección:</Text> {factura.cliente.direccion || 'N/A'}
            </Text>
          </View>
          <View style={styles.clientColumn}>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Teléfono:</Text> {factura.cliente.telefono || 'N/A'}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Email:</Text> {factura.cliente.email || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabla de items */}
      <View style={styles.table}>
        {/* Header de la tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, styles.colCodigo]}>Código</Text>
          <Text style={[styles.tableCellHeader, styles.colProducto]}>Producto</Text>
          <Text style={[styles.tableCellHeader, styles.colCantidad]}>Cantidad</Text>
          <Text style={[styles.tableCellHeader, styles.colPrecio]}>Precio Unit.</Text>
          <Text style={[styles.tableCellHeader, styles.colSubtotal]}>Subtotal</Text>
        </View>

        {/* Filas de la tabla */}
        {factura.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colCodigo]}>{item.producto.code}</Text>
            <Text style={[styles.tableCell, styles.colProducto]}>{item.producto.name}</Text>
            <Text style={[styles.tableCell, styles.colCantidad]}>{item.cantidad}</Text>
            <Text style={[styles.tableCell, styles.colPrecio]}>${item.precioUnitario.toLocaleString()}</Text>
            <Text style={[styles.tableCell, styles.colSubtotal]}>${item.subtotal.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Subtotal:</Text>
            <Text style={styles.totalText}>${factura.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>IVA ({porcentajeIva}%):</Text>
            <Text style={styles.totalText}>${factura.iva.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalTextFinal}>TOTAL:</Text>
            <Text style={styles.totalTextFinal}>${factura.total.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Observaciones */}
      {factura.observaciones && factura.observaciones.trim() && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Observaciones</Text>
          <Text style={styles.text}>{factura.observaciones}</Text>
        </View>
      )}

      {/* Footer con garantía */}
      <View style={styles.footer}>
        <View style={styles.garantiaBox}>
          <Text style={styles.garantiaTitulo}>TÉRMINOS DE GARANTÍA</Text>
          <Text style={styles.garantiaTexto}>
            • La garantía cubre defectos de fabricación y materiales.
          </Text>
          <Text style={styles.garantiaTexto}>
            • La garantía no cubre daños causados por uso indebido, negligencia o accidentes.
          </Text>
          <Text style={styles.garantiaTexto}>
            • Para hacer efectiva la garantía, el cliente saldo presentar este recibo y el producto defectuoso.
          </Text>
          <Text style={styles.garantiaTexto}>
            • El cliente saldo devolver el producto defectuoso con su caja y accesorios en condiciones admisibles.
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Text>ELECTROLUXSTORE - Sistema de Gestión de Inventarios</Text>
          <Text>Factura de venta generada electrónicamente</Text>
        </View>
      </View>
    </Page>
  </Document>
)

export default FacturaVentaPDF
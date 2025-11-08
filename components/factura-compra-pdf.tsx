import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface FacturaCompraPDFProps {
  factura: {
    numero: string
    fecha: string
    proveedor: {
      nombre: string
      cuit: string
      direccion?: string
      telefono?: string
      email?: string
    }
    items: Array<{
      id: string
      producto: {
        code: string
        name: string
      }
      cantidad: number
      costoUnitario: number
      precioVentaUnitario: number
      subtotal: number
    }>
    subtotal: number
    iva: number
    total: number
    observaciones: string
  }
  porcentajeIva: number
}

// Utilidad para truncar el código si es muy largo
const truncateText = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + '…' : text

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#dc2626',
    paddingBottom: 10,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 2,
  },
  companySubtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.3,
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  invoiceDetails: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.4,
  },
  proveedorSection: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  proveedorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  proveedorColumn: {
    flexDirection: 'column',
    width: '48%',
  },
  proveedorItem: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 2,
    lineHeight: 1.3,
  },
  tableContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#dc2626',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 30,
    alignItems: 'center', // ✅ Centrado vertical
  },
  cellCode: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  cellProduct: {
    width: 220,
    justifyContent: 'center',
    alignItems: 'center', // ✅ Centrado vertical
    paddingHorizontal: 2,
    flexShrink: 1,
  },
  cellQty: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  cellCost: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  cellPrice: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  cellTotal: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 8,
    color: '#333333',
    textAlign: 'center',
  },
  cellTextRight: {
    fontSize: 8,
    color: '#333333',
    textAlign: 'right',
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsBox: {
    width: 200,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 10,
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#dc2626',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  observaciones: {
    marginBottom: 20,
  },
  observacionesText: {
    fontSize: 9,
    color: '#333333',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 4,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.3,
  },
})

export const FacturaCompraPDF: React.FC<FacturaCompraPDFProps> = ({ factura, porcentajeIva }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>ELECTROLUXSTORE</Text>
            <Text style={styles.companySubtitle}>Sistema de Gestión de Inventarios</Text>
            <View style={styles.companyDetails}>
              <Text>Dirección: Calle Hector Varas 670</Text>
              <Text>Teléfono: +54 9 3573 41-4552</Text>
              <Text>Email: electrolux.vdr@gmail.com</Text>
            </View>
          </View>
        </View>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceTitle}>FACTURA DE COMPRA</Text>
          <View style={styles.invoiceDetails}>
            <Text>Número: {factura.numero}</Text>
            <Text>Fecha: {new Date(factura.fecha).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      {/* Datos del proveedor */}
      <View style={styles.proveedorSection}>
        <Text style={styles.sectionTitle}>DATOS DEL PROVEEDOR</Text>
        <View style={styles.proveedorGrid}>
          <View style={styles.  proveedorColumn}>
            <Text style={styles.proveedorItem}>Nombre: {factura.proveedor.nombre}</Text>
            <Text style={styles.proveedorItem}>CUIT/DNI: {factura.proveedor.cuit}</Text>
            <Text style={styles.proveedorItem}>Dirección: {factura.proveedor.direccion}</Text>
          </View>
          <View style={styles.proveedorColumn}>
            <Text style={styles.proveedorItem}>Teléfono: {factura.proveedor.telefono}</Text>
            <Text style={styles.proveedorItem}>Email: {factura.proveedor.email}</Text>
          </View>
        </View>
      </View>

      {/* Tabla de productos */}
      <View style={styles.tableContainer}>
        {/* Header de la tabla */}
        <View style={styles.tableHeader}>
          <View style={styles.cellCode}>
            <Text style={styles.headerText}>Código</Text>
          </View>
          <View style={styles.cellProduct}>
            <Text style={styles.headerText}>Producto</Text>
          </View>
          <View style={styles.cellQty}>
            <Text style={styles.headerText}>Cant.</Text>
          </View>
          <View style={styles.cellCost}>
            <Text style={styles.headerText}>Costo Unit.</Text>
          </View>
          <View style={styles.cellPrice}>
            <Text style={styles.headerText}>Precio Venta</Text>
          </View>
          <View style={styles.cellTotal}>
            <Text style={styles.headerText}>Subtotal</Text>
          </View>
        </View>
        {/* Filas de datos */}
        {factura.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.cellCode}>
              <Text style={styles.cellText}>{truncateText(item.producto.code, 12)}</Text>
            </View>
            <View style={styles.cellProduct}>
              <Text style={styles.cellText}>{item.producto.name}</Text>
            </View>
            <View style={styles.cellQty}>
              <Text style={styles.cellText}>{item.cantidad}</Text>
            </View>
            <View style={styles.cellCost}>
              <Text style={styles.cellTextRight}>${item.costoUnitario.toLocaleString()}</Text>
            </View>
            <View style={styles.cellPrice}>
              <Text style={styles.cellTextRight}>${item.precioVentaUnitario.toLocaleString()}</Text>
            </View>
            <View style={styles.cellTotal}>
              <Text style={styles.cellTextRight}>${item.subtotal.toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>${factura.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IVA ({porcentajeIva}%):</Text>
            <Text>${factura.iva.toLocaleString()}</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text>TOTAL:</Text>
            <Text>${factura.total.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Observaciones */}
      {factura.observaciones && (
        <View style={styles.observaciones}>
          <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
          <Text style={styles.observacionesText}>{factura.observaciones}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ELECTROLUXSTORE - Sistema de Gestión de Inventarios</Text>
        <Text style={styles.footerText}>Factura de compra generada electrónicamente</Text>
      </View>
    </Page>
  </Document>
)

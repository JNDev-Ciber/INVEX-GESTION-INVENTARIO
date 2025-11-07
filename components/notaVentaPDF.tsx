"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ClienteVenta, VentaFiado } from '../types/inventory';

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
  colProducto: { width: '50%' },
  colCantidad: { width: '15%', textAlign: 'center' },
  colPrecio: { width: '17.5%', textAlign: 'right' },
  colSubtotal: { width: '17.5%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsContainer: {
    width: 200,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 5,
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
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 7,
    color: '#666666',
  },
});

interface NotaVentaPDFProps {
  cliente: ClienteVenta;
  venta: VentaFiado;
}

const NotaVentaPDF: React.FC<NotaVentaPDFProps> = ({ cliente, venta }) => (
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
          <Text style={styles.title}>NOTA DE VENTA</Text>
          <View style={styles.invoiceDetails}>
            <Text><Text style={styles.boldText}>Número:</Text> {venta.id}</Text>
            <Text><Text style={styles.boldText}>Fecha:</Text> {new Date(venta.fecha).toLocaleDateString('es-AR')}</Text>
          </View>
        </View>
      </View>

      {/* Datos del cliente */}
      <View style={styles.clientSection}>
        <Text style={styles.sectionTitle}>Datos del Cliente</Text>
        <View style={styles.clientGrid}>
          <View style={styles.clientColumn}>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Nombre:</Text> {cliente.nombre}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>CUIT:</Text> {cliente.cuit || 'N/A'}
            </Text>
          </View>
          <View style={styles.clientColumn}>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Teléfono:</Text> {cliente.telefono || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabla de productos */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, styles.colProducto]}>Producto</Text>
          <Text style={[styles.tableCellHeader, styles.colCantidad]}>Cantidad</Text>
          <Text style={[styles.tableCellHeader, styles.colPrecio]}>Precio Unit.</Text>
          <Text style={[styles.tableCellHeader, styles.colSubtotal]}>Subtotal</Text>
        </View>

        {venta.detalles?.map((detalle) => (
          <View key={detalle.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colProducto]}>{detalle.productoNombre}</Text>
            <Text style={[styles.tableCell, styles.colCantidad]}>{detalle.cantidad}</Text>
            <Text style={[styles.tableCell, styles.colPrecio]}>${detalle.precioUnitario.toLocaleString()}</Text>
            <Text style={[styles.tableCell, styles.colSubtotal]}>${detalle.subtotal.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsContainer}>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalTextFinal}>TOTAL:</Text>
            <Text style={styles.totalTextFinal}>${venta.total.toLocaleString()}</Text>
          </View>
          {venta.saldoPendiente > 0 && (
            <View style={styles.totalRowFinal}>
              <Text style={[styles.totalTextFinal, { color: '#dc2626' }]}>SALDO PENDIENTE:</Text>
              <Text style={[styles.totalTextFinal, { color: '#dc2626' }]}>${venta.saldoPendiente.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>ELECTROLUXSTORE - Sistema de Gestión de Inventarios</Text>
        <Text>Nota de venta generada electrónicamente</Text>
      </View>
    </Page>
  </Document>
);

export default NotaVentaPDF;

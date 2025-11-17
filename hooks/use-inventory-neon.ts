"use client";

import { useState, useEffect } from "react";
import { sql, testConnection, checkConfiguration } from "../lib/neon";
import type {
  Product,
  Movement,
  PriceHistory,
  StockAlert,
  ClienteVenta,
  VentaFiado,
  VentaFiadoDetalle,
  Pago,
} from "../types/inventory";

export function useInventoryNeon() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [clientesVentas, setClientesVentas] = useState<ClienteVenta[]>([]);
  const [ventasFiado, setVentasFiado] = useState<VentaFiado[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error" | "offline"
  >("connecting");

  useEffect(() => {
    initializeConnection();
  }, []);

  const initializeConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus("connecting");

      console.log("🚀 Iniciando conexión a Neon...");

      const config = checkConfiguration();
      if (!config.hasUrl) {
        throw new Error(
          "Variable de entorno DATABASE_URL no configurada correctamente"
        );
      }

      if (!config.urlValid) {
        throw new Error("URL de Neon inválida. Debe ser una URL de neon.tech");
      }

      const connectionTest = await testConnection();
      console.log("📊 Resultado de conexión:", connectionTest);

      if (!connectionTest.success) {
        setConnectionStatus("error");

        let userFriendlyMessage = connectionTest.message;

        switch (connectionTest.errorType) {
          case "TABLE_NOT_FOUND":
            userFriendlyMessage =
              "⚠️ Las tablas no existen en la base de datos. Ejecuta el script SQL para crear las tablas 'productos', 'categorias', 'movimientos' y 'alertas_stock'.";
            break;
          case "INVALID_CREDENTIALS":
            userFriendlyMessage =
              "🔑 Credenciales inválidas. Verifica que DATABASE_URL sea correcta.";
            break;
          case "PERMISSION_DENIED":
            userFriendlyMessage =
              "🚫 Sin permisos. Verifica la configuración de tu base de datos en Neon.";
            break;
          case "NETWORK_ERROR":
            userFriendlyMessage =
              "🌐 Error de red. Verifica tu conexión a internet y la URL de Neon.";
            break;
        }

        throw new Error(userFriendlyMessage);
      }

      setConnectionStatus("connected");
      console.log("✅ Conexión establecida, cargando datos...");

      await loadAllData();
    } catch (err) {
      console.error("❌ Error en inicialización:", err);
      setConnectionStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Error al conectar con la base de datos"
      );

      console.log("📱 Activando modo offline con datos de ejemplo...");
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    console.log("📋 Cargando datos de ejemplo...");

    const sampleProducts: Product[] = [
      {
        id: "sample-1",
        code: "TECH-NB-001",
        name: "Notebook Dell Inspiron 15 (DEMO)",
        category: "Notebooks",
        subcategory: "Gaming",
        price: 950000,
        cost: 690000,
        quantity: 11,
        minStock: 4,
        description: "Datos de ejemplo - Notebook Intel Core i5, 8GB RAM",
        imageUrl: "",
        barcode: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sample-2",
        code: "TECH-KB-001",
        name: "Teclado Mecánico Logitech G Pro (DEMO)",
        category: "Periféricos",
        subcategory: "Gaming",
        price: 135000,
        cost: 85000,
        quantity: 2,
        minStock: 8,
        description: "Datos de ejemplo - Teclado mecánico gaming",
        imageUrl: "",
        barcode: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sample-3",
        code: "TECH-NB-002",
        name: "Notebook HP Pavilion Gaming (DEMO)",
        category: "Notebooks",
        subcategory: "Ultrabook",
        price: 950000,
        cost: 690000,
        quantity: 1,
        minStock: 4,
        description: "Datos de ejemplo - Notebook gaming",
        imageUrl: "",
        barcode: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    setProducts(sampleProducts);
    setMovements([]);
    setPriceHistory([]);
    setClientesVentas([]);
    setVentasFiado([]);
    setPagos([]);
    setConnectionStatus("offline");
  };

  const loadAllData = async () => {
    try {
      setError(null);
      console.log("📊 Cargando datos desde Neon...");

      const productosData = await sql`
        SELECT 
          p.id,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.stock_actual,
          p.stock_minimo,
          p.costo_unitario,
          p.precio_venta,
          p.valor_total,
          p.imagen_url,
          p.codigo_barras,
          c.nombre as categoria_nombre,
          s.nombre as subcategoria_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
        WHERE p.deleted_at IS NULL
        ORDER BY p.nombre ASC
      `;

      console.log("✅ Productos cargados:", productosData?.length || 0);

      const movimientosData = await sql`
        SELECT 
          id,
          producto_id,
          fecha,
          tipo,
          cantidad,
          motivo,
          stock_antes,
          stock_despues,
          valor_total
        FROM movimientos 
        ORDER BY fecha DESC
      `;

      console.log("✅ Movimientos cargados:", movimientosData?.length || 0);

      const clientesData = await sql`
        SELECT * FROM clientes_ventas 
        ORDER BY nombre ASC
      `;

      console.log("✅ Clientes cargados:", clientesData?.length || 0);

      const ventasData = await sql`
        SELECT 
          vf.id,
          vf.cliente_id,
          vf.fecha,
          vf.total,
          vf.saldo_pendiente,
          vf.created_at,
          json_agg(
            json_build_object(
              'id', vfd.id,
              'ventaFiadoId', vfd.venta_fiado_id,
              'productoId', vfd.producto_id,
              'productoNombre', vfd.producto_nombre,
              'cantidad', vfd.cantidad,
              'precioUnitario', vfd.precio_unitario,
              'subtotal', vfd.subtotal,
              'pagado', vfd.pagado,
              'pagadoEn', vfd.pagado_en
            ) ORDER BY vfd.id
          ) FILTER (WHERE vfd.id IS NOT NULL) as detalles
        FROM ventas_fiado vf
        LEFT JOIN ventas_fiado_detalle vfd ON vf.id = vfd.venta_fiado_id
        GROUP BY vf.id
        ORDER BY vf.fecha DESC
      `;

      console.log("✅ Ventas a crédito cargadas:", ventasData?.length || 0);

      const pagosData = await sql`
        SELECT * FROM pagos ORDER BY fecha DESC
      `;

      console.log("✅ Pagos cargados:", pagosData?.length || 0);

      const mappedProducts: Product[] = (productosData || []).map(
        (item: any) => ({
          id: item.id,
          code: item.codigo,
          name: item.nombre,
          category: item.categoria_nombre || "Sin categoría",
          subcategory: item.subcategoria_nombre || "",
          price: item.precio_venta,
          cost: item.costo_unitario,
          quantity: item.stock_actual,
          minStock: item.stock_minimo,
          description: item.descripcion || "",
          imageUrl: item.imagen_url || "",
          barcode: item.codigo_barras || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );

      const mappedMovements: Movement[] = (movimientosData || []).map(
        (item: any) => ({
          id: item.id,
          productId: item.producto_id,
          type: item.tipo.toLowerCase() === "entrada" ? "entrada" : "salida",
          quantity: item.cantidad,
          reason: item.motivo || "Sin motivo especificado",
          date: item.fecha,
          previousQuantity: item.stock_antes,
          newQuantity: item.stock_despues,
          valor_total: item.valor_total,
        })
      );

      const mappedClientes: ClienteVenta[] = (clientesData || []).map(
        (c: any) => ({
          id: c.id,
          nombre: c.nombre,
          telefono: c.telefono,
          cuit: c.cuit,
          email: c.email,
          direccion: c.direccion,
          saldoPendiente: parseFloat(c.saldo_pendiente) || 0,
        })
      );

      const mappedVentas: VentaFiado[] = (ventasData || []).map((v: any) => ({
        id: v.id,
        clienteId: v.cliente_id,
        fecha: v.fecha,
        total: parseFloat(v.total),
        saldoPendiente: parseFloat(v.saldo_pendiente),
        createdAt: v.created_at,
        detalles: (v.detalles || [])
          .filter((d: any) => d && d.id !== null)
          .map((d: any) => ({
            id: d.id,
            ventaFiadoId: d.ventaFiadoId,
            productoId: d.productoId,
            productoNombre: d.productoNombre,
            cantidad: d.cantidad,
            precioUnitario: parseFloat(d.precioUnitario),
            subtotal: parseFloat(d.subtotal),
            pagado: d.pagado,
            pagadoEn: d.pagadoEn,
          })),
      }));

      setProducts(mappedProducts);
      setMovements(mappedMovements);
      setPriceHistory([]);
      setClientesVentas(mappedClientes);
      setVentasFiado(mappedVentas);
      setPagos(pagosData as any[]);

      console.log("🎉 Todos los datos cargados exitosamente");
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      throw err;
    }
  };

  const addProduct = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt"> & {
      subcategory?: string;
      imageUrl?: string;
    }
  ) => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error(
          "No hay conexión a la base de datos. Funcionalidad limitada en modo offline."
        );
      }

      let categoriaId;
      const categoriaResult = await sql`
        SELECT id FROM categorias 
        WHERE nombre = ${productData.category}
        LIMIT 1
      `;
      if (categoriaResult.length === 0) {
        const newCategoria = await sql`
          INSERT INTO categorias (nombre) 
          VALUES (${productData.category}) 
          RETURNING id
        `;
        categoriaId = newCategoria[0].id;
      } else {
        categoriaId = categoriaResult[0].id;
      }

      let subcategoriaId = null;
      if (productData.subcategory) {
        const subcatResult = await sql`
          SELECT id FROM subcategorias 
          WHERE nombre = ${productData.subcategory} AND categoria_id = ${categoriaId}
          LIMIT 1
        `;
        if (subcatResult.length === 0) {
          const newSubcat = await sql`
            INSERT INTO subcategorias (nombre, categoria_id)
            VALUES (${productData.subcategory}, ${categoriaId})
            RETURNING id
          `;
          subcategoriaId = newSubcat[0].id;
        } else {
          subcategoriaId = subcatResult[0].id;
        }
      }

      await sql`
        INSERT INTO productos (
          codigo, nombre, descripcion, categoria_id, subcategoria_id, stock_actual, 
          stock_minimo, costo_unitario, precio_venta, imagen_url, codigo_barras
        ) VALUES (
          ${productData.code}, ${productData.name}, ${
        productData.description || null
      }, 
          ${categoriaId}, ${subcategoriaId}, ${productData.quantity}, ${
        productData.minStock
      }, 
          ${productData.cost}, ${productData.price}, ${
        productData.imageUrl || null
      }, 
          ${productData.barcode || null}
        )
      `;

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al agregar producto";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addCliente = async (nombre: string, cuit: string, telefono: string) => {
    try {
      setError(null);
      if (connectionStatus === "offline")
        throw new Error("No hay conexión a la base de datos.");

      const result = await sql`
        INSERT INTO clientes_ventas (nombre, cuit, telefono)
        VALUES (${nombre}, ${cuit ? cuit : null}, ${telefono})
        RETURNING id, nombre, cuit, telefono, direccion, email, saldo_pendiente
      `;

      await loadAllData();

      return result[0];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al agregar cliente";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addDeudaDirecta = async (
    clienteId: number,
    monto: number,
    concepto: string
  ): Promise<boolean> => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error("No hay conexión a la base de datos.");
      }

      if (monto <= 0) {
        throw new Error("El monto debe ser mayor a 0");
      }

      const today = new Date().toISOString().split("T")[0];

      console.log(
        `💰 Registrando deuda manual de $${monto} para cliente ${clienteId}`
      );

      // Crear una venta sin productos
      const ventaResult = await sql`
        INSERT INTO ventas_fiado (cliente_id, total, saldo_pendiente)
        VALUES (${clienteId}, ${monto}, ${monto})
        RETURNING id
      `;

      const ventaId = ventaResult[0].id;

      // Insertar un detalle especial para la deuda manual
      await sql`
        INSERT INTO ventas_fiado_detalle 
        (venta_fiado_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
        VALUES (${ventaId}, NULL, ${
        concepto || "Deuda manual"
      }, 1, ${monto}, ${monto})
      `;

      // Actualizar saldo del cliente
      await sql`
        UPDATE clientes_ventas 
        SET saldo_pendiente = saldo_pendiente + ${monto}
        WHERE id = ${clienteId}
      `;

      // Obtener nombre del cliente para el movimiento
      const clienteData = await sql`
        SELECT nombre FROM clientes_ventas WHERE id = ${clienteId}
      `;
      const clienteNombre = clienteData[0]?.nombre || `Cliente ${clienteId}`;

      // Registrar movimiento
      await sql`
        INSERT INTO movimientos (
          producto_id, fecha, tipo, cantidad, motivo, 
          stock_antes, stock_despues, valor_total
        ) VALUES (
          NULL, 
          ${new Date().toISOString()},, 
          'Salida', 
          0, 
          ${`DEUDA MANUAL - ${clienteNombre}: ${concepto || "Sin concepto"}`},
          0,
          0,
          ${monto}
        )
      `;

      console.log("✅ Deuda manual registrada exitosamente");

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error registrando deuda";
      console.error("❌ Error en deuda manual:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProduct = async (id: string, updates: any) => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error(
          "No hay conexión a la base de datos. Funcionalidad limitada en modo offline."
        );
      }

      let categoria_id;
      if (updates.category) {
        const categoriaResult = await sql`
          SELECT id FROM categorias 
          WHERE nombre = ${updates.category}
          LIMIT 1
        `;
        if (categoriaResult.length === 0) {
          const newCategoria = await sql`
            INSERT INTO categorias (nombre) 
            VALUES (${updates.category}) 
            RETURNING id
          `;
          categoria_id = newCategoria[0].id;
        } else {
          categoria_id = categoriaResult[0].id;
        }
      }

      let subcategoria_id;
      if (updates.subcategory) {
        const subcatResult = await sql`
          SELECT id FROM subcategorias 
          WHERE nombre = ${updates.subcategory} AND categoria_id = ${categoria_id}
          LIMIT 1
        `;
        if (subcatResult.length === 0) {
          if (!categoria_id)
            throw new Error("No se puede crear subcategoría sin categoría");
          const newSubcat = await sql`
            INSERT INTO subcategorias (nombre, categoria_id)
            VALUES (${updates.subcategory}, ${categoria_id})
            RETURNING id
          `;
          subcategoria_id = newSubcat[0].id;
        } else {
          subcategoria_id = subcatResult[0].id;
        }
      }

      const updateFields = [];
      if (updates.code) updateFields.push(`codigo = '${updates.code}'`);
      if (updates.name) updateFields.push(`nombre = '${updates.name}'`);
      if (updates.description !== undefined)
        updateFields.push(
          `descripcion = ${
            updates.description
              ? `'${updates.description.replace(/'/g, "''")}'`
              : "NULL"
          }`
        );
      if (categoria_id) updateFields.push(`categoria_id = '${categoria_id}'`);
      if (subcategoria_id !== undefined)
        updateFields.push(
          `subcategoria_id = ${
            subcategoria_id ? `'${subcategoria_id}'` : "NULL"
          }`
        );
      if (updates.quantity !== undefined)
        updateFields.push(`stock_actual = ${updates.quantity}`);
      if (updates.minStock !== undefined)
        updateFields.push(`stock_minimo = ${updates.minStock}`);
      if (updates.cost !== undefined)
        updateFields.push(`costo_unitario = ${updates.cost}`);
      if (updates.price !== undefined)
        updateFields.push(`precio_venta = ${updates.price}`);
      if (updates.imageUrl !== undefined)
        updateFields.push(
          `imagen_url = ${
            updates.imageUrl
              ? `'${updates.imageUrl.replace(/'/g, "''")}'`
              : "NULL"
          }`
        );

      if (updateFields.length === 0)
        throw new Error("No hay campos para actualizar");

      await sql`
        UPDATE productos
        SET ${sql.unsafe(updateFields.join(", "))}
        WHERE id = ${id}
      `;

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar producto";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const registrarPagoParcial = async (
    clienteId: number,
    monto: number
  ): Promise<boolean> => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error("No hay conexión a la base de datos.");
      }

      if (monto <= 0) {
        throw new Error("El monto debe ser mayor a 0");
      }

      const cliente = await sql`
        SELECT saldo_pendiente, nombre FROM clientes_ventas WHERE id = ${clienteId}
      `;

      if (cliente.length === 0) {
        throw new Error("Cliente no encontrado");
      }

      if (monto > parseFloat(cliente[0].saldo_pendiente)) {
        throw new Error("El monto supera la deuda total");
      }

      const clienteNombre = cliente[0].nombre;
      const today = new Date().toISOString().split("T")[0];

      console.log(
        `💰 Registrando pago parcial de $${monto} para ${clienteNombre}`
      );

      await sql`
        UPDATE clientes_ventas 
        SET saldo_pendiente = saldo_pendiente - ${monto}
        WHERE id = ${clienteId}
      `;

      const ventasAbiertas = await sql`
        SELECT id, saldo_pendiente 
        FROM ventas_fiado 
        WHERE cliente_id = ${clienteId} AND saldo_pendiente > 0
        ORDER BY fecha ASC
      `;

      let montoRestante = monto;

      for (const venta of ventasAbiertas) {
        if (montoRestante <= 0) break;

        const saldoVenta = parseFloat(venta.saldo_pendiente);
        const descuento = Math.min(montoRestante, saldoVenta);

        await sql`
          UPDATE ventas_fiado 
          SET saldo_pendiente = saldo_pendiente - ${descuento}
          WHERE id = ${venta.id}
        `;

        montoRestante -= descuento;
      }

      await sql`
        INSERT INTO movimientos (
          producto_id, 
          fecha, 
          tipo, 
          cantidad, 
          motivo, 
          stock_antes, 
          stock_despues, 
          valor_total
        ) VALUES (
          NULL,
          ${new Date().toISOString()},
          'Entrada',
          0,
          ${`PAGO DE ${clienteNombre} - $${monto.toLocaleString()}`},
          0,
          0,
          ${monto}
        )
      `;

      console.log("✅ Pago registrado en movimientos");

      await sql`
        INSERT INTO pagos (cliente_id, monto, fecha)
        VALUES (${clienteId}, ${monto}, NOW())
      `;

      console.log("✅ Pago registrado en historial del cliente");

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al registrar pago parcial";
      console.error("❌ Error en pago parcial:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateBarcode = async (id: string, barcode: string) => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error("No hay conexión a la base de datos.");
      }

      const barcodeValue = barcode.trim() || null;

      await sql`
        UPDATE productos 
        SET codigo_barras = ${barcodeValue}
        WHERE id = ${id}
      `;

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al actualizar código de barras";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error(
          "No hay conexión a la base de datos. Funcionalidad limitada en modo offline."
        );
      }

      console.log("🗑️ Desactivando producto (soft delete):", id);

      await sql`
        UPDATE productos SET deleted_at = NOW() WHERE id = ${id}
      `;

      console.log("✅ Producto desactivado exitosamente");

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar producto";
      console.error("❌ Error eliminando producto:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addMovement = async (
    productId: string,
    type: "entrada" | "salida",
    quantity: number,
    reason: string,
    price?: number
  ) => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error(
          "No hay conexión a la base de datos. Funcionalidad limitada en modo offline."
        );
      }

      if (!reason.trim()) {
        throw new Error("El motivo del movimiento es obligatorio");
      }

      const producto = await sql`
        SELECT stock_actual, precio_venta 
        FROM productos 
        WHERE id = ${productId}
      `;

      if (producto.length === 0) {
        throw new Error("Producto no encontrado");
      }

      const stockAntes = producto[0].stock_actual;

      // ✅ CORREGIDO: entrada (venta) resta stock, salida (compra) suma stock
      const stockDespues =
        type === "entrada" ? stockAntes - quantity : stockAntes + quantity;

      // ✅ CORREGIDO: Validar stock insuficiente cuando es ENTRADA (venta)
      if (type === "entrada" && stockDespues < 0) {
        throw new Error(
          `Stock insuficiente. Disponible: ${stockAntes}, Solicitado: ${quantity}`
        );
      }

      const precioFinal =
        price !== undefined ? price : producto[0].precio_venta;
      const valorTotal = precioFinal * quantity;

      await sql`
        INSERT INTO movimientos (
          producto_id, fecha, tipo, cantidad, motivo, 
          stock_antes, stock_despues, valor_total
        ) VALUES (
          ${productId}, ${new Date().toISOString()},
          ${type === "entrada" ? "Entrada" : "Salida"}, ${quantity}, 
          ${reason.trim()}, ${stockAntes}, ${stockDespues}, 
          ${valorTotal}
        )
      `;

      await sql`
        UPDATE productos 
        SET stock_actual = ${stockDespues} 
        WHERE id = ${productId}
      `;

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al procesar movimiento";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePricesByCategory = async (
    category: string,
    percentage: number
  ) => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error(
          "No hay conexión a la base de datos. Funcionalidad limitada en modo offline."
        );
      }

      const categoriaData = await sql`
        SELECT id FROM categorias 
        WHERE nombre = ${category}
        LIMIT 1
      `;

      if (categoriaData.length === 0) {
        throw new Error("Categoría no encontrada");
      }

      const productos = await sql`
        SELECT id, precio_venta 
        FROM productos 
        WHERE categoria_id = ${categoriaData[0].id} 
        AND deleted_at IS NULL
      `;

      for (const producto of productos) {
        const newPrice = Math.round(
          producto.precio_venta * (1 + percentage / 100)
        );
        await sql`
          UPDATE productos 
          SET precio_venta = ${newPrice} 
          WHERE id = ${producto.id}
        `;
      }

      await loadAllData();
      return productos;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar precios";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearAllMovements = async () => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error("No hay conexión a la base de datos.");
      }

      console.log("🗑️ Eliminando todos los movimientos...");

      await sql`DELETE FROM movimientos`;

      await loadAllData();
      console.log("✅ Todos los movimientos eliminados");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar movimientos";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getLowStockAlerts = (): StockAlert[] => {
    return products
      .filter((product) => product.quantity <= product.minStock)
      .map((product) => ({
        product,
        currentStock: product.quantity,
        minStock: product.minStock,
        difference: product.minStock - product.quantity,
      }));
  };

  const getMovementsByProduct = (productId: string) => {
    return movements
      .filter((movement) => movement.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const addMovementBulk = async (
    items: Array<{ productId: string; quantity: number }>
  ) => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error("No hay conexión a la base de datos.");
      }

      const reason = "Venta rápida";
      const today = new Date().toISOString().split("T")[0];

      for (const item of items) {
        const producto = await sql`
          SELECT stock_actual, precio_venta 
          FROM productos 
          WHERE id = ${item.productId}
        `;

        if (producto.length === 0) {
          throw new Error("Producto no encontrado");
        }

        const stockAntes = producto[0].stock_actual;
        const stockDespues = stockAntes - item.quantity;

        if (stockDespues < 0) {
          throw new Error(`Stock insuficiente en ${item.productId}`);
        }

        await sql`
          INSERT INTO movimientos (
            producto_id, fecha, tipo, cantidad, motivo, 
            stock_antes, stock_despues, valor_total
          ) VALUES (
            ${item.productId}, ${new Date().toISOString()}, 'Entrada', ${item.quantity}, 
            ${reason}, ${stockAntes}, ${stockDespues}, 
            ${producto[0].precio_venta * item.quantity}
          )
        `;

        await sql`
          UPDATE productos 
          SET stock_actual = ${stockDespues} 
          WHERE id = ${item.productId}
        `;
      }

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al procesar ventas";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getPriceHistoryByProduct = (productId: string) => {
    return priceHistory
      .filter((price) => price.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getTotalInventoryValue = () => {
    return products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  const getTotalInventoryCost = () => {
    return products.reduce(
      (total, product) => total + product.cost * product.quantity,
      0
    );
  };

  const addVentaFiado = async (
    clienteId: number,
    productos: Array<{ productoId: string; cantidad: number }>
  ) => {
    try {
      setError(null);
      if (connectionStatus === "offline")
        throw new Error("No hay conexión a la base de datos.");

      let total = 0;
      const productosConPrecio: any[] = [];

      const clienteData = await sql`
        SELECT nombre FROM clientes_ventas WHERE id = ${clienteId}
      `;
      const clienteNombre = clienteData[0]?.nombre || `Cliente ${clienteId}`;

      for (const item of productos) {
        const prod = await sql`
          SELECT precio_venta, stock_actual, nombre FROM productos WHERE id = ${item.productoId}
        `;

        if (prod.length === 0) throw new Error(`Producto no encontrado`);
        if (prod[0].stock_actual < item.cantidad)
          throw new Error(`Stock insuficiente de ${prod[0].nombre}`);

        const subtotal = prod[0].precio_venta * item.cantidad;
        total += subtotal;

        productosConPrecio.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio: prod[0].precio_venta,
          nombre: prod[0].nombre,
          subtotal,
        });
      }

      const ventaResult = await sql`
        INSERT INTO ventas_fiado (cliente_id, total, saldo_pendiente)
        VALUES (${clienteId}, ${total}, ${total})
        RETURNING id
      `;

      const ventaId = ventaResult[0].id;
      const today = new Date().toISOString().split("T")[0];

      for (const item of productosConPrecio) {
        await sql`
          INSERT INTO ventas_fiado_detalle 
          (venta_fiado_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
          VALUES (${ventaId}, ${item.productoId}, ${item.nombre}, ${item.cantidad}, ${item.precio}, ${item.subtotal})
        `;

        const stockAntes = await sql`
          SELECT stock_actual FROM productos WHERE id = ${item.productoId}
        `;
        const stockActual = stockAntes[0].stock_actual;
        const stockDespues = stockActual - item.cantidad;

        await sql`
          UPDATE productos SET stock_actual = stock_actual - ${item.cantidad}
          WHERE id = ${item.productoId}
        `;

        await sql`
          INSERT INTO movimientos (
            producto_id, fecha, tipo, cantidad, motivo, 
            stock_antes, stock_despues, valor_total
          ) VALUES (
            ${item.productoId}, 
            ${new Date().toISOString()}, 
            'Salida', 
            ${item.cantidad}, 
            ${`FIADO A ${clienteNombre}`},
            ${stockActual},
            ${stockDespues},
            ${item.subtotal}
          )
        `;
      }

      await sql`
        UPDATE clientes_ventas SET saldo_pendiente = saldo_pendiente + ${total}
        WHERE id = ${clienteId}
      `;

      await loadAllData();
      return { success: true, ventaId, total };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error registrando venta";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const marcarProductosPagados = async (
    detalleIds: number[],
    ventaId: number
  ) => {
    try {
      setError(null);
      if (connectionStatus === "offline")
        throw new Error("No hay conexión a la base de datos.");

      let totalPagado = 0;
      const venta =
        await sql`SELECT cliente_id FROM ventas_fiado WHERE id = ${ventaId}`;

      if (venta.length === 0) throw new Error("Venta no encontrada");

      const clienteId = venta[0].cliente_id;

      for (const detalleId of detalleIds) {
        const detalle = await sql`
          SELECT subtotal, pagado FROM ventas_fiado_detalle WHERE id = ${detalleId}
        `;

        if (detalle.length === 0 || detalle[0].pagado) continue;

        await sql`
          UPDATE ventas_fiado_detalle 
          SET pagado = true, pagado_en = NOW()
          WHERE id = ${detalleId}
        `;

        totalPagado += parseFloat(detalle[0].subtotal);
      }

      if (totalPagado > 0) {
        await sql`
          UPDATE ventas_fiado 
          SET saldo_pendiente = saldo_pendiente - ${totalPagado}
          WHERE id = ${ventaId}
        `;

        await sql`
          UPDATE clientes_ventas 
          SET saldo_pendiente = saldo_pendiente - ${totalPagado}
          WHERE id = ${clienteId}
        `;

        await sql`
          INSERT INTO pagos (cliente_id, venta_fiado_id, monto)
          VALUES (${clienteId}, ${ventaId}, ${totalPagado})
        `;
      }

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error marcando pagos";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getVentasByCliente = (clienteId: number) => {
    return ventasFiado.filter((v) => v.clienteId === clienteId);
  };

  const deleteCliente = async (clienteId: number): Promise<boolean> => {
    try {
      setError(null);

      if (connectionStatus === "offline") {
        throw new Error("No hay conexión a la base de datos.");
      }

      console.log("🗑️ Eliminando cliente y sus ventas asociadas...");

      const ventas = await sql`
        SELECT id FROM ventas_fiado WHERE cliente_id = ${clienteId}
      `;

      if (ventas.length > 0) {
        const ventaIds = ventas.map((v: any) => v.id);

        for (const ventaId of ventaIds) {
          await sql`
            DELETE FROM ventas_fiado_detalle 
            WHERE venta_fiado_id = ${ventaId}
          `;
        }
        console.log(`✅ Eliminados detalles de ${ventaIds.length} ventas`);

        await sql`
          DELETE FROM pagos 
          WHERE cliente_id = ${clienteId}
        `;
        console.log("✅ Eliminados pagos del cliente");

        for (const ventaId of ventaIds) {
          await sql`
            DELETE FROM ventas_fiado 
            WHERE id = ${ventaId}
          `;
        }
        console.log(`✅ Eliminadas ${ventaIds.length} ventas`);
      }

      await sql`
        DELETE FROM clientes_ventas 
        WHERE id = ${clienteId}
      `;
      console.log("✅ Cliente eliminado exitosamente");

      await loadAllData();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar cliente";
      console.error("❌ Error eliminando cliente:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    products,
    movements,
    priceHistory,
    clientesVentas,
    ventasFiado,
    pagos,
    loading,
    error,
    connectionStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    updateBarcode,
    addMovement,
    addMovementBulk,
    clearAllMovements,
    getLowStockAlerts,
    getMovementsByProduct,
    getPriceHistoryByProduct,
    updatePricesByCategory,
    getTotalInventoryValue,
    getTotalInventoryCost,
    addCliente,
    addVentaFiado,
    marcarProductosPagados,
    getVentasByCliente,
    deleteCliente,
    registrarPagoParcial,
    addDeudaDirecta,
    refreshData: loadAllData,
    retryConnection: initializeConnection,
  };
}

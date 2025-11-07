import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon'; // Ajusta la ruta

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⬅️ CAMBIO 1: Especificar que es Promise
) {
  try {
    // ⬅️ CAMBIO 2: Usar await para obtener params
    const { id } = await params;
    
    console.log("📥 Parámetro recibido:", id, "Tipo:", typeof id);

    const clienteId = parseInt(id, 10);
    
    console.log("🔢 ID parseado:", clienteId, "Es número:", !isNaN(clienteId));

    if (isNaN(clienteId) || clienteId <= 0) {
      console.error("❌ ID inválido:", id);
      return NextResponse.json(
        { error: `ID de cliente inválido: ${id}` },
        { status: 400 }
      );
    }

    console.log("🗑️ Eliminando cliente:", clienteId);

    // 1. Obtener ventas del cliente
    const ventas = await sql`
      SELECT id FROM ventas_fiado WHERE cliente_id = ${clienteId}
    `;

    console.log("📊 Ventas encontradas:", ventas.length);

    if (ventas.length > 0) {
      const ventaIds = ventas.map((v: any) => v.id);
      
      // 2. Eliminar detalles de ventas
      for (const ventaId of ventaIds) {
        await sql`
          DELETE FROM ventas_fiado_detalle 
          WHERE venta_fiado_id = ${ventaId}
        `;
      }
      console.log(`✅ Eliminados detalles de ${ventaIds.length} ventas`);

      // 3. Eliminar pagos
      await sql`
        DELETE FROM pagos 
        WHERE cliente_id = ${clienteId}
      `;
      console.log("✅ Eliminados pagos del cliente");

      // 4. Eliminar ventas
      for (const ventaId of ventaIds) {
        await sql`
          DELETE FROM ventas_fiado 
          WHERE id = ${ventaId}
        `;
      }
      console.log(`✅ Eliminadas ${ventaIds.length} ventas`);
    }

    // 5. Eliminar cliente
    await sql`
      DELETE FROM clientes_ventas 
      WHERE id = ${clienteId}
    `;
    
    console.log("✅ Cliente eliminado exitosamente");

    return NextResponse.json({ 
      success: true, 
      message: 'Cliente eliminado correctamente',
      deletedId: clienteId
    });

  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al eliminar el cliente: ${errorMessage}` },
      { status: 500 }
    );
  }
}

import { neon } from '@neondatabase/serverless'

// Usar variable pública para acceso desde el cliente
const databaseUrl = process.env.NEXT_PUBLIC_DATABASE_URL

if (!databaseUrl) {
  console.error("❌ NEXT_PUBLIC_DATABASE_URL no está configurada")
  console.log("🔍 Variables disponibles:", Object.keys(process.env).filter(key => key.includes('DATABASE')))
  throw new Error("NEXT_PUBLIC_DATABASE_URL is required")
}

console.log("✅ Neon Database URL configurada:", databaseUrl.substring(0, 50) + "...")

// Cliente SQL para Neon
export const sql = neon(databaseUrl)

// Función para verificar la conexión con las tablas
export const testConnection = async () => {
  try {
    console.log("🔄 Probando conexión a Neon...")

    const productosData = await sql`SELECT id FROM productos LIMIT 1`
    console.log("✅ Tabla productos encontrada")

    await sql`SELECT id FROM categorias LIMIT 1`
    console.log("✅ Tabla categorias encontrada")

    await sql`SELECT id FROM movimientos LIMIT 1`
    console.log("✅ Tabla movimientos encontrada")

    console.log("✅ Conexión a Neon exitosa - Todas las tablas encontradas")
    return {
      success: true,
      message: "Conexión exitosa a Neon",
      data: productosData,
    }
  } catch (error: any) {
    console.error("❌ Error de conexión:", error)

    if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      return {
        success: false,
        message: "Alguna tabla no existe. Verifica que hayas ejecutado el script de creación de tablas.",
        errorType: "TABLE_NOT_FOUND",
      }
    }

    if (error.message?.includes("authentication")) {
      return {
        success: false,
        message: "Error de autenticación. Verifica tu DATABASE_URL.",
        errorType: "INVALID_CREDENTIALS",
      }
    }

    if (error.message?.includes("connect")) {
      return {
        success: false,
        message: "Error de conexión. Verifica tu conexión a internet y la URL de Neon.",
        errorType: "NETWORK_ERROR",
      }
    }

    return {
      success: false,
      message: error.message || "Error desconocido de conexión",
      errorType: "UNKNOWN_ERROR",
    }
  }
}

// Función para verificar configuración
export const checkConfiguration = () => {
  const config = {
    hasUrl: !!databaseUrl,
    url: databaseUrl,
    urlValid: databaseUrl ? databaseUrl.startsWith("postgresql://") && databaseUrl.includes("neon.tech") : false,
  }

  console.log("🔧 Configuración Neon:", config)
  return config
}

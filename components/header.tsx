"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Menu, X, Package, DollarSign, TrendingUp, AlertTriangle, Receipt, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  onNavigate?: (section: string) => void
  currentSection?: string
  stats?: {
    totalProducts: number
    totalValue: number
    movements: number
    alerts: number
  }
  onLogout?: () => void // NUEVA PROP PARA LOGOUT
}

export function Header({ onNavigate, currentSection = "products", stats, onLogout }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  const menuItems = [
    {
      id: 'products',
      label: 'Ver Productos',
      icon: Package,
      description: 'Lista completa del inventario',
      color: 'text-red-600'
    },
    {
      id: 'add',
      label: 'Agregar Producto',
      icon: Package,
      description: 'Nuevo producto al inventario',
      color: 'text-red-600'
    },
    {
      id: 'movements',
      label: 'Movimientos',
      icon: TrendingUp,
      description: 'Historial de entradas y salidas',
      color: 'text-purple-600'
    },
    {
      id: 'alerts',
      label: 'Alertas de Stock',
      icon: AlertTriangle,
      description: 'Productos con stock bajo',
      color: stats?.alerts && stats.alerts > 0 ? 'text-red-600' : 'text-gray-400'
    },
    {
      id: 'billing',
      label: 'Facturación',
      icon: Receipt,
      description: 'Generar facturas',
      color: 'text-indigo-600'
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: DollarSign,
      description: 'Análisis y estadísticas',
      color: 'text-emerald-600'
    }
  ]

  const handleMenuItemClick = (itemId: string) => {
    if (onNavigate) {
      onNavigate(itemId)
    }
    setIsMobileMenuOpen(false)
  }

  if (!mounted) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shadow-md transition-colors duration-200 ${
            isDark ? 'bg-red-500' : 'bg-red-600'
          }`}>
            <span className="text-white font-extrabold text-sm sm:text-lg select-none">E</span>
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl md:text-2xl font-semibold leading-none select-none transition-colors duration-200 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`}>
              ELECTROLUXSTORE
            </h1>
            <p className={`text-xs md:text-sm font-medium tracking-wide hidden sm:block transition-colors duration-200 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Sistema de Gestión de Inventarios
            </p>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`border-b shadow-sm transition-colors duration-200 z-50 ${
      isDark 
        ? 'bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 border-gray-800' 
        : 'bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-gray-200'
    }`}>
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8">
        {/* Logo + Title - ELECTROLUXSTORE */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shadow-md transition-colors duration-200 ${
            isDark ? 'bg-red-500' : 'bg-red-600'
          }`}>
            <span className="text-white font-extrabold text-sm sm:text-lg select-none">E</span>
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl md:text-2xl font-semibold leading-none select-none transition-colors duration-200 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`}>
              ELECTROLUXSTORE
            </h1>
            <p className={`text-xs md:text-sm font-medium tracking-wide hidden sm:block transition-colors duration-200 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Sistema de Gestión de Inventarios
            </p>
          </div>
        </div>

        {/* Controles de la derecha - CON BOTÓN LOGOUT AGREGADO */}
        <div className="flex items-center gap-2">
          {/* Toggle de tema */}
          <Button
            variant="outline"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`relative transition-all duration-200 hover:scale-105 h-8 w-8 sm:h-10 sm:w-10 ${
              isDark 
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Sun className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all duration-300 ${
              isDark ? '-rotate-90 scale-0' : 'text-yellow-500'
            }`} />
            <Moon className={`absolute h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all duration-300 ${
              isDark ? 'rotate-0 scale-100 text-red-400' : 'text-gray-700'
            }`} />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          {/* BOTÓN DE LOGOUT - NUEVO */}
          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 hidden sm:flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Salir</span>
            </Button>
          )}

          {/* Menú móvil con texto "Menú" */}
          <Button
            variant="outline"
            size="sm"
            aria-label="Menú principal"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`transition-all duration-200 flex items-center gap-2 px-3 h-8 sm:h-10 ${
              isDark 
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {isMobileMenuOpen ? (
              <>
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Cerrar</span>
              </>
            ) : (
              <>
                <Menu className="h-4 w-4" />
                <span className="text-sm font-medium">Menú</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Menú móvil desplegable */}
      {isMobileMenuOpen && (
        <div className={`border-t transition-colors duration-200 ${
          isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          <div className="container mx-auto px-3 sm:px-4 py-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              {/* BOTÓN LOGOUT EN MÓVIL - NUEVO */}
              {onLogout && (
                <div className="sm:hidden">
                  <Button
                    variant="outline"
                    onClick={onLogout}
                    className="w-full text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </Button>
                  <div className={`border-t mt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>
                </div>
              )}

              {/* Cards de métricas compactas */}
              <div className="grid grid-cols-2 gap-3">
                <Card className={`${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-red-50 border-red-200'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-lg font-bold text-red-600">{stats?.totalProducts || 0}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-red-700'}`}>
                          Total Productos
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-lg font-bold text-emerald-600">
                          ${(stats?.totalValue || 0).toLocaleString()}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-emerald-700'}`}>
                          Valor Inventario
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${
                    isDark ? 'bg-gray-800 border-gray-700 hover:bg-purple-900/20' : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                  }`}
                  onClick={() => handleMenuItemClick('movements')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-lg font-bold text-purple-600">{stats?.movements || 0}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-purple-700'}`}>
                          Movimientos
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${
                    stats?.alerts && stats.alerts > 0
                      ? (isDark ? 'bg-red-900/20 border-red-800 hover:bg-red-900/30' : 'bg-red-50 border-red-200 hover:bg-red-100')
                      : (isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}
                  onClick={() => handleMenuItemClick('alerts')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        stats?.alerts && stats.alerts > 0 ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <p className={`text-lg font-bold ${
                          stats?.alerts && stats.alerts > 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {stats?.alerts || 0}
                        </p>
                        <p className={`text-xs ${
                          stats?.alerts && stats.alerts > 0 
                            ? (isDark ? 'text-red-400' : 'text-red-700')
                            : (isDark ? 'text-gray-500' : 'text-gray-600')
                        }`}>
                          Alertas Stock
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Separador */}
              <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>
              
              {/* Items del menú */}
              <div className="space-y-2">
                <h3 className={`font-semibold text-sm ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {menuItems.slice(0, 4).map((item) => {
                    const Icon = item.icon
                    const isActive = currentSection === item.id
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => handleMenuItemClick(item.id)}
                        className={`justify-start h-12 ${
                          isActive 
                            ? '' 
                            : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                        }`}
                      >
                        <Icon className={`h-4 w-4 mr-3 ${item.color}`} />
                        <div className="text-left">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className={`font-semibold text-sm ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Más Opciones
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {menuItems.slice(4).map((item) => {
                    const Icon = item.icon
                    const isActive = currentSection === item.id
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => handleMenuItemClick(item.id)}
                        className={`justify-center h-16 flex-col ${
                          isActive 
                            ? '' 
                            : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1 ${item.color}`} />
                        <span className="text-xs font-medium">{item.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
              
              {/* Estado del sistema */}
              <div className={`mt-4 p-3 rounded-lg border-t ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isDark ? 'bg-red-400' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Sistema Activo
                    </span>
                  </div>
                  <span className={`text-xs ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    v1.0.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
